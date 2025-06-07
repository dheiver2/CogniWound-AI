import cv2
import numpy as np
from PIL import Image
import io
import hashlib
import logging

logger = logging.getLogger(__name__)

# Image processing constants
MIN_IMAGE_SIZE = (50, 50)  # Reduced minimum dimensions
MAX_IMAGE_SIZE = (8192, 8192)  # Increased maximum dimensions
ALLOWED_ASPECT_RATIOS = [(1, 1), (4, 3), (3, 4), (16, 9), (9, 16), (3, 2), (2, 3)]  # Added more common ratios
MIN_IMAGE_QUALITY = 0.3  # Reduced minimum quality threshold

# Quality level thresholds
QUALITY_LEVELS = {
    'low': {
        'min_size': (50, 50),
        'max_size': (8192, 8192),
        'blur_threshold': 30,
        'noise_threshold': 5,
        'aspect_ratio_tolerance': 0.3,
        'clahe_clip_limit': 1.5,
        'denoise_strength': 3,
        'sharpen_strength': 0.3
    },
    'medium': {
        'min_size': (100, 100),
        'max_size': (4096, 4096),
        'blur_threshold': 50,
        'noise_threshold': 10,
        'aspect_ratio_tolerance': 0.2,
        'clahe_clip_limit': 2.0,
        'denoise_strength': 5,
        'sharpen_strength': 0.5
    },
    'high': {
        'min_size': (200, 200),
        'max_size': (2048, 2048),
        'blur_threshold': 100,
        'noise_threshold': 20,
        'aspect_ratio_tolerance': 0.1,
        'clahe_clip_limit': 3.0,
        'denoise_strength': 10,
        'sharpen_strength': 1.0
    }
}

def get_quality_settings(quality_level='low'):
    """Get quality settings for the specified level."""
    return QUALITY_LEVELS.get(quality_level, QUALITY_LEVELS['low'])

def validate_image_dimensions(image, quality_level='low'):
    """Validate image dimensions and aspect ratio."""
    settings = get_quality_settings(quality_level)
    width, height = image.size
    aspect_ratio = width / height
    
    # Check minimum dimensions
    if width < settings['min_size'][0] or height < settings['min_size'][1]:
        raise ValueError(f"Imagem muito pequena. Dimensões mínimas: {settings['min_size'][0]}x{settings['min_size'][1]} pixels")
    
    # Check maximum dimensions
    if width > settings['max_size'][0] or height > settings['max_size'][1]:
        # Instead of rejecting, resize the image
        max_size = max(settings['max_size'])
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))
        image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        return image
    
    # Check aspect ratio with tolerance based on quality level
    valid_ratio = False
    for w, h in ALLOWED_ASPECT_RATIOS:
        if abs(aspect_ratio - (w/h)) < settings['aspect_ratio_tolerance']:
            valid_ratio = True
            break
    
    if not valid_ratio:
        if quality_level == 'high':
            raise ValueError("Proporção da imagem não suportada. Use proporções comuns como 1:1, 4:3, 16:9")
        else:
            logger.warning(f"Proporção da imagem não ideal: {width}:{height}")
    
    return image

def validate_image_quality(image, quality_level='low'):
    """Validate image quality using various metrics."""
    settings = get_quality_settings(quality_level)
    
    # Convert to grayscale for analysis
    gray = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2GRAY)
    
    # Calculate image quality metrics
    # 1. Blur detection using Laplacian variance
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    if laplacian_var < settings['blur_threshold']:
        if quality_level == 'high':
            raise ValueError("Imagem muito borrada. Por favor, use uma imagem mais nítida")
        else:
            logger.warning("Imagem pode estar um pouco borrada, mas prosseguindo com a análise")
    
    # 2. Check for noise using standard deviation
    std_dev = np.std(gray)
    if std_dev < settings['noise_threshold']:
        if quality_level == 'high':
            raise ValueError("Imagem com muito ruído ou baixo contraste")
        else:
            logger.warning("Imagem pode ter baixo contraste, mas prosseguindo com a análise")
    
    return True

def preprocess_image(image, quality_level='low'):
    """Preprocess image for better analysis."""
    settings = get_quality_settings(quality_level)
    
    try:
        # Convert PIL Image to OpenCV format
        img_array = np.array(image)
        img_cv = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Basic image enhancement
        # 1. Auto contrast
        lab = cv2.cvtColor(img_cv, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=settings['clahe_clip_limit'], tileGridSize=(8,8))
        cl = clahe.apply(l)
        enhanced = cv2.merge((cl,a,b))
        enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
        
        # 2. Denoise
        denoised = cv2.fastNlMeansDenoisingColored(
            enhanced, 
            None, 
            settings['denoise_strength'],
            settings['denoise_strength'],
            settings['denoise_strength'],
            15
        )
        
        # 3. Sharpen
        kernel = np.array([
            [-settings['sharpen_strength'], -settings['sharpen_strength'], -settings['sharpen_strength']],
            [-settings['sharpen_strength'], 1 + 8*settings['sharpen_strength'], -settings['sharpen_strength']],
            [-settings['sharpen_strength'], -settings['sharpen_strength'], -settings['sharpen_strength']]
        ])
        sharpened = cv2.filter2D(denoised, -1, kernel)
        
        # Convert back to PIL Image
        return Image.fromarray(cv2.cvtColor(sharpened, cv2.COLOR_BGR2RGB))
    except Exception as e:
        logger.warning(f"Erro no pré-processamento da imagem: {str(e)}. Retornando imagem original.")
        return image

def generate_cache_key(image_bytes):
    """Generate a unique cache key for the image."""
    return hashlib.md5(image_bytes).hexdigest()

def process_image_for_analysis(image_bytes, quality_level='low'):
    """Process and validate image for analysis."""
    try:
        # Open image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Validate image
        image = validate_image_dimensions(image, quality_level)
        validate_image_quality(image, quality_level)
        
        # Preprocess image
        processed_image = preprocess_image(image, quality_level)
        
        # Convert processed image back to bytes
        img_byte_arr = io.BytesIO()
        processed_image.save(img_byte_arr, format='PNG')
        processed_image_bytes = img_byte_arr.getvalue()
        
        # Generate cache key
        cache_key = generate_cache_key(processed_image_bytes)
        
        return processed_image, processed_image_bytes, cache_key
        
    except Exception as e:
        logger.error(f"Erro no processamento da imagem: {str(e)}")
        raise 