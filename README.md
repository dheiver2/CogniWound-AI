# CogniWound AI: Sistema Inteligente de Análise de Feridas

<div align="center">
  <img src="static/1.jpg" alt="CogniWound AI Logo" width="200"/>
  <br/>
  <p><strong>Sistema de Análise de Feridas com Inteligência Artificial</strong></p>
</div>

## 📋 Sobre o Projeto

O CogniWound AI é uma solução inovadora que utiliza inteligência artificial (Google Gemini API) para auxiliar profissionais de saúde na análise de imagens de feridas. Desenvolvido com tecnologias web modernas e uma interface intuitiva, o sistema oferece análises detalhadas e recomendações baseadas em IA.

## ✨ Funcionalidades

### 🎯 Principais Recursos
- **Análise Inteligente**: Processamento de imagens via Google Gemini API
- **Interface Moderna**: Design responsivo e acessível
- **Upload Flexível**: Suporte para JPG, JPEG e PNG (até 5MB)
- **Resultados Detalhados**: Análise completa com características, estágio e recomendações
- **Histórico Local**: Armazenamento seguro das análises anteriores
- **Landing Page Informativa**: Apresentação clara do sistema e suas capacidades

### 🔍 Detalhes Técnicos
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Python com Flask
- **IA**: Google Gemini API
- **Armazenamento**: Local Storage (navegador)
- **Design**: Interface responsiva e acessível

## 🚀 Começando

### Pré-requisitos
- Python 3.7 ou superior
- Chave de API do Google Cloud (Gemini)
- Navegador web moderno
- Git (opcional)

### Instalação

1. **Clone o Repositório**
   ```bash
   git clone https://github.com/seu-usuario/CogniWound-AI.git
   cd CogniWound-AI
   ```

2. **Configure o Ambiente Virtual**
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # Linux/MacOS
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Instale as Dependências**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   GOOGLE_API_KEY=sua_chave_api_aqui
   ```

5. **Inicie o Servidor**
   ```bash
   python app.py
   ```

6. **Acesse a Aplicação**
   - Landing Page: `http://localhost:5000/`
   - Sistema: `http://localhost:5000/app`

## 💻 Como Usar

1. **Upload de Imagem**
   - Acesse a aba "Upload"
   - Arraste uma imagem ou clique para selecionar
   - Aguarde o processamento

2. **Análise**
   - Visualize os resultados na aba "Resultados"
   - Consulte o histórico de análises na aba "Histórico"
   - Exporte ou compartilhe os resultados quando necessário

## 🛠️ Tecnologias Utilizadas

- **Frontend**
  - HTML5
  - CSS3 (com variáveis CSS e design responsivo)
  - JavaScript (ES6+)
  - Material Icons

- **Backend**
  - Python 3.7+
  - Flask
  - Google Gemini API
  - Python-dotenv

## 📝 Notas Importantes

### Aviso Médico
⚠️ **IMPORTANTE**: Este sistema é uma ferramenta de apoio e não substitui o diagnóstico médico profissional. Sempre consulte um profissional de saúde qualificado para avaliação e tratamento adequados.

### Limitações
- Processamento apenas de imagens estáticas
- Tamanho máximo de arquivo: 5MB
- Requer conexão com internet para análise
- Análises baseadas apenas nas imagens fornecidas

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para [seu-email@dominio.com] ou abra uma issue no GitHub.

## 🙏 Agradecimentos

- Google Gemini API
- Comunidade Flask
- Todos os contribuidores e usuários

---
<div align="center">
  <sub>Desenvolvido com ❤️ para melhorar o cuidado com feridas</sub>
</div>
