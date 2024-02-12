// -- Page Section --

let currentLanguage = 'Ru'; // Пример установки текущего языка
const dataCache = {};


// Функция для загрузки данных с сервера
async function fetchData(url) {
    const cacheKey = `${currentLanguage}_${url}`; // Ключ кеша с учетом языка

    if (dataCache[cacheKey]) {
        return dataCache[cacheKey];
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    dataCache[cacheKey] = data;
    return data;
}


function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

// Инициализация и обработка загрузки данных страницы и игры
async function loadData() {
    try {
        const pathname = window.location.pathname;
        const filename = pathname.split('/').pop().split('.').slice(0, -1).join('.');
        const pageData = await fetchData(`/Data/Ru/pages-data/${filename}.json`);
        updateData(pageData);

        const gameName = getGameNameFromUrl();
        if (gameName) {
            const gameData = await fetchData(`/Data/Ru/games-data/${gameName}.json`);
            updateData(gameData);
        } else {
            console.log('Игра не указана в URL');
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
        const baseId = element.id.replace(/-array-\w+$|-img$/, '').replace(/-/g, '.');
        const value = baseId.split('.').reduce((acc, prop) => acc && acc[prop], data);

        if (value !== undefined && !loadedIds.has(element.id)) {
            const matchArray = element.id.match(/-array-(\w+)$/);
            const matchImg = element.id.match(/-img$/);

            if (matchArray) {
                updateArray(element, value, matchArray[1]);
            } else if (matchImg) {
                updateImage(element, value);
            } else {
                updateText(element, value);
            }
            loadedIds.add(element.id);
        }
    });
}

// Инициализация и установка обработчиков событий при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
    loadData();
});