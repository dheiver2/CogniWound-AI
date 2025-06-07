from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image as RLImage
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from datetime import datetime
import io
from PIL import Image
import logging

logger = logging.getLogger(__name__)

def create_pdf_report(analysis, image_data, filename="relatorio_ferida.pdf"):
    """Create a PDF report of the wound analysis."""
    try:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Add title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30
        )
        story.append(Paragraph("Relatório de Análise de Ferida", title_style))
        story.append(Spacer(1, 20))
        
        # Add timestamp
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        story.append(Paragraph(f"Data da Análise: {timestamp}", styles["Normal"]))
        story.append(Spacer(1, 20))
        
        # Add image
        try:
            img = Image.open(io.BytesIO(image_data))
            img.thumbnail((400, 400))  # Resize image for PDF
            img_byte_arr = io.BytesIO()
            img.save(img_byte_arr, format='PNG')
            img_byte_arr = img_byte_arr.getvalue()
            
            # Add image to PDF
            img = RLImage(io.BytesIO(img_byte_arr), width=400, height=400)
            story.append(img)
            story.append(Spacer(1, 20))
        except Exception as e:
            logger.error(f"Erro ao adicionar imagem ao PDF: {str(e)}")
            story.append(Paragraph("Imagem não disponível", styles["Italic"]))
        
        # Add analysis sections
        sections = {
            "Descrição Geral": analysis['descricao_geral'],
            "Características Visuais": analysis['caracteristicas_visuais'],
            "Sinais de Infecção": analysis['sinais_infeccao'],
            "Estágio da Ferida": analysis['estagio_ferida'],
            "Recomendações": analysis['recomendacoes']
        }
        
        for title, content in sections.items():
            story.append(Paragraph(title, styles["Heading2"]))
            story.append(Spacer(1, 10))
            
            # Split content into paragraphs and add each one
            paragraphs = content.split('\n')
            for para in paragraphs:
                if para.strip():
                    story.append(Paragraph(para.strip(), styles["Normal"]))
            
            story.append(Spacer(1, 20))
        
        # Add disclaimer
        disclaimer = "AVISO: Este relatório foi gerado por um sistema de IA e não substitui o diagnóstico de um profissional médico qualificado."
        story.append(Paragraph(disclaimer, styles["Italic"]))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer
        
    except Exception as e:
        logger.error(f"Erro ao gerar PDF: {str(e)}")
        raise 