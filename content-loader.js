// content-loader.js

function getPrpductNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('product');
}

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

/* -- Meta Tags Handling -- */

function updateMetaTags(metaData) {
    const head = document.head;

    const metaTags = {
        title: metaData.title,
        description: metaData.description,
        keywords: metaData.keywords,
        "og:title": metaData["og:title"],
        "og:description": metaData["og:description"],
        "og:image": metaData["og:image"],
        "og:url": metaData["og:url"],
        "twitter:card": metaData["twitter:card"],
        "twitter:title": metaData["twitter:title"],
        "twitter:description": metaData["twitter:description"],
        "twitter:image": metaData["twitter:image"]
    };

    if (metaTags.title) {
        document.title = metaTags.title;
    }

    const setMetaTag = (name, content) => {
        if (name === 'title') return;

        let selector;
        if (name.startsWith('og:') || name.startsWith('twitter:')) {
            selector = `meta[property="${name}"]`;
        } else {
            selector = `meta[name="${name}"]`;
        }

        let element = head.querySelector(selector);
        if (!element) {
            element = document.createElement('meta');
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
                element.setAttribute('property', name);
            } else {
                element.setAttribute('name', name);
            }
            head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    for (const [key, value] of Object.entries(metaTags)) {
        if (value) {
            setMetaTag(key, value);
        }
    }
}

/* -- Blog Posts Handling -- */

// Функция для создания элемента поста
function createPostElement(post) {
    const postItem = document.createElement('div');
    postItem.classList.add('post-item');
    postItem.setAttribute('data-tags', post.tags.join(' '));
    postItem.setAttribute('data-id', post.id);

    postItem.addEventListener('click', () => {
        window.location.href = `/Blog/post.html?id=${encodeURIComponent(post.id)}`;
    });

    // Создание изображения поста с ленивой загрузкой
    const img = document.createElement('img');
    img.src = post.image;
    img.alt = 'Превью статьи';
    img.classList.add('post-image');
    img.loading = 'lazy';
    postItem.appendChild(img);

    // Создание контента поста
    const postContent = document.createElement('div');
    postContent.classList.add('post-content');

    // Заголовок
    const title = document.createElement('h2');
    title.classList.add('post-title');
    title.textContent = post.title;
    postContent.appendChild(title);

    // Краткое описание
    const shortDesc = document.createElement('p');
    shortDesc.classList.add('post-short');
    shortDesc.textContent = post.description;
    postContent.appendChild(shortDesc);

    // Футер поста
    const postFooter = document.createElement('div');
    postFooter.classList.add('post-footer');

    const postDate = document.createElement('span');
    postDate.classList.add('post-date');
    postDate.textContent = post.date;
    postFooter.appendChild(postDate);

    const postTags = document.createElement('span');
    postTags.classList.add('post-tags');
    postTags.textContent = '#' + post.tags.join(' #');
    postFooter.appendChild(postTags);

    postContent.appendChild(postFooter);
    postItem.appendChild(postContent);

    // Добавление класса visible после добавления в DOM
    setTimeout(() => {
        postItem.classList.add('visible');
    }, 100); // Задержка для анимации

    return postItem;
}

// Функция для получения уникальных тегов из постов
function getUniqueTags(posts) {
    const tagsSet = new Set();
    posts.forEach(post => {
        if (Array.isArray(post.tags)) {
            post.tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
        }
    });
    return Array.from(tagsSet).sort(); // Сортировка для удобства
}

// Функция для капитализации первого символа тега (для отображения)
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Функция для заполнения фильтров тегов
function populateTagFilters(uniqueTags) {
    const dropdownContent = document.getElementById('dropdown-content');
    dropdownContent.innerHTML = ''; // Очистка существующих тегов

    uniqueTags.forEach(tag => {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.classList.add('tag-checkbox');
        checkbox.value = tag;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' ' + capitalize(tag)));
        dropdownContent.appendChild(label);
    });
}

// Обновляем функцию loadBlogPosts для динамической загрузки тегов
async function loadBlogPosts() {
    try {
        const language = getCurrentLanguage();
        const postsData = await fetchData(`/Data/${language}/blog-posts/posts.json`);
        const postsContainer = document.getElementById('posts-container');

        // Очищаем контейнер перед загрузкой новых постов
        postsContainer.innerHTML = '';

        postsData.posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });

        // Получаем уникальные теги и заполняем фильтры
        const uniqueTags = getUniqueTags(postsData.posts);
        populateTagFilters(uniqueTags);

        // Применяем фильтрацию после загрузки постов и тегов
        filterPosts();
    } catch (error) {
        console.error('Ошибка загрузки постов блога:', error);
    }
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
        const productName = getPrpductNameFromUrl();
        if (productName) {
            const productName = await fetchData(`/Data/${getCurrentLanguage()}/products-data/${productName}.json`);
            updateData(productName);
        }

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

        // Если это страница блога, загружаем посты
        if (filename === 'blog') {
            await loadBlogPosts();
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
    // Обработка метаданных
    if (data.meta) {
        updateMetaTags(data.meta);
    }
    
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
            } else if (element.tagName.toLowerCase() === 'input') {
                element.setAttribute('placeholder', value);
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

        @media only screen and (max-width: 600px) {
            #social-sidebar {
                padding: 15px;
            }
            #social-sidebar a img {
                width: 25px;
            }
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
    // Добавление адаптивных стилей в <head>
    const style = document.createElement('style');
    style.textContent = `
        /* Основные стили для модального окна */
        .contact-modal {
            display: none;
            position: fixed;
            z-index: 10;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
            cursor: pointer;
            transition: opacity 0.5s ease;
            opacity: 0;
        }
        .contact-modal-content {
            background-color: #fefefe;
            margin: 15% auto;
            padding: 20px;
            border: 1px solid #888;
            width: 60%;
            max-width: 500px;
            text-align: center;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            border-radius: 15px;
            transition: all 0.5s ease-in-out;
            cursor: default;
        }
        .social-icons {
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }
        .social-icons a {
            margin: 0 10px;
            text-decoration: none;
        }
        .social-icons img {
            width: 50px;
            height: 50px;
            transition: transform 0.3s;
        }
        .social-icons img:hover {
            transform: scale(1.1);
        }

        /* Адаптивные стили для экранов до 600px */
        @media (max-width: 600px) {
            .contact-modal-content {
                width: 90%;
                margin: 30% auto;
                padding: 15px;
            }
            .contact-modal-content h1 {
                font-size: 1.5em;
            }
            .social-icons img {
                width: 30px;
                height: 30px;
                margin: 5px;
            }
        }
    `;
    document.head.appendChild(style);

    // Создание модального окна
    const modal = document.createElement('div');
    modal.className = 'contact-modal';

    // Загрузка данных о социальных сетях из внешнего файла
    fetch(`/Data/${getCurrentLanguage()}/assets.json`)
        .then(response => response.json())
        .then(data => {
            const socialIconsHTML = data.joinSocial.map(social =>
                `<a href="${social.href}" title="${social.title}" target="_blank">
                    <img src="${social.icon}" alt="${social.title}">
                </a>`
            ).join('');

            modal.innerHTML = `
                <div class="contact-modal-content">
                    <h1>${data.socialText}</h1>
                    <div class="social-icons">${socialIconsHTML}</div>
                </div>
            `;

            document.body.appendChild(modal);
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
        });

    // Функция открытия модального окна
    function openModal() {
        modal.style.display = "block";
        // Используем requestAnimationFrame для плавности
        requestAnimationFrame(() => {
            modal.style.opacity = "1";
        });
    }

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            modal.style.opacity = "0";
            setTimeout(() => modal.style.display = "none", 500);
        }
    });

    return openModal;
}



function initJoinButtons() {
    const openModal = createContactPanel();

    document.querySelectorAll('[id]').forEach(element => {
        if (element.id.includes('joinButton') || element.id.includes('demoJoin')) {
            element.addEventListener('click', function () {
                openModal();
            });
        }
    });
}


/* -- Home Return -- */

async function initHomeButton() {
    // Загружаем данные из JSON файла
    const response = await fetch(`/Data/${getCurrentLanguage()}/assets.json`);
    const { blogButton } = await response.json();

    const container = document.createElement('div');
    container.className = 'home-button-container';

    const homeLink = document.createElement('a');
    homeLink.href = '/index.html';
    homeLink.className = 'home-button-link';

    const homeImg = document.createElement('img');
    homeImg.src = '/favicon.ico';
    homeImg.alt = 'Main Page';
    homeImg.className = 'home-button-img';

    homeLink.appendChild(homeImg);
    container.appendChild(homeLink);

    const blogLink = document.createElement('a');
    blogLink.href = '/Blog/blog.html';
    blogLink.className = 'blog-panel';
    blogLink.textContent = blogButton;

    container.appendChild(blogLink);
    document.body.appendChild(container);

    const style = document.createElement('style');
    style.textContent = `
        .home-button-container {
            position: absolute;
            top: 30px;
            left: 30px;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .home-button-link {
            display: block;
        }
        .home-button-img {
            width: 70px;
            border-radius: 10px;
            transition: transform 0.3s;
        }
        .blog-panel {
            margin-top: 4px;
            padding: 5px 0;
            background: white;
            color: black;
            border-radius: 5px;
            text-align: center;
            width: 70px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            font-size: 16px;
            text-decoration: none;
            transition: transform 0.3s ease;
        }
        @media (max-width: 768px) {
            .home-button-container {
                top: 10px;
                left: 10px;
            }
            .home-button-img {
                width: 50px;
            }
            .blog-panel {
                width: 50px;
                font-size: 14px;
                padding: 4px 0;
            }
        }
    `;
    document.head.appendChild(style);
}



/* -- Language -- */

const initLanguageSelector = () => {
    const languages = { en: 'English', ru: 'Русский', uk: 'Українська', fr: 'Français' };
    const defaultLang = 'en';
    const browserLang = navigator.language.slice(0, 2);
    const langCode = languages.hasOwnProperty(browserLang) ? browserLang : defaultLang;
    const selectedLangCode = localStorage.getItem('selectedLanguage') || langCode;

    createLanguageSelector(languages, selectedLangCode);
};

const createLanguageSelector = (languages, currentLangCode) => {
    const selectorHTML = `
        <div id="language-selector" class="language-selector">
            ${languages[currentLangCode]}
            <ul id="language-list" class="language-list">
                ${Object.entries(languages).filter(([code]) => code !== currentLangCode).map(([code, name]) => `
                    <li class="language-item" data-lang="${code}">${name}</li>
                `).join('')}
            </ul>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', selectorHTML);

    const langSelector = document.getElementById('language-selector');
    const langList = document.getElementById('language-list');

    setupEventListeners(langSelector, langList);

    const style = document.createElement('style');
    style.innerHTML = `
        .language-selector {
            position: absolute;
            top: 30px;
            right: 30px;
            background-color: #ffffff;
            padding: 10px 15px;
            cursor: pointer;
            z-index: 5;
            border-radius: 9px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            transition: padding 0.3s ease, top 0.3s ease, right 0.3s ease;
        }

        .language-list {
            list-style-type: none;
            padding: 5px 0;
            margin: 5px 0 0 0;
            display: none;
            background-color: #ffffff;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }

        .language-item {
            padding: 8px 10px;
            cursor: pointer;
            border-radius: 5px;
            text-align: center;
            transition: background-color 0.2s ease;
        }

        .language-item:hover {
            background-color: #f0f0f0;
        }

        .language-selector.active .language-list {
            display: block;
        }

        @media only screen and (max-width: 600px) {
            .language-selector {
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                font-size: 14px;
            }

            .language-list {
                padding: 4px 0;
            }

            .language-item {
                padding: 6px 8px;
                font-size: 14px;
            }
        }
    `;
    document.head.appendChild(style);
};

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
    console.log('Current Language:', getCurrentLanguage());

    if (!window.location.pathname.includes('schedule')) {
        initHomeButton();
        initLanguageSelector();
        addSocialSidebar();
    }
});