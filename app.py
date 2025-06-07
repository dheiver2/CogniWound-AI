from flask import Flask, request, jsonify, send_from_directory, make_response
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image
import io
import logging
import traceback
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from datetime import datetime
import json
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis
import hashlib
import base64

# Import our custom modules
from utils import process_image_for_analysis
from export import create_pdf_report

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Carrega variáveis de ambiente
load_dotenv()

# Configuração da API do Google
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY não encontrada no arquivo .env")

genai.configure(api_key=GOOGLE_API_KEY)

# Inicializa o app Flask
app = Flask(__name__, static_folder='static')
CORS(app)

# Initialize Flask extensions with memory storage by default
cache_config = {
    'CACHE_TYPE': 'simple',
    'CACHE_DEFAULT_TIMEOUT': 300
}

# Try Redis only if explicitly configured
redis_url = os.getenv('REDIS_URL')
if redis_url:
    try:
        redis_client = redis.Redis.from_url(redis_url)
        redis_client.ping()  # Test connection
        cache_config = {
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_URL': redis_url,
            'CACHE_DEFAULT_TIMEOUT': 300
        }
        logger.info("Usando cache Redis")
    except (redis.ConnectionError, redis.ResponseError) as e:
        logger.warning(f"Redis não disponível ({str(e)}), usando cache em memória")

cache = Cache(app, config=cache_config)

# Initialize rate limiter with memory storage
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    storage_uri="memory://",  # Use memory storage
    default_limits=["200 per day", "50 per hour"],
    strategy="fixed-window"  # Use fixed window strategy for memory storage
)
logger.info("Rate limiter usando armazenamento em memória")

# Inicializa o modelo Gemini
try:
    model = genai.GenerativeModel('gemini-2.5-flash-preview-05-20')
    logger.info("Modelo Gemini inicializado com sucesso")
except Exception as e:
    logger.error(f"Erro ao inicializar o modelo Gemini: {str(e)}")
    raise

# Configurações de segurança para o modelo
safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    }
]

# Prompt para análise de feridas
ANALYSIS_PROMPT = """
Analise esta imagem de ferida e forneça uma análise estruturada em português, seguindo exatamente este formato:

DESCRIÇÃO GERAL:
- Forneça uma descrição concisa e objetiva da ferida
- Inclua localização, tamanho aproximado e forma geral
- Limite a 2-3 frases

CARACTERÍSTICAS VISUAIS:
- Liste as características visuais principais
- Inclua cor, textura e padrões observáveis
- Use marcadores para cada característica
- Limite a 3-4 características

SINAIS DE INFECÇÃO:
- Liste os sinais de infecção observados
- Use marcadores para cada sinal
- Se não houver sinais claros, indique "Nenhum sinal evidente de infecção"
- Limite a 2-3 sinais

ESTÁGIO DA FERIDA:
- Identifique o estágio da ferida (I a IV)
- Justifique brevemente a classificação
- Limite a 1-2 frases

RECOMENDAÇÕES:
- Liste recomendações específicas e práticas
- Use marcadores para cada recomendação
- Limite a 3-4 recomendações

IMPORTANTE:
- Seja conciso e objetivo
- Use linguagem médica apropriada
- Mantenha cada seção dentro dos limites especificados
- Não inclua informações além do solicitado
- Não adicione cabeçalhos ou formatação extra
"""

# Configurações
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Image processing constants
MIN_IMAGE_SIZE = (100, 100)  # Minimum image dimensions
MAX_IMAGE_SIZE = (4096, 4096)  # Maximum image dimensions
ALLOWED_ASPECT_RATIOS = [(1, 1), (4, 3), (3, 4), (16, 9), (9, 16)]  # Common aspect ratios
MIN_IMAGE_QUALITY = 0.5  # Minimum image quality (0-1)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def parse_analysis(text):
    """Converte o texto da análise em um dicionário estruturado."""
    sections = {
        'descricao_geral': '',
        'caracteristicas_visuais': '',
        'sinais_infeccao': '',
        'estagio_ferida': '',
        'recomendacoes': ''
    }
    
    current_section = None
    lines = text.strip().split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Identifica seções
        if line.startswith('DESCRIÇÃO GERAL:'):
            current_section = 'descricao_geral'
            continue
        elif line.startswith('CARACTERÍSTICAS VISUAIS:'):
            current_section = 'caracteristicas_visuais'
            continue
        elif line.startswith('SINAIS DE INFECÇÃO:'):
            current_section = 'sinais_infeccao'
            continue
        elif line.startswith('ESTÁGIO DA FERIDA:'):
            current_section = 'estagio_ferida'
            continue
        elif line.startswith('RECOMENDAÇÕES:'):
            current_section = 'recomendacoes'
            continue
            
        # Adiciona conteúdo à seção atual
        if current_section and line:
            if sections[current_section]:
                sections[current_section] += '\n' + line
            else:
                sections[current_section] = line
    
    return sections

@app.route('/')
def landing():
    return send_from_directory('static', 'landing.html')

@app.route('/app')
def app_page():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

def validate_image_dimensions(image):
    """Validate image dimensions and aspect ratio."""
    width, height = image.size
    aspect_ratio = width / height
    
    # Check minimum dimensions
    if width < MIN_IMAGE_SIZE[0] or height < MIN_IMAGE_SIZE[1]:
        raise ValueError(f"Imagem muito pequena. Dimensões mínimas: {MIN_IMAGE_SIZE[0]}x{MIN_IMAGE_SIZE[1]} pixels")
    
    # Check maximum dimensions
    if width > MAX_IMAGE_SIZE[0] or height > MAX_IMAGE_SIZE[1]:
        raise ValueError(f"Imagem muito grande. Dimensões máximas: {MAX_IMAGE_SIZE[0]}x{MAX_IMAGE_SIZE[1]} pixels")
    
    # Check aspect ratio
    valid_ratio = False
    for w, h in ALLOWED_ASPECT_RATIOS:
        if abs(aspect_ratio - (w/h)) < 0.1:  # Allow 10% tolerance
            valid_ratio = True
            break
    
    if not valid_ratio:
        raise ValueError("Proporção da imagem não suportada. Use proporções comuns como 1:1, 4:3, 16:9")

def preprocess_image(image):
    """Preprocess image for better analysis."""
    # Convert PIL Image to OpenCV format
    img_array = np.array(image)
    img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Basic image enhancement
    # 1. Auto contrast
    lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
    cl = clahe.apply(l)
    enhanced = cv2.merge((cl,a,b))
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    # 2. Denoise
    denoised = cv2.fastNlMeansDenoisingColored(enhanced, None, 10, 10, 7, 21)
    
    # 3. Sharpen
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(denoised, -1, kernel)
    
    # Convert back to PIL Image
    return Image.fromarray(cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB))

def validate_image_quality(image):
    """Validate image quality using various metrics."""
    # Convert to grayscale for analysis
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    
    # Calculate image quality metrics
    # 1. Blur detection using Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < 100:  # Threshold for blur detection
        raise ValueError("Imagem muito borrada. Por favor, use uma imagem mais nítida")
    
    # 2. Check for noise using standard deviation
    std_dev = np.std(gray)
    if std_dev < 20:  # Threshold for noise detection
        raise ValueError("Imagem com muito ruído ou baixo contraste")
    
    return True

def generate_cache_key(image_bytes):
    """Generate a unique cache key for the image."""
    return hashlib.md5(image_bytes).hexdigest()

@app.route('/analyze', methods=['POST'])
@limiter.limit("10 per minute")
def analyze_image():
    try:
        logger.info("Recebendo requisição de análise de imagem")
        
        if 'image' not in request.files:
            logger.error("Nenhuma imagem enviada na requisição")
            return jsonify({
                'error': 'Nenhuma imagem enviada',
                'status': 'error'
            }), 400

        file = request.files['image']
        if file.filename == '':
            logger.error("Nome do arquivo vazio")
            return jsonify({
                'error': 'Nenhuma imagem selecionada',
                'status': 'error'
            }), 400

        if not allowed_file(file.filename):
            logger.error(f"Tipo de arquivo não permitido: {file.filename}")
            return jsonify({
                'error': 'Tipo de arquivo não permitido. Use JPG, JPEG ou PNG',
                'status': 'error'
            }), 400

        # Get quality level from request
        quality_level = request.form.get('quality_level', 'low')
        if quality_level not in ['low', 'medium', 'high']:
            quality_level = 'low'
        
        logger.info(f"Usando nível de qualidade: {quality_level}")

        # Read image
        image_bytes = file.read()
        
        try:
            # Process and validate image with selected quality level
            processed_image, processed_image_bytes, cache_key = process_image_for_analysis(
                image_bytes, 
                quality_level=quality_level
            )
            
            # Check cache
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.info("Retornando resultado do cache")
                return jsonify(cached_result)
            
            logger.info(f"Imagem processada com sucesso: {file.filename}")
        except ValueError as ve:
            logger.error(f"Erro de validação da imagem: {str(ve)}")
            return jsonify({
                'error': str(ve),
                'status': 'error'
            }), 400
        except Exception as e:
            logger.error(f"Erro ao processar a imagem: {str(e)}")
            return jsonify({
                'error': 'Erro ao processar a imagem',
                'status': 'error'
            }), 400

        # Generate analysis using Gemini
        try:
            logger.info("Iniciando análise com Gemini")
            response = model.generate_content(
                [ANALYSIS_PROMPT, processed_image],
                safety_settings=safety_settings
            )
            logger.info("Análise concluída com sucesso")
        except Exception as e:
            logger.error(f"Erro na análise do Gemini: {str(e)}")
            return jsonify({
                'error': 'Erro ao analisar a imagem',
                'status': 'error'
            }), 500

        # Process response
        if response.text:
            logger.info("Resposta processada com sucesso")
            analysis = parse_analysis(response.text)
            result = {
                'status': 'success',
                'analysis': analysis,
                'cache_key': cache_key,
                'image_data': base64.b64encode(processed_image_bytes).decode('utf-8')
            }
            
            # Cache the result
            cache.set(cache_key, result)
            
            return jsonify(result)
        else:
            logger.error("Resposta vazia do modelo")
            return jsonify({
                'error': 'Não foi possível gerar a análise',
                'status': 'error'
            }), 500

    except Exception as e:
        logger.error(f"Erro não tratado: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': f'Erro ao processar a imagem: {str(e)}',
            'status': 'error'
        }), 500

@app.route('/export/<cache_key>', methods=['GET'])
@limiter.limit("30 per hour")
def export_analysis(cache_key):
    """Export analysis as PDF."""
    try:
        # Get cached result
        cached_result = cache.get(cache_key)
        if not cached_result:
            return jsonify({
                'error': 'Análise não encontrada',
                'status': 'error'
            }), 404
        
        # Get image data from cache
        image_data = base64.b64decode(cached_result['image_data'])
        
        # Generate PDF
        pdf_buffer = create_pdf_report(cached_result['analysis'], image_data)
        
        # Create response
        response = make_response(pdf_buffer.getvalue())
        response.headers['Content-Type'] = 'application/pdf'
        response.headers['Content-Disposition'] = f'attachment; filename=relatorio_ferida_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        
        return response
        
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {str(e)}")
        return jsonify({
            'error': 'Erro ao gerar relatório PDF',
            'status': 'error'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'medical-image-analysis'})

if __name__ == '__main__':
    try:
        # Configuração específica para Windows
        if os.name == 'nt':
            from werkzeug.serving import run_simple
            logger.info("Iniciando servidor em modo Windows")
            run_simple('localhost', 5000, app, use_reloader=True, use_debugger=True)
        else:
            logger.info("Iniciando servidor em modo padrão")
            app.run(debug=True, host='0.0.0.0', port=5000)
    except Exception as e:
        logger.error(f"Erro ao iniciar o servidor: {str(e)}")
        raise 