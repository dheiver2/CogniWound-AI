document.addEventListener('DOMContentLoaded', function() {
    // Elementos da interface
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const fileInput = document.getElementById('fileInput');
    const selectFileBtn = document.getElementById('selectFileBtn');
    const dropZone = document.getElementById('dropZone');
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const historyContainer = document.getElementById('historyContainer');
    const printResultBtn = document.getElementById('printResultBtn');
    const downloadResultBtn = document.getElementById('downloadResultBtn');

    // Elementos de resultado
    const resultImage = document.getElementById('resultImage');
    const generalDescription = document.getElementById('generalDescription');
    const visualCharacteristics = document.getElementById('visualCharacteristics');
    const infectionSigns = document.getElementById('infectionSigns');
    const woundStage = document.getElementById('woundStage');
    const recommendations = document.getElementById('recommendations');

    // Estado da aplicação
    let currentFile = null;
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

    // Navegação entre abas
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.dataset.tab;
            
            // Atualiza botões
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Atualiza conteúdo
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Seleção de arquivo
    selectFileBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        handleFile(file);
    });

    // Remover imagem
    removeImageBtn.addEventListener('click', () => {
        resetFileInput();
        previewContainer.style.display = 'none';
        dropZone.style.display = 'flex';
    });

    // Análise de imagem
    analyzeBtn.addEventListener('click', analyzeImage);

    // Limpar histórico
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            localStorage.removeItem('analysisHistory');
            updateHistoryDisplay();
        }
    });

    // Botões de resultado
    printResultBtn.addEventListener('click', () => {
        window.print();
    });

    downloadResultBtn.addEventListener('click', () => {
        const resultContent = document.querySelector('.results-container').innerHTML;
        const blob = new Blob([resultContent], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'analise-ferida.html';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

    // Funções auxiliares
    function handleFileSelect(e) {
        const file = e.target.files[0];
        handleFile(file);
    }

    function handleFile(file) {
        if (!file) return;

        // Validação do arquivo
        if (!ALLOWED_TYPES.includes(file.type)) {
            showError('Tipo de arquivo não permitido. Use JPG, PNG ou JPEG.');
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            showError('O arquivo é muito grande. Tamanho máximo: 5MB');
            return;
        }

        currentFile = file;
        const reader = new FileReader();

        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            dropZone.style.display = 'none';
            hideError();
        };

        reader.onerror = () => {
            showError('Erro ao ler o arquivo');
            resetFileInput();
        };

        reader.readAsDataURL(file);
    }

    async function analyzeImage() {
        if (!currentFile) {
            showError('Por favor, selecione uma imagem primeiro.');
            return;
        }

        showLoading();
        hideError();

        const formData = new FormData();
        formData.append('image', currentFile);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao analisar a imagem');
            }

            // Processa e exibe o resultado
            displayResults(data);
            
            // Salva no histórico
            saveToHistory(data, currentFile.name);
            
            // Atualiza o histórico
            updateHistoryDisplay();
            
            // Muda para a aba de resultados
            document.querySelector('[data-tab="results"]').click();

        } catch (error) {
            showError(error.message);
        } finally {
            hideLoading();
        }
    }

    function displayResults(data) {
        // Atualiza a imagem
        resultImage.src = imagePreview.src;

        // Processa e formata o resultado
        const analysis = data.analysis;
        
        // Descrição Geral
        generalDescription.innerHTML = formatAnalysisText(analysis.descricao_geral);
        
        // Características Visuais
        visualCharacteristics.innerHTML = formatAnalysisText(analysis.caracteristicas_visuais);
        
        // Sinais de Infecção
        infectionSigns.innerHTML = formatAnalysisText(analysis.sinais_infeccao);
        
        // Estágio da Ferida
        woundStage.innerHTML = formatAnalysisText(analysis.estagio_ferida);
        
        // Recomendações
        recommendations.innerHTML = formatAnalysisText(analysis.recomendacoes);
    }

    function formatAnalysisText(text) {
        if (!text) return 'Não disponível';
        
        // Converte quebras de linha em <br>
        text = text.replace(/\n/g, '<br>');
        
        // Formata listas
        text = text.replace(/- (.*?)(?=<br>|$)/g, '<li>$1</li>');
        text = text.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
        
        // Destaca termos importantes
        const importantTerms = ['grave', 'urgente', 'crítico', 'atenção', 'cuidado'];
        importantTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            text = text.replace(regex, `<strong>$&</strong>`);
        });
        
        return text;
    }

    function saveToHistory(data, fileName) {
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        
        // Adiciona nova análise
        history.unshift({
            id: Date.now(),
            date: new Date().toISOString(),
            fileName: fileName,
            image: imagePreview.src,
            analysis: data.analysis
        });
        
        // Mantém apenas as últimas 50 análises
        if (history.length > 50) {
            history.pop();
        }
        
        localStorage.setItem('analysisHistory', JSON.stringify(history));
    }

    function updateHistoryDisplay() {
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        
        if (history.length === 0) {
            historyContainer.innerHTML = '<p class="no-history">Nenhuma análise realizada ainda.</p>';
            return;
        }

        historyContainer.innerHTML = history.map(item => `
            <div class="history-item glass">
                <div class="history-preview">
                    <img src="${item.image}" alt="Análise anterior">
                </div>
                <div class="history-info">
                    <h3>${item.fileName}</h3>
                    <p class="history-date">${new Date(item.date).toLocaleString()}</p>
                    <div class="history-actions">
                        <button class="btn btn-icon view-analysis" data-id="${item.id}" title="Ver análise">
                            <span class="material-icons">visibility</span>
                        </button>
                        <button class="btn btn-icon delete-analysis" data-id="${item.id}" title="Excluir análise">
                            <span class="material-icons">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Adiciona eventos aos botões
        document.querySelectorAll('.view-analysis').forEach(btn => {
            btn.addEventListener('click', () => viewAnalysis(btn.dataset.id));
        });

        document.querySelectorAll('.delete-analysis').forEach(btn => {
            btn.addEventListener('click', () => deleteAnalysis(btn.dataset.id));
        });
    }

    function viewAnalysis(id) {
        const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
        const analysis = history.find(item => item.id === parseInt(id));
        
        if (analysis) {
            // Atualiza a imagem
            resultImage.src = analysis.image;
            
            // Atualiza os resultados
            generalDescription.innerHTML = formatAnalysisText(analysis.analysis.descricao_geral);
            visualCharacteristics.innerHTML = formatAnalysisText(analysis.analysis.caracteristicas_visuais);
            infectionSigns.innerHTML = formatAnalysisText(analysis.analysis.sinais_infeccao);
            woundStage.innerHTML = formatAnalysisText(analysis.analysis.estagio_ferida);
            recommendations.innerHTML = formatAnalysisText(analysis.analysis.recomendacoes);
            
            // Muda para a aba de resultados
            document.querySelector('[data-tab="results"]').click();
        }
    }

    function deleteAnalysis(id) {
        if (confirm('Tem certeza que deseja excluir esta análise?')) {
            const history = JSON.parse(localStorage.getItem('analysisHistory') || '[]');
            const newHistory = history.filter(item => item.id !== parseInt(id));
            localStorage.setItem('analysisHistory', JSON.stringify(newHistory));
            updateHistoryDisplay();
        }
    }

    function showLoading() {
        loadingIndicator.style.display = 'flex';
        analyzeBtn.disabled = true;
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
        analyzeBtn.disabled = false;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function resetFileInput() {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
    }

    // Inicializa o histórico
    updateHistoryDisplay();
}); 