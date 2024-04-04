function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game');
}

const getCurrentLanguage = () => {
    return localStorage.getItem('selectedLanguage') || 'en';
};

function getGroupFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('group');
}

/* -- Page Section -- */

const dataCache = {
    get(cacheKey) {
        const item = localStorage.getItem(cacheKey);
        return item ? JSON.parse(item) : undefined;
    },
    set(cacheKey, data, lastModified) {
        const cachedItem = {
            data: data,
            lastModified: lastModified
        };
        localStorage.setItem(cacheKey, JSON.stringify(cachedItem));
    }
};

async function fetchData(url) {
    //url = getStorageUrl(url);
    
    const cacheKey = `data_${url}`;
    const cached = dataCache.get(cacheKey);

    try {
        const headers = new Headers();
        // Если в кеше есть дата последнего изменения, добавляем If-Modified-Since
        if (cached?.lastModified) {
            headers.append('If-Modified-Since', cached.lastModified);
        }

        const response = await fetch(url, { headers });

        // Если данные не изменились с момента последнего кеширования
        if (response.status === 304) {
            console.log('Data hasn\'t changed. Using cache.');
            return cached.data;
        }

        // Если есть новые данные
        if (response.ok) {
            const lastModified = response.headers.get('Last-Modified');
            const data = await response.json();
            // Обновляем кеш
            dataCache.set(cacheKey, data, lastModified);
            return data;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
        console.error('Fetching data failed:', error);
        // В случае ошибки, если в кеше есть данные, используем их
        if (cached?.data) {
            console.log('Using cached data due to error.');
            return cached.data;
        }
        throw error;
    }
}

// Инициализация и обработка загрузки данных страницы и игры
async function loadContentData() {
    try {
        // Используем тернарный оператор для определения имени файла
        const pathname = window.location.pathname;
        const isRootPath = pathname === '/' || pathname.endsWith('/');
        const filename = isRootPath ? 'index' : pathname.split('/').pop().split('.')[0];

        // Загружаем и обновляем данные страницы
        const pageData = await fetchData(`/Data/${getCurrentLanguage()}/pages-data/${filename}.json`);
        updateData(pageData);

        // Проверяем наличие параметра игры в URL и загружаем соответствующие данные
        const gameName = getGameNameFromUrl();
        if (gameName) {
            const gameData = await fetchData(`/Data/${getCurrentLanguage()}/games-data/${gameName}.json`);
            updateData(gameData);
        }

        // Проверяем наличие параметра группы в URL и загружаем соответствующие данные
        const groupName = getGroupFromUrl();
        if (groupName) {
            const groupData = await fetchData(`/Data/${getCurrentLanguage()}/groups-data/${groupName}.json`);
            updateData(groupData);
        }
    } catch (error) {
        console.error('Error during data loading:', error);
    }
}


/* -- Load functions -- */

const loadedIds = new Set();

function setTextContent(element, value) {
    // Проверяем, содержит ли значение HTML-теги для форматирования
    if (/<\/?[a-z][\s\S]*>/i.test(value)) {
        element.innerHTML = value;
    } else {
        element.textContent = value;
    }
}

function updateText(element, value) {
    setTextContent(element, value);
}

function updateArray(element, value, elementType) {
    const fragment = document.createDocumentFragment();
    Object.entries(value).forEach(([key, itemValue]) => {
        const childElement = document.createElement(elementType);
        setTextContent(childElement, itemValue);
        fragment.appendChild(childElement);
    });
    element.appendChild(fragment);
}

function updateImage(element, value) {
    element.style.backgroundImage = `url(${value})`;
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
        const response = await fetch(`/Data/${getCurrentLanguage()}/assets.json`);
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
    try {
        // Загружаем данные из JSON файла
        const response = await fetch(`/Data/${getCurrentLanguage()}/assets.json`);
        const { links } = await response.json();

        const socialSidebar = document.createElement('section');
        socialSidebar.id = 'social-sidebar';
        document.body.appendChild(socialSidebar);

        links.forEach(({ href, title, icon }) => {
            const link = document.createElement('a');
            link.href = href;
            link.title = title;
            link.target = "_blank";
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

/* -- Contact Panel -- */

function createContactPanel() {
    const modal = document.createElement('div');
    modal.style.cssText = 'display:none;position:fixed;z-index:10;left:0;top:0;width:100%;height:100%;overflow:auto;background-color:rgba(0,0,0,0.4);cursor:pointer;';

    // Загрузка данных о социальных сетях из внешнего файла
    fetch(`/Data/${getCurrentLanguage()}/assets.json`)
        .then(response => response.json())
        .then(data => {
            let socialIconsHTML = data.joinSocial.map(social =>
                `<a href="${social.href}" title="${social.title}" target="_blank" style="margin:0 10px;text-decoration:none;">
                    <img src="${social.icon}" alt="${social.title}" style="width:50px;height:50px;">
                </a>`
            ).join('');

            modal.innerHTML = `
              <div style="background-color:#fefefe;margin:15% auto;padding:20px;border:1px solid #888;width:60%;text-align:center;box-shadow:0 4px 8px rgba(0,0,0,0.2);border-radius:15px;transition:all 0.5s ease-in-out;cursor:default;">
                <h1>${data.socialText}</h1>
                <div style="cursor:pointer;margin-bottom:20px;">${socialIconsHTML}</div>
              </div>`;

            document.body.appendChild(modal);
        });

    function openModal() {
        modal.style.display = "block";
        setTimeout(() => modal.style.opacity = "1", 10);
    }

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.opacity = "0";
            setTimeout(() => modal.style.display = "none", 500);
        }
    });

    modal.style.transition = "opacity 0.5s ease";
    modal.style.opacity = "0";

    return openModal;
}


function initJoinButtons() {
    const openModal = createContactPanel();

    document.querySelectorAll('[id]').forEach(element => {
        if (element.id.includes('joinButton')) {
            element.addEventListener('click', function () {
                openModal();
            });
        }
    });
}


/* -- Home Return -- */

function initHomeButton() {
    const link = document.createElement('a');
    link.href = `/index.html`;
    link.innerHTML = '<img src="/favicon.ico" alt="Main Page" style="width:70px; height:auto; border-radius:10px;">';
    link.style.cssText = 'position:absolute; top:30px; left:30px; z-index:10;';
    document.body.appendChild(link);
}



/* -- Language -- */

const initLanguageSelector = () => {
    const languages = { en: 'English', ru: 'Русский', uk: 'Українська', fr: 'Français' };
    const defaultLang = 'en';
    const browserLang = navigator.language.slice(0, 2); // Получаем двухбуквенный код языка браузера
    const langCode = languages.hasOwnProperty(browserLang) ? browserLang : defaultLang;
    const selectedLangCode = localStorage.getItem('selectedLanguage') || langCode;

    createLanguageSelector(languages, selectedLangCode);
};

// Создание селектора языков
const createLanguageSelector = (languages, currentLangCode) => {
    const selectorHTML = `<div id="language-selector" style="position: absolute; top: 30px; right: 30px; background-color: #ffffff; padding: 10px; cursor: pointer; z-index: 5; border-radius: 9px; text-align: center;">${languages[currentLangCode]}</div>`;
    document.body.insertAdjacentHTML('beforeend', selectorHTML);

    const langSelector = document.getElementById('language-selector');
    const langList = document.createElement('ul');
    langList.id = 'language-list';
    langList.style.cssText = 'list-style-type: none; padding: 0; margin: 0; display: none;';
    langSelector.appendChild(langList);

    // Заполнение списка доступными языками
    Object.entries(languages).forEach(([code, name]) => {
        if (code !== currentLangCode) {
            langList.insertAdjacentHTML('beforeend', `<li data-lang="${code}" style="padding: 2px 5px; cursor: pointer; border-radius: 5px; text-align: center;">${name}</li>`);
        }
    });

    setupEventListeners(langSelector, langList);
};

// Настройка обработчиков событий
const setupEventListeners = (langSelector, langList) => {
    document.head.insertAdjacentHTML('beforeend', `<style>#language-list li:hover { background-color: #46992d; color: #ffffff; }</style>`);

    // Переключение отображения списка языков
    langSelector.addEventListener('click', () => {
        langList.style.display = langList.style.display === 'none' ? 'block' : 'none';
    });

    // Внешний клик для закрытия списка
    document.addEventListener('click', e => {
        if (!langSelector.contains(e.target)) langList.style.display = 'none';
    });

    // Выбор языка
    langList.addEventListener('click', e => {
        const selectedLangCode = e.target.dataset.lang;
        if (selectedLangCode) {
            localStorage.setItem('selectedLanguage', selectedLangCode);
            window.location.reload();
        }
    });
};


/* -- DOM -- */

document.addEventListener('DOMContentLoaded', () => {
    loadContentData();
    addFooterFromJSON();
    initJoinButtons();
    console.log('Текущий язык:', getCurrentLanguage());

    if (!window.location.pathname.endsWith('schedule.html') && !window.location.pathname.endsWith('schedule')) {
        initHomeButton();
        initLanguageSelector();
        addSocialSidebar();
    }
});