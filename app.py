from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
from PIL import Image
import io
import logging
import traceback
from werkzeug.utils import secure_filename

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

@app.route('/analyze', methods=['POST'])
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

        # Lê a imagem
        try:
            image_bytes = file.read()
            image = Image.open(io.BytesIO(image_bytes))
            
            # Verifica se a imagem é válida
            image.verify()
            image = Image.open(io.BytesIO(image_bytes))
            
            logger.info(f"Imagem carregada com sucesso: {file.filename}")
        except Exception as e:
            logger.error(f"Erro ao processar a imagem: {str(e)}")
            return jsonify({
                'error': 'Erro ao processar a imagem',
                'status': 'error'
            }), 400

        # Gera a análise usando o Gemini
        try:
            logger.info("Iniciando análise com Gemini")
            response = model.generate_content(
                [ANALYSIS_PROMPT, image],
                safety_settings=safety_settings
            )
            logger.info("Análise concluída com sucesso")
        except Exception as e:
            logger.error(f"Erro na análise do Gemini: {str(e)}")
            return jsonify({
                'error': 'Erro ao analisar a imagem',
                'status': 'error'
            }), 500

        # Processa a resposta
        if response.text:
            logger.info("Resposta processada com sucesso")
            analysis = parse_analysis(response.text)
            return jsonify({
                'status': 'success',
                'analysis': analysis
            })
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