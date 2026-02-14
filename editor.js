// ==================== ИНИЦИАЛИЗАЦИЯ РЕДАКТОРА ====================
document.addEventListener('DOMContentLoaded', () => {
    loadDefaultLevels();
    updateCharacterPreview();
});

function loadDefaultLevels() {
    const container = document.getElementById('levelsContainer');
    container.innerHTML = '';
    
    const defaultWords = [
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
    ];
    
    defaultWords.forEach((word, index) => {
        addLevel(word, index + 1);
    });
}

// ==================== ДОБАВЛЕНИЕ УРОВНЯ ====================
function addLevel(predefined = null, levelNum = null) {
    const container = document.getElementById('levelsContainer');
    const levelCount = container.children.length + 1;
    const num = levelNum || levelCount;
    
    const levelDiv = document.createElement('div');
    levelDiv.className = 'word-level';
    levelDiv.innerHTML = `
        <h3>Уровень ${num}</h3>
        <div class="form-group">
            <label>Слово (английский):</label>
            <input type="text" class="level-word" value="${predefined?.word || ''}" placeholder="Например: cat">
        </div>
        <div class="form-group">
            <label>URL картинки:</label>
            <input type="url" class="level-image" value="${predefined?.image || ''}" placeholder="https://example.com/image.png">
            <div class="image-preview" style="margin-top: 10px;"></div>
        </div>
        <div class="form-group">
            <label>Буквы (формат: буква-ассоциация, разделённые запятыми):</label>
            <input type="text" class="level-letters" value="${predefined?.letters?.join(', ') || ''}" placeholder="a-apple, n-nest, t-table">
        </div>
        <button class="btn btn-primary" onclick="removeLevel(this)">🗑️ Удалить уровень</button>
    `;
    
    container.appendChild(levelDiv);
    
    // Добавление превью картинки
    const imageInput = levelDiv.querySelector('.level-image');
    const preview = levelDiv.querySelector('.image-preview');
    imageInput.addEventListener('input', (e) => {
        preview.innerHTML = `<img src="${e.target.value}" style="max-width: 100px; border-radius: 10px;">`;
    });
    
    if (predefined?.image) {
        preview.innerHTML = `<img src="${predefined.image}" style="max-width: 100px; border-radius: 10px;">`;
    }
}

function removeLevel(button) {
    button.parentElement.remove();
    
    // Обновление нумерации
    const levels = document.querySelectorAll('.word-level');
    levels.forEach((level, index) => {
        level.querySelector('h3').textContent = `Уровень ${index + 1}`;
    });
}

// ==================== ОБНОВЛЕНИЕ ПЕРСОНАЖА ====================
function updateCharacterPreview() {
    const select = document.getElementById('characterSelect');
    const customInput = document.getElementById('characterCustom');
    const preview = document.getElementById('characterPreview');
    
    if (select.value === 'custom') {
        customInput.style.display = 'block';
        customInput.addEventListener('input', () => {
            preview.innerHTML = `<img src="${customInput.value}" style="max-width: 100px; border-radius: 10px;">`;
        });
    } else {
        customInput.style.display = 'none';
        preview.innerHTML = `<img src="${select.value}" style="max-width: 100px; border-radius: 10px;">`;
    }
}

// ==================== ГЕНЕРАЦИЯ КОДА ====================
function generateIframe() {
    const config = {
        levels: parseInt(document.getElementById('levelCount').value),
        attempts: parseInt(document.getElementById('attemptsCount').value),
        timer: parseInt(document.getElementById('timerSeconds').value),
        language: document.getElementById('language').value,
        character: document.getElementById('characterSelect').value === 'custom' 
            ? document.getElementById('characterCustom').value 
            : document.getElementById('characterSelect').value,
        finalPrize: document.getElementById('finalPrize').value,
        words: []
    };
    
    // Сбор данных уровней
    document.querySelectorAll('.word-level').forEach(level => {
        const wordInput = level.querySelector('.level-word').value.trim();
        const imageInput = level.querySelector('.level-image').value.trim();
        const lettersInput = level.querySelector('.level-letters').value.trim();
        
        if (wordInput && imageInput && lettersInput) {
            config.words.push({
                word: wordInput.toLowerCase(),
                image: imageInput,
                letters: lettersInput.split(',').map(l => l.trim())
            });
        }
    });
    
    // Проверка минимального количества уровней
    if (config.words.length < 1) {
        alert('Добавьте хотя бы один уровень!');
        return;
    }
    
    // Кодирование конфигурации
    const encodedConfig = btoa(JSON.stringify(config));
    
    // Генерация iframe кода
    const iframeCode = `
<iframe src="https://yourusername.github.io/bridge-letters-game/index.html?config=${encodedConfig}" 
        width="800" 
        height="600" 
        frameborder="0" 
        allow="autoplay; speech-synthesis">
</iframe>
    `.trim();
    
    document.getElementById('iframeCode').style.display = 'block';
    document.getElementById('iframeCode').querySelector('code').textContent = iframeCode;
    
    // Копирование в буфер обмена
    navigator.clipboard.writeText(iframeCode).then(() => {
        alert('Код успешно скопирован в буфер обмена!');
    });
}