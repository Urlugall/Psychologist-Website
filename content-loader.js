/* -- Page Section -- */

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



/* -- Load functions -- */

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

/* -- Footer -- */

async function addFooterFromJSON() {
    try {
        const response = await fetch('/Data/Ru/assets.json');
        const data = await response.json();

        const footer = document.createElement('footer');
        const p = document.createElement('p');
        p.textContent = data.footerText;

        footer.appendChild(p);
        document.body.appendChild(footer);
    } catch (error) {
        console.error('Ошибка при добавлении footer:', error);
    }
}

/* -- Sidebar -- */

async function addSocialSidebar() {
    // Проверяем, есть ли в документе элемент с нужным ID
    if (!document.getElementById('social-sidebar-container')) {
        console.log('Элемент для добавления социальной панели не найден.');
        return;
    }

    try {
        // Загружаем данные из JSON файла
        const response = await fetch('/Data/Ru/assets.json');
        const { links } = await response.json();

        const socialSidebar = document.createElement('section');
        socialSidebar.id = 'social-sidebar';
        document.body.appendChild(socialSidebar);

        links.forEach(({ href, title, icon }) => {
            const link = document.createElement('a');
            link.href = href;
            link.title = title;
            const img = document.createElement('img');
            img.src = icon;
            link.appendChild(img);
            socialSidebar.appendChild(link);
        });

        // Определяем стили для социальной панели
        const styles = `
        #social-sidebar {
            position: fixed;
            right: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 5;
            padding: 30px;
        }
        
        #social-sidebar a {
            display: block;
        }
        
        #social-sidebar a img {
            width: 30px;
        }
        `;

        // Добавляем стили на страницу
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

    } catch (error) {
        console.error('Ошибка при добавлении социальной панели:', error);
    }
}


/* -- Language -- */

function createLanguageSelector() {
    const languages = ['English', 'Русский', 'Українська'];
    const languageCodes = { 'eng': 'English', 'ru': 'Русский', 'ukr': 'Українська' };

    // Сначала проверяем язык в localStorage, затем в URL
    const savedLangCode = localStorage.getItem('selectedLanguage');
    const currentLangCode = savedLangCode || getCurrentLanguageFromUrl(); // должна возвращать 'eng', 'ru', или 'ukr'
    let currentLanguage = languageCodes[currentLangCode] || 'English';

    const langSelector = document.createElement('div');
    langSelector.id = 'language-selector';
    langSelector.textContent = currentLanguage; // Отображаем текущий язык
    document.body.appendChild(langSelector);

    const langList = document.createElement('ul');
    langList.id = 'language-list';
    updateLanguageList(); // Инициализация списка языков
    langList.style.display = 'none';
    langSelector.appendChild(langList);

    langSelector.addEventListener('click', () => {
        langList.style.display = langList.style.display === 'none' ? 'block' : 'none';
    });

    langSelector.addEventListener('mouseleave', () => {
        langList.style.display = 'none';
    });

    const styles = `
        #language-selector {
            position: absolute;
            top: 30px;
            right: 30px;
            background-color: #ffffff;
            padding: 10px;
            cursor: pointer;
            z-index: 5;
            border-radius: 9px;
            text-align: center;
        }
        #language-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
            display: none;
        }
        #language-list li {
            padding: 2px 5px;
            cursor: pointer;
            border-radius: 5px;
            text-align: center;
        }
        #language-list li:hover {
            background-color: #46992d;
            color: #ffffff;
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    function updateLanguageList() {
        langList.innerHTML = '';
        languages.forEach(lang => {
            if (lang === currentLanguage) return;

            const langItem = document.createElement('li');
            langItem.textContent = lang;
            langItem.onclick = function() {
                changeLanguage(this.textContent);
            };
            langList.appendChild(langItem);
        });
    }

    function changeLanguage(lang) {
        const langCode = Object.keys(languageCodes).find(key => languageCodes[key] === lang);
        if (!langCode) return;

        updateUrlLanguageParam(langCode);
        currentLanguage = lang;
        langSelector.textContent = currentLanguage;
        updateLanguageList();
        localStorage.setItem('selectedLanguage', langCode); // Сохраняем выбранный язык в localStorage
        window.location.reload();
    }
}

function getCurrentLanguageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('language') || 'eng';
}

function ensureLanguageInUrl() {
    const url = new URL(window.location);
    const urlParams = new URLSearchParams(window.location.search);
    const langInUrl = urlParams.get('language');

    if (langInUrl) return;

    const currentLanguageCode = localStorage.getItem('selectedLanguage') || getCurrentLanguageFromUrl();
    url.searchParams.set('language', currentLanguageCode);
    window.history.replaceState({}, '', url.toString());
}


/* -- DOM -- */

document.addEventListener('DOMContentLoaded', () => {
    loadContentData();
    addFooterFromJSON();
    addSocialSidebar();
    ensureLanguageInUrl();
    createLanguageSelector();
});