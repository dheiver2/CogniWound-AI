    // Elementos da interface
let tabButtons, tabContents, fileInput, selectFileBtn, dropZone, previewContainer;
let imagePreview, analyzeBtn, loadingIndicator, errorMessage, removeImageBtn;
let clearHistoryBtn, historyContainer, printResultBtn, downloadResultBtn;
let resultImage, generalDescription, visualCharacteristics, infectionSigns;
let woundStage, recommendations, progressContainer, progressBarFill;
let progressStatus, errorContainer, errorOverlay, errorRetryBtn;

    // Estado da aplicação
    let currentFile = null;
    let currentQualityLevel = 'low'; // Default quality level
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Inicialização dos elementos
function initializeElements() {
    // Elementos da interface
    tabButtons = document.querySelectorAll('.tab-btn');
    tabContents = document.querySelectorAll('.tab-content');
    fileInput = document.getElementById('fileInput');
    selectFileBtn = document.getElementById('selectFileBtn');
    dropZone = document.getElementById('dropZone');
    previewContainer = document.getElementById('previewContainer');
    imagePreview = document.getElementById('imagePreview');
    analyzeBtn = document.getElementById('analyzeBtn');
    loadingIndicator = document.getElementById('loadingIndicator');
    errorMessage = document.getElementById('errorMessage');
    removeImageBtn = document.getElementById('removeImageBtn');
    clearHistoryBtn = document.getElementById('clearHistoryBtn');
    historyContainer = document.getElementById('historyContainer');
    printResultBtn = document.getElementById('printResultBtn');
    downloadResultBtn = document.getElementById('downloadResultBtn');
    
    // Elementos de resultado
    resultImage = document.getElementById('resultImage');
    generalDescription = document.getElementById('generalDescription');
    visualCharacteristics = document.getElementById('visualCharacteristics');
    infectionSigns = document.getElementById('infectionSigns');
    woundStage = document.getElementById('woundStage');
    recommendations = document.getElementById('recommendations');
    
    // Elementos de progresso e erro
    progressContainer = document.getElementById('analysisProgress');
    progressBarFill = document.getElementById('progressBarFill');
    progressStatus = document.getElementById('progressStatus');
    errorContainer = document.getElementById('errorContainer');
    errorOverlay = document.getElementById('errorOverlay');
    errorRetryBtn = document.getElementById('errorRetryBtn');

    // Quality level buttons
    const qualityButtons = document.querySelectorAll('.quality-btn');
    qualityButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            qualityButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            // Update current quality level
            currentQualityLevel = btn.dataset.quality;
        });
    });
}

// Inicialização dos event listeners
function initializeEventListeners() {
    // Event listeners existentes
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    fileInput.addEventListener('change', handleFileSelect);
    selectFileBtn.addEventListener('click', () => fileInput.click());
    analyzeBtn.addEventListener('click', analyzeImage);
    removeImageBtn.addEventListener('click', resetFileInput);
    clearHistoryBtn.addEventListener('click', clearHistory);
    printResultBtn.addEventListener('click', printResults);
    downloadResultBtn.addEventListener('click', downloadResults);

    // Event listeners para drag and drop
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

    // Event listeners para tratamento de erros
    document.getElementById('errorCloseBtn').addEventListener('click', hideError);
    errorRetryBtn.addEventListener('click', () => {
        hideError();
        analyzeImage();
    });

    // Event listeners para conexão
    window.addEventListener('offline', () => {
        showError('Sem conexão com a internet. Verifique sua conexão e tente novamente.', true);
    });

    window.addEventListener('online', () => {
        hideError();
    });
}

// Inicialização da aplicação
function initializeApp() {
    console.log('Inicializando aplicação...');
    
    // Inicializa os elementos
    initializeElements();
    
    // Verifica se todos os elementos necessários foram encontrados
    const requiredElements = {
        'fileInput': fileInput,
        'selectFileBtn': selectFileBtn,
        'dropZone': dropZone,
        'previewContainer': previewContainer,
        'imagePreview': imagePreview,
        'analyzeBtn': analyzeBtn,
        'progressContainer': progressContainer,
        'errorContainer': errorContainer
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error('Elementos não encontrados:', missingElements);
        return;
    }

    // Inicializa os event listeners
    initializeEventListeners();
    
    // Inicializa os controles de zoom
    initializeZoomControls();
    
    // Inicializa o histórico
    updateHistoryDisplay();
    
    // Adiciona efeito de ripple aos botões
    addButtonRippleEffect();

    console.log('Aplicação inicializada com sucesso!');
}

// Função para adicionar efeito de ripple aos botões
function addButtonRippleEffect() {
    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            // Previne ripple em botões desabilitados ou elementos que não deveriam ter (ex: tab-btn se tiverem seu próprio feedback)
            if (this.disabled || this.classList.contains('tab-btn') && this.classList.contains('active')) { // Example: no ripple on active tabs
                return;
            }

            const existingRipple = this.querySelector('.ripple');
            if(existingRipple) existingRipple.remove();

            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            // Assegura que o ripple seja adicionado ao botão clicado.
            // É importante que o CSS para .btn tenha position: relative e overflow: hidden.
            this.appendChild(ripple);

            const rect = this.getBoundingClientRect(); // Use 'this' para referência correta ao botão
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;

            // Limpa o ripple após a animação
            ripple.addEventListener('animationend', () => {
                if (ripple.parentElement) {
                   ripple.remove();
                }
            }, { once: true });
        });
    });
}

// Aguarda o DOM estar completamente carregado
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Navegação entre abas
function switchTab(tabId) {
    // Atualiza botões
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');
    
    // Atualiza conteúdo
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === tabId) {
            content.classList.add('active');
        }
    });
}

// Seleção de arquivo
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

// Drag and drop
function initializeZoomControls() {
    const image = document.getElementById('result-image');
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const resetZoom = document.getElementById('reset-zoom');
    let currentZoom = 1;

    if (!image || !zoomIn || !zoomOut || !resetZoom) {
        console.warn('Elementos de zoom não encontrados');
        return;
    }

    zoomIn.addEventListener('click', () => {
        if (currentZoom < 3) {
            currentZoom += 0.25;
            updateZoom();
        }
    });

    zoomOut.addEventListener('click', () => {
        if (currentZoom > 0.5) {
            currentZoom -= 0.25;
            updateZoom();
        }
    });

    resetZoom.addEventListener('click', () => {
        currentZoom = 1;
        updateZoom();
    });

    function updateZoom() {
        image.style.transform = `scale(${currentZoom})`;
        image.style.transformOrigin = 'center center';
    }
}

// Função para atualizar o progresso da análise
function updateAnalysisProgress(step, percentage, status) {
    console.log('Atualizando progresso:', { step, percentage, status });
    
    const progressContainer = document.getElementById('analysisProgress');
    const progressBarFill = document.getElementById('progressBarFill');
    const progressStatus = document.getElementById('progressStatus');
    
    if (!progressContainer || !progressBarFill || !progressStatus) {
        console.error('Elementos de progresso não encontrados:', {
            progressContainer: !!progressContainer,
            progressBarFill: !!progressBarFill,
            progressStatus: !!progressStatus
        });
        return;
    }

    // Atualiza a barra de progresso
    progressContainer.style.display = 'block';
    progressBarFill.style.width = `${percentage}%`;
    progressStatus.textContent = status;

    // Esconde o progresso quando chegar a 100%
    if (percentage === 100) {
        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBarFill.style.width = '0%';
        }, 1000);
    }
}

// Função para mostrar erro
function showError(message, isRetryable = false) {
    console.log('Mostrando erro:', { message, isRetryable });
    
    const errorContainer = document.getElementById('errorContainer');
    const errorOverlay = document.getElementById('errorOverlay');
    const errorMessage = document.getElementById('errorMessage');
    const errorRetryBtn = document.getElementById('errorRetryBtn');
    
    if (!errorContainer || !errorOverlay || !errorMessage || !errorRetryBtn) {
        console.error('Elementos de erro não encontrados:', {
            errorContainer: !!errorContainer,
            errorOverlay: !!errorOverlay,
            errorMessage: !!errorMessage,
            errorRetryBtn: !!errorRetryBtn
        });
        return;
    }

    // Atualiza a mensagem de erro
    errorMessage.textContent = message;
    errorContainer.classList.add('active');
    errorOverlay.classList.add('active');
    errorRetryBtn.style.display = isRetryable ? 'block' : 'none';

    // Esconde outros elementos
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }

    const progressContainer = document.getElementById('analysisProgress');
    if (progressContainer) {
        progressContainer.style.display = 'none';
    }
}

// Função para esconder erro
function hideError() {
    console.log('Escondendo erro');
    
    const errorContainer = document.getElementById('errorContainer');
    const errorOverlay = document.getElementById('errorOverlay');
    
    if (!errorContainer || !errorOverlay) {
        console.error('Elementos de erro não encontrados:', {
            errorContainer: !!errorContainer,
            errorOverlay: !!errorOverlay
        });
        return;
    }

    errorContainer.classList.remove('active');
    errorOverlay.classList.remove('active');
}

// Modificação da função analyzeImage
    async function analyzeImage() {
    console.log('Iniciando análise de imagem');
    
        if (!currentFile) {
            showError('Por favor, selecione uma imagem primeiro.');
            return;
        }

    // Esconde qualquer erro anterior
        hideError();

    // Mostra o indicador de carregamento
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
    }
    
    try {
        // Upload
        updateAnalysisProgress(0, 25, 'Enviando imagem...');
        const formData = new FormData();
        formData.append('image', currentFile);
        formData.append('quality_level', currentQualityLevel);

        // Processamento
        updateAnalysisProgress(1, 50, 'Processando imagem...');
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData
            });

        if (!response.ok) {
            const data = await response.json();
                throw new Error(data.error || 'Erro ao analisar a imagem');
            }

        // Análise
        updateAnalysisProgress(2, 75, 'Analisando ferida...');
        const data = await response.json();

        // Conclusão
        updateAnalysisProgress(3, 100, 'Análise concluída!');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Esconde o indicador de carregamento
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }

            // Processa e exibe o resultado
        const result = {
            image_url: URL.createObjectURL(currentFile),
            quality_level: currentQualityLevel,
            general_description: data.analysis.descricao_geral,
            visual_characteristics: data.analysis.caracteristicas_visuais,
            infection_signs: data.analysis.sinais_infeccao,
            wound_stage: data.analysis.estagio_ferida,
            recommendations: data.analysis.recomendacoes
        };

        displayAnalysisResult(result);
            saveToHistory(data, currentFile.name);
            updateHistoryDisplay();
            
            // Muda para a aba de resultados
        switchTab('results');
        } catch (error) {
        console.error('Erro na análise:', error);
        showError(error.message, true);
        }
    }

    function displayResults(data) {
    // Prepare the result object with the required format
    const result = {
        image_url: URL.createObjectURL(currentFile),
        quality_level: currentQualityLevel,
        general_description: data.analysis.descricao_geral,
        visual_characteristics: data.analysis.caracteristicas_visuais,
        infection_signs: data.analysis.sinais_infeccao,
        wound_stage: data.analysis.estagio_ferida,
        recommendations: data.analysis.recomendacoes
    };

    // Display the result using the new function
    displayAnalysisResult(result);

    // Save to history
    saveToHistory(data, currentFile.name);
    updateHistoryDisplay();
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
        const result = {
            image_url: analysis.image,
            quality_level: analysis.quality_level || 'Médio',
            general_description: analysis.analysis.descricao_geral,
            visual_characteristics: analysis.analysis.caracteristicas_visuais,
            infection_signs: analysis.analysis.sinais_infeccao,
            wound_stage: analysis.analysis.estagio_ferida,
            recommendations: analysis.analysis.recomendacoes
        };

        displayAnalysisResult(result);
        switchTab('results');
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

    function resetFileInput() {
        currentFile = null;
        fileInput.value = '';
        imagePreview.src = '';
    }

function clearHistory() {
    if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
        localStorage.removeItem('analysisHistory');
    updateHistoryDisplay();
    }
}

function printResults() {
    window.print();
}

function downloadResults() {
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
} 

function displayAnalysisResult(result) {
    console.log('Displaying analysis result:', result);
    
    const resultContainer = document.getElementById('result-container');
    const resultImage = document.getElementById('result-image');
    const analysisResult = document.getElementById('analysis-result');
    const analysisDate = document.getElementById('analysis-date');
    const analysisTime = document.getElementById('analysis-time');
    const analysisQuality = document.getElementById('analysis-quality');

    if (!resultContainer || !resultImage || !analysisResult || !analysisDate || !analysisTime || !analysisQuality) {
        console.error('Elementos necessários não encontrados');
        return;
    }

    // Display container
    resultContainer.style.display = 'block';

    // Set image
    resultImage.src = result.image_url;
    
    // Set analysis info
    const now = new Date();
    analysisDate.textContent = now.toLocaleDateString();
    analysisTime.textContent = now.toLocaleTimeString();
    analysisQuality.textContent = `Nível de Análise: ${result.quality_level || 'Médio'}`;

    // Format and display analysis result
    const sections = [
        { title: 'Descrição Geral', content: result.general_description },
        { title: 'Características Visuais', content: result.visual_characteristics },
        { title: 'Sinais de Infecção', content: result.infection_signs },
        { title: 'Estágio da Ferida', content: result.wound_stage },
        { title: 'Recomendações', content: result.recommendations }
    ];

    const formattedResult = sections.map(section => `
        <div class="analysis-section">
            <h3>${section.title}</h3>
            <div class="analysis-text">${section.content || 'Não disponível'}</div>
        </div>
    `).join('');

    analysisResult.innerHTML = formattedResult;

    // Initialize zoom controls
    initializeZoomControls();

    // Add event listeners for action buttons
    document.getElementById('export-pdf')?.addEventListener('click', () => {
        alert('Exportação para PDF em desenvolvimento');
    });

    document.getElementById('export-image')?.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'analise-ferida.png';
        link.href = resultImage.src;
        link.click();
    });

    document.getElementById('share-result')?.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'Análise de Ferida',
                text: 'Resultado da análise de ferida',
                url: window.location.href
            }).catch(console.error);
        } else {
            alert('Compartilhamento não suportado neste navegador');
        }
    });

    document.getElementById('new-analysis')?.addEventListener('click', () => {
        document.getElementById('upload-form')?.reset();
        resultContainer.style.display = 'none';
        document.getElementById('preview-container').style.display = 'none';
        document.getElementById('upload-container').style.display = 'block';
    });

    document.getElementById('save-analysis')?.addEventListener('click', () => {
        alert('Salvamento de análise em desenvolvimento');
    });
}

// Initialize action buttons
document.getElementById('export-pdf').addEventListener('click', () => {
    // Implement PDF export
    alert('Exportação para PDF em desenvolvimento');
});

document.getElementById('export-image').addEventListener('click', () => {
    const image = document.getElementById('result-image');
    const link = document.createElement('a');
    link.download = 'analise-ferida.png';
    link.href = image.src;
    link.click();
});

document.getElementById('share-result').addEventListener('click', () => {
    if (navigator.share) {
        navigator.share({
            title: 'Análise de Ferida',
            text: 'Resultado da análise de ferida',
            url: window.location.href
        }).catch(console.error);
    } else {
        alert('Compartilhamento não suportado neste navegador');
    }
});

document.getElementById('new-analysis').addEventListener('click', () => {
    // Reset form and hide results
    document.getElementById('upload-form').reset();
    document.getElementById('result-container').style.display = 'none';
    document.getElementById('preview-container').style.display = 'none';
    document.getElementById('upload-container').style.display = 'block';
});

document.getElementById('save-analysis').addEventListener('click', () => {
    // Implement save functionality
    alert('Salvamento de análise em desenvolvimento');
}); 