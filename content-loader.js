// -- Page Section --

let currentLanguage = 'Ru'; // Пример установки текущего языка
const dataCache = {};


// Функция для загрузки данных с сервера
async function fetchData(url) {
    const cacheKey = `${currentLanguage}_${url}`;

    if (dataCache[cacheKey]) {
        return dataCache[cacheKey];
    }

    try {
        const response = await fetch(url);

        // Проверка на статус 404 - файл не найден
        if (response.status === 404) {
            throw new Error('File not found: The requested file does not exist. Ensure that json file`s name is similar to the html file');
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        dataCache[cacheKey] = data;
        return data;
    } catch (error) {
        console.error(error.message);
        throw error; 
    }
}



function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

// Инициализация и обработка загрузки данных страницы и игры
async function loadContentData() {
    try {
        // Используем тернарный оператор для определения имени файла
        const pathname = window.location.pathname;
        const isRootPath = pathname === '/' || pathname.endsWith('/');
        const filename = isRootPath ? 'index' : pathname.split('/').pop().split('.')[0];

        // Загружаем и обновляем данные страницы
        const pageData = await fetchData(`/Data/Ru/pages-data/${filename}.json`);
        updateData(pageData);

        // Проверяем наличие параметра игры в URL и загружаем соответствующие данные
        const gameName = getGameNameFromUrl();
        if (gameName) {
            const gameData = await fetchData(`/Data/Ru/games-data/${gameName}.json`);
            updateData(gameData);
        } else {
            console.log('There are no game in the URL');
        }
    } catch (error) {
        console.error('Error during data loading:', error);
    }
}



// -- Load functions --

const loadedIds = new Set();

function updateText(element, value) {
    element.textContent = value;
}

function updateArray(element, value, elementType) {
    const fragment = document.createDocumentFragment();
    Object.entries(value).forEach(([key, itemValue]) => {
        const childElement = document.createElement(elementType);
        childElement.textContent = itemValue;
        fragment.appendChild(childElement);
    });
    element.appendChild(fragment);
}

function updateImage(element, value) {
    const randomValue = Math.random(); // Избегаем кеширования
    element.style.backgroundImage = `url(${value}?v=${randomValue})`;
}

function updateData(data) {
    document.querySelectorAll('[id]').forEach(element => {
        // Проверяем, обработан ли элемент ранее
        if (element.getAttribute('data-processed') === 'true') {
            return; // Элемент уже обработан, пропускаем его
        }

        const baseId = element.id.replace(/-array-\w+$|-img$/, '').replace(/-/g, '.');
        const value = baseId.split('.').reduce((acc, prop) => acc && acc[prop], data);

        if (value !== undefined) {
            const matchArray = element.id.match(/-array-(\w+)$/);
            const matchImg = element.id.match(/-img$/);

            if (matchArray) {
                updateArray(element, value, matchArray[1]);
            } else if (matchImg) {
                updateImage(element, value);
            } else {
                updateText(element, value);
            }
            
            // Маркируем элемент как обработанный
            element.setAttribute('data-processed', 'true');
            loadedIds.add(element.id);
        }
    });
}


// Инициализация и установка обработчиков событий при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
    loadContentData();
});