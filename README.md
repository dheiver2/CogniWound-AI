# CogniWound AI: Sistema Inteligente de Análise de Feridas

**CogniWound AI** é um sistema web simples e eficiente para auxiliar na análise de imagens de feridas, utilizando o poder da inteligência artificial via Google Gemini API. O frontend é desenvolvido com tecnologias web puras (HTML, CSS e JavaScript), enquanto o backend utiliza Flask.

## Funcionalidades Principais

*   **Interface Moderna e Responsiva:** Design amigável que se adapta a diferentes tamanhos de tela.
*   **Upload Flexível:** Carregue imagens de feridas facilmente arrastando e soltando ou selecionando arquivos (JPG, JPEG, PNG com limite de 5MB).
*   **Análise por IA:** Envie imagens para o backend para análise detalhada utilizando a API Gemini.
*   **Resultados Estruturados:** Visualize a análise da ferida (descrição, características, sinais de infecção, estágio, recomendações) em um formato claro e organizado em uma aba dedicada.
*   **Histórico Local:** Mantenha um registro das suas análises anteriores diretamente no navegador, com pré-visualização e opções de exclusão individual ou em massa.
*   **Navegação Intuitiva:** Alterne facilmente entre as abas de Upload, Resultados, Histórico e Sobre.
*   **Landing Page Informativa:** Uma página inicial apresentando o sistema e suas capacidades (`/`).
*   **Identidade Visual:** Paleta de cores e logo personalizados (`static/1.jpg`).

## Configuração e Execução

Siga estes passos para ter o CogniWound AI funcionando localmente:

### Pré-requisitos

*   Python 3.7+
*   Uma chave de API válida do Google Cloud Console com acesso à API Gemini.

### Passos

1.  **Clone o Repositório:** (Se estiver usando Git)
    ```bash
    git clone <url-do-repositorio>
    cd <nome-da-pasta>
    ```

2.  **Crie e Ative o Ambiente Virtual:**
    ```bash
    python -m venv venv
    # Windows
    .\venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Instale as Dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure a Chave da API Google:**
    Crie um arquivo na raiz do projeto chamado `.env` e adicione sua chave de API Gemini:
    ```dotenv
    GOOGLE_API_KEY=SUA_CHAVE_AQUI
    ```
    Substitua `SUA_CHAVE_AQUI` pela sua chave real.

5.  **Adicione o Logo:**
    Coloque o arquivo da imagem do logo (`1.jpg`) dentro da pasta `static/` na raiz do projeto.

6.  **Execute o Servidor Flask:**
    Com o ambiente virtual ativado, execute o script principal do Flask:
    ```bash
    python app.py
    ```

7.  **Acesse a Aplicação:**
    Abra seu navegador e navegue para:
    *   **Landing Page:** `http://localhost:5000/`
    *   **Sistema de Análise:** `http://localhost:5000/app`

## Uso Básico

Na página do Sistema de Análise (`/app`):

1.  Na aba "Upload", selecione ou arraste a imagem da ferida.
2.  Clique no botão "Analisar Imagem".
3.  Vá para a aba "Resultados" para ver a análise detalhada.
4.  A aba "Histórico" mostra suas análises passadas.

## Aviso Importante

Este sistema foi desenvolvido como uma ferramenta educacional e informativa. **As análises fornecidas pela IA NÃO substituem o diagnóstico ou aconselhamento de um profissional médico qualificado.** Sempre consulte um médico ou especialista em saúde para avaliação e tratamento adequados de feridas ou quaisquer outras condições médicas. 
