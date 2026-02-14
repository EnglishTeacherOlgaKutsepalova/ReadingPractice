// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentLevel = 0;
let levels = [];
let attemptsLeft = 3;
let timer = null;
let secondsLeft = 60;
let totalErrors = 0;
let startTime = null;
let gameConfig = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ИГРЫ ====================
document.addEventListener('DOMContentLoaded', () => {
    loadGameConfig();
    initGame();
});

function loadGameConfig() {
    const urlParams = new URLSearchParams(window.location.search);
    const configParam = urlParams.get('config');
    
    if (configParam) {
        try {
            gameConfig = JSON.parse(atob(configParam));
            setupGameFromConfig(gameConfig);
        } catch (e) {
            console.error('Ошибка загрузки конфигурации:', e);
            loadDefaultConfig();
        }
    } else {
        loadDefaultConfig();
    }
}

function loadDefaultConfig() {
    gameConfig = {
        levels: 10,
        attempts: 3,
        timer: 60,
        language: 'ru',
        character: 'https://cdn.pixabay.com/photo/2017/09/26/13/42/cartoon-character-2788922_1280.png',
        finalPrize: 'medal',
        words: [
            { word: 'ant', image: 'https://cdn.pixabay.com/photo/2016/11/07/11/34/ant-1805682_1280.png', letters: ['a-apple', 'n-nest', 't-table'] },
            { word: 'cat', image: 'https://cdn.pixabay.com/photo/2017/02/20/18/03/cat-2083492_1280.png', letters: ['c-cat', 'a-apple', 't-table'] },
            { word: 'dog', image: 'https://cdn.pixabay.com/photo/2018/01/07/15/19/dog-3067202_1280.png', letters: ['d-dog', 'o-orange', 'g-goat'] },
            { word: 'sun', image: 'https://cdn.pixabay.com/photo/2013/07/13/10/42/sun-157090_1280.png', letters: ['s-sun', 'u-umbrella', 'n-nest'] },
            { word: 'hat', image: 'https://cdn.pixabay.com/photo/2017/09/26/15/13/hat-2789244_1280.png', letters: ['h-hat', 'a-apple', 't-table'] },
            { word: 'pen', image: 'https://cdn.pixabay.com/photo/2012/04/11/00/01/pen-27801_1280.png', letters: ['p-pen', 'e-egg', 'n-nest'] },
            { word: 'cup', image: 'https://cdn.pixabay.com/photo/2017/08/07/12/47/coffee-cup-2600914_1280.png', letters: ['c-cup', 'u-umbrella', 'p-pen'] },
            { word: 'egg', image: 'https://cdn.pixabay.com/photo/2017/08/07/12/46/egg-2600898_1280.png', letters: ['e-egg', 'g-goat', 'g-goat'] },
            { word: 'box', image: 'https://cdn.pixabay.com/photo/2017/01/16/09/48/cartoon-character-1984362_1280.png', letters: ['b-box', 'o-orange', 'x-box'] },
            { word: 'bed', image: 'https://cdn.pixabay.com/photo/2017/01/16/09/48/cartoon-character-1984362_1280.png', letters: ['b-bed', 'e-egg', 'd-dog'] }
        ]
    };
    
    levels = gameConfig.words;
    attemptsLeft = gameConfig.attempts;
    secondsLeft = gameConfig.timer;
    document.querySelector('.character').style.backgroundImage = `url('${gameConfig.character}')`;
}

function setupGameFromConfig(config) {
    levels = config.words || [];
    attemptsLeft = config.attempts || 3;
    secondsLeft = config.timer || 60;
    document.querySelector('.character').style.backgroundImage = `url('${config.character}')`;
    
    // Обновление количества точек на карте
    updateMapPoints();
}

function initGame() {
    startTime = Date.now();
    currentLevel = 0;
    totalErrors = 0;
    
    // Обновление интерфейса
    updateLevelCounter();
    updateMapPoints();
    
    // Загрузка первого уровня
    loadLevel(currentLevel);
    
    // Установка обработчиков событий
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);
    document.getElementById('resetBtn').addEventListener('click', resetLevel);
    document.getElementById('restartBtn').addEventListener('click', restartGame);
    
    // Запуск таймера если включен
    if (secondsLeft > 0) {
        startTimer();
    }
}

// ==================== ЗАГРУЗКА УРОВНЯ ====================
function loadLevel(levelIndex) {
    if (levelIndex >= levels.length) {
        showFinalScreen();
        return;
    }
    
    const level = levels[levelIndex];
    
    // Обновление картинки и слова
    document.getElementById('targetImage').src = level.image;
    document.getElementById('targetWordText').textContent = gameConfig.language === 'en' ? level.word : '';
    
    // Очистка моста
    const bridgeBase = document.getElementById('bridgeBase');
    bridgeBase.innerHTML = '';
    
    // Создание слотов для моста
    for (let i = 0; i < level.word.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'bridge-slot';
        slot.dataset.index = i;
        bridgeBase.appendChild(slot);
    }
    
    // Создание блоков с буквами
    const letterBlocksContainer = document.getElementById('letterBlocksContainer');
    letterBlocksContainer.innerHTML = '';
    
    // Перемешивание букв
    const shuffledLetters = [...level.letters].sort(() => Math.random() - 0.5);
    
    shuffledLetters.forEach(letterData => {
        const [letter, symbol] = letterData.split('-');
        const block = document.createElement('div');
        block.className = 'letter-block';
        block.draggable = true;
        block.dataset.letter = letter;
        block.dataset.symbol = symbol;
        
        block.innerHTML = `
            <div class="letter-char">${letter.toUpperCase()}</div>
            <div class="letter-symbol">${symbol}</div>
        `;
        
        // Добавление событий перетаскивания
        block.addEventListener('dragstart', handleDragStart);
        block.addEventListener('dragend', handleDragEnd);
        
        letterBlocksContainer.appendChild(block);
    });
    
    // Добавление событий на слоты
    document.querySelectorAll('.bridge-slot').forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
    
    // Сброс попыток
    resetAttempts();
    
    // Обновление карты
    updateMapPoints();
    
    // Сброс фидбека
    document.getElementById('feedback').innerHTML = '';
    document.getElementById('feedback').className = 'feedback';
}

// ==================== ПЕРЕТАСКИВАНИЕ ====================
let draggedBlock = null;

function handleDragStart(e) {
    draggedBlock = this;
    setTimeout(() => {
        this.classList.add('dragging');
    }, 0);
    e.dataTransfer.setData('text/plain', this.dataset.letter);
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    this.classList.add('filled');
}

function handleDragLeave() {
    this.classList.remove('filled');
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('filled');
    
    if (!this.querySelector('.letter-block') && draggedBlock) {
        // Клонирование блока
        const clonedBlock = draggedBlock.cloneNode(true);
        clonedBlock.draggable = false;
        clonedBlock.classList.remove('dragging');
        
        // Добавление событий для удаления
        clonedBlock.addEventListener('click', () => {
            this.removeChild(clonedBlock);
            document.getElementById('letterBlocksContainer').appendChild(draggedBlock);
        });
        
        this.appendChild(clonedBlock);
        draggedBlock.remove();
    }
}

// ==================== ПРОВЕРКА ОТВЕТА ====================
function checkAnswer() {
    const slots = document.querySelectorAll('.bridge-slot');
    const answer = Array.from(slots)
        .map(slot => slot.querySelector('.letter-block')?.dataset.letter || '')
        .join('');
    
    const correctWord = levels[currentLevel].word;
    
    if (answer === correctWord) {
        // Правильный ответ
        showFeedback('success', gameConfig.language === 'en' ? 'Well done!' : 'Отлично!');
        playSound('success');
        speakWord(correctWord);
        
        // Анимация построения моста
        setTimeout(() => {
            animateBridgeBuild();
        }, 500);
        
        // Переход к следующему уровню
        setTimeout(() => {
            currentLevel++;
            if (currentLevel < levels.length) {
                moveCharacter();
                loadLevel(currentLevel);
            } else {
                showFinalScreen();
            }
        }, 1500);
    } else {
        // Неправильный ответ
        totalErrors++;
        attemptsLeft--;
        
        if (attemptsLeft <= 0 && gameConfig.attempts > 0) {
            showFeedback('error', gameConfig.language === 'en' ? 'Game Over! Try again.' : 'Попытки закончились! Попробуйте снова.');
            setTimeout(resetLevel, 2000);
        } else {
            showFeedback('error', gameConfig.language === 'en' ? 'Try again!' : 'Попробуйте ещё раз!');
            highlightWrongLetters(answer, correctWord);
            playSound('error');
            
            updateAttemptsDisplay();
        }
    }
}

function highlightWrongLetters(answer, correct) {
    const slots = document.querySelectorAll('.bridge-slot');
    slots.forEach((slot, index) => {
        const block = slot.querySelector('.letter-block');
        if (block) {
            if (answer[index] !== correct[index]) {
                block.classList.add('wrong');
            } else {
                block.classList.add('correct');
            }
        }
    });
}

// ==================== АНИМАЦИИ И ФИДБЕК ====================
function showFeedback(type, message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    feedback.className = `feedback ${type}`;
}

function animateBridgeBuild() {
    const slots = document.querySelectorAll('.bridge-slot');
    slots.forEach((slot, index) => {
        setTimeout(() => {
            slot.style.background = 'linear-gradient(135deg, #8b4513, #a0522d)';
            slot.style.border = '3px solid #654321';
            slot.style.borderRadius = '10px';
        }, index * 200);
    });
}

function moveCharacter() {
    const character = document.getElementById('character');
    const progress = ((currentLevel + 1) / levels.length) * 90 + 5;
    character.style.left = `${progress}%`;
    
    // Анимация прогресса
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${((currentLevel + 1) / levels.length) * 100}%`;
}

// ==================== ТАЙМЕР ====================
function startTimer() {
    updateTimerDisplay();
    
    timer = setInterval(() => {
        secondsLeft--;
        updateTimerDisplay();
        
        if (secondsLeft <= 0) {
            clearInterval(timer);
            showFeedback('error', gameConfig.language === 'en' ? 'Time is up!' : 'Время вышло!');
            setTimeout(resetLevel, 2000);
        }
    }, 1000);
}

function updateTimerDisplay() {
    document.getElementById('timerDisplay').textContent = 
        `${gameConfig.language === 'en' ? 'Time' : 'Время'}: ${secondsLeft}s`;
}

// ==================== УПРАВЛЕНИЕ ПОПЫТКАМИ ====================
function resetAttempts() {
    attemptsLeft = gameConfig.attempts || 3;
    updateAttemptsDisplay();
}

function updateAttemptsDisplay() {
    const maxAttempts = gameConfig.attempts || 3;
    document.getElementById('attemptsDisplay').textContent = 
        `${gameConfig.language === 'en' ? 'Attempts' : 'Попытки'}: ${attemptsLeft}/${maxAttempts}`;
}

function resetLevel() {
    loadLevel(currentLevel);
}

// ==================== ФИНАЛЬНЫЙ ЭКРАН ====================
function showFinalScreen() {
    clearInterval(timer);
    
    const finalScreen = document.getElementById('finalScreen');
    finalScreen.classList.add('active');
    
    // Статистика
    document.getElementById('totalWords').textContent = levels.length;
    document.getElementById('totalErrors').textContent = totalErrors;
    
    // Время игры
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    document.getElementById('totalTime').textContent = `${minutes}м ${seconds}с`;
    
    // Приз
    const prizeElement = document.getElementById('finalPrize');
    const prizes = {
        'medal': 'https://cdn.pixabay.com/photo/2017/01/10/00/54/medal-1968870_1280.png',
        'treasure': 'https://cdn.pixabay.com/photo/2013/07/13/10/36/treasure-chest-157098_1280.png',
        'certificate': 'https://cdn.pixabay.com/photo/2017/01/16/09/48/cartoon-character-1984362_1280.png',
        'castle': 'https://cdn.pixabay.com/photo/2013/07/13/10/36/castle-157098_1280.png'
    };
    
    prizeElement.style.backgroundImage = `url('${prizes[gameConfig.finalPrize]}')`;
}

function restartGame() {
    document.getElementById('finalScreen').classList.remove('active');
    initGame();
}

// ==================== ЗВУКИ И ОЗВУЧКА ====================
function playSound(type) {
    const sounds = {
        'success': 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
        'error': 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3'
    };
    
    const audio = document.getElementById('audioPlayer');
    audio.src = sounds[type];
    audio.play();
}

function speakWord(word) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US';
        utterance.rate = 0.8;
        window.speechSynthesis.speak(utterance);
    }
}

// ==================== КАРТА ПРОГРЕССА ====================
function updateMapPoints() {
    const mapPoints = document.getElementById('mapPoints');
    mapPoints.innerHTML = '';
    
    for (let i = 0; i < levels.length; i++) {
        const point = document.createElement('div');
        point.className = 'map-point';
        if (i < currentLevel) point.classList.add('completed');
        if (i === currentLevel) point.classList.add('active');
        point.dataset.level = i;
        point.addEventListener('click', () => jumpToLevel(i));
        mapPoints.appendChild(point);
    }
    
    updateLevelCounter();
}

function updateLevelCounter() {
    document.getElementById('levelCounter').textContent = `${currentLevel + 1}/${levels.length}`;
}

function jumpToLevel(level) {
    if (level <= currentLevel) {
        currentLevel = level;
        loadLevel(currentLevel);
    }
}