// content-loader.js

function getProductNameFromUrl() {
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
        let selector = name.includes(':') ? `meta[property="${name}"]` : `meta[name="${name}"]`;
        let element = head.querySelector(selector);
        if (!element) {
            element = document.createElement('meta');
            if (name.includes(':')) element.setAttribute('property', name);
            else element.setAttribute('name', name);
            head.appendChild(element);
        }
        element.setAttribute('content', content);
    };

    Object.entries(metaTags).forEach(([key, value]) => {
        if (value) setMetaTag(key, value);
    });
}

/* -- Blog Posts Handling -- */

// Функция для создания элемента поста
function createPostElement(post) {
    // Если tags почему-то не массив — приводим
    const tags = Array.isArray(post.tags)
        ? post.tags
        : (typeof post.tags === 'string'
            ? post.tags.split(',').map(t => t.trim()).filter(Boolean)
            : []);

    const postItem = document.createElement('div');
    postItem.classList.add('post-item');
    postItem.setAttribute('data-tags', tags.join(' '));
    postItem.setAttribute('data-id', post.id);

    postItem.addEventListener('click', () => {
        window.location.href = `/Blog/post.html?post_key=${encodeURIComponent(post.post_key)}`;
    });

    // Изображение
    const img = document.createElement('img');
    img.src = post.image;
    img.alt = 'Превью статьи';
    img.classList.add('post-image');
    img.loading = 'lazy';
    postItem.appendChild(img);

    // Контент
    const postContent = document.createElement('div');
    postContent.classList.add('post-content');

    const title = document.createElement('h2');
    title.id = `blog_posts-${post.id}-title`;
    title.classList.add('post-title');
    title.textContent = post.title;
    title.setAttribute('data-editable', 'true');
    title.dataset.folder = 'blog_posts';
    title.dataset.fileName = post.post_key || post.id;
    title.dataset.field = 'title';
    postContent.appendChild(title);

    const shortDesc = document.createElement('p');
    shortDesc.id = `blog_posts-${post.id}-description`;
    shortDesc.classList.add('post-short');
    shortDesc.textContent = post.description;
    shortDesc.setAttribute('data-editable', 'true');
    shortDesc.dataset.folder = 'blog_posts';
    shortDesc.dataset.fileName = post.post_key || post.id;
    shortDesc.dataset.field = 'description';
    postContent.appendChild(shortDesc);

    // Футер
    const postFooter = document.createElement('div');
    postFooter.classList.add('post-footer');

    const postDate = document.createElement('span');
    postDate.id = `blog_posts-${post.id}-date`;
    postDate.classList.add('post-date');
    postDate.textContent = post.date;
    postDate.setAttribute('data-editable', 'true');
    postDate.dataset.folder = 'blog_posts';
    postDate.dataset.fileName = post.post_key || post.id;
    postDate.dataset.field = 'date';
    postFooter.appendChild(postDate);

    const postTags = document.createElement('span');
    postTags.id = `blog_posts-${post.id}-tags`;
    postTags.classList.add('post-tags');
    postTags.textContent = tags.length ? '#' + tags.join(' #') : '';
    postTags.setAttribute('data-editable', 'true');
    postTags.dataset.folder = 'blog_posts';
    postTags.dataset.fileName = post.post_key || post.id;
    postTags.dataset.field = 'tags';
    postFooter.appendChild(postTags);

    postContent.appendChild(postFooter);
    postItem.appendChild(postContent);

    // Анимация появления
    setTimeout(() => {
        postItem.classList.add('visible');
    }, 100);

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
        // Загрузка с API
        const posts = await fetchData(`/api/blog_posts?lang=${language}`);
        const postsContainer = document.getElementById('posts-container');

        // Очищаем контейнер перед загрузкой новых постов
        postsContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = createPostElement(post);
            postsContainer.appendChild(postElement);
        });

        // Получаем уникальные теги и заполняем фильтры
        const uniqueTags = getUniqueTags(posts);
        populateTagFilters(uniqueTags);

        // Применяем фильтрацию после загрузки постов и тегов
        filterPosts();
    } catch (error) {
        console.error('Ошибка загрузки постов блога:', error);
    }
}

/* -- Events Handling -- */

// Функция для создания элемента события
function createEventElement(evt) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('event-item');
    wrapper.setAttribute('data-id', evt.id);

    const title = document.createElement('h3');
    title.id = `events-${evt.id}-title`;
    title.classList.add('event-title');
    title.textContent = evt.title;
    title.setAttribute('data-editable', 'true');
    title.dataset.folder = 'events';
    title.dataset.fileName = evt.id;
    title.dataset.field = 'title';
    wrapper.appendChild(title);

    const desc = document.createElement('p');
    desc.id = `events-${evt.id}-description`;
    desc.classList.add('event-description');
    desc.textContent = evt.description;
    desc.setAttribute('data-editable', 'true');
    desc.dataset.folder = 'events';
    desc.dataset.fileName = evt.id;
    desc.dataset.field = 'description';
    wrapper.appendChild(desc);

    const date = document.createElement('time');
    date.id = `events-${evt.id}-start_date`;
    date.classList.add('event-date');
    date.textContent = evt.start_date;
    date.setAttribute('data-editable', 'true');
    date.dataset.folder = 'events';
    date.dataset.fileName = evt.id;
    date.dataset.field = 'start_date';
    wrapper.appendChild(date);

    // Добавляем местоположение, если есть
    if (evt.location) {
        const location = document.createElement('span');
        location.id = `events-${evt.id}-location`;
        location.classList.add('event-location');
        location.textContent = evt.location;
        location.setAttribute('data-editable', 'true');
        location.dataset.folder = 'events';
        location.dataset.fileName = evt.id;
        location.dataset.field = 'location';
        wrapper.appendChild(location);
    }

    // Добавляем цену, если есть
    if (evt.price !== undefined) {
        const price = document.createElement('span');
        price.id = `events-${evt.id}-price`;
        price.classList.add('event-price');
        price.textContent = evt.price;
        price.setAttribute('data-editable', 'true');
        price.dataset.folder = 'events';
        price.dataset.fileName = evt.id;
        price.dataset.field = 'price';
        wrapper.appendChild(price);
    }

    // Добавляем максимальное количество участников, если есть
    if (evt.max_participants !== undefined) {
        const maxParticipants = document.createElement('span');
        maxParticipants.id = `events-${evt.id}-max_participants`;
        maxParticipants.classList.add('event-max-participants');
        maxParticipants.textContent = evt.max_participants;
        maxParticipants.setAttribute('data-editable', 'true');
        maxParticipants.dataset.folder = 'events';
        maxParticipants.dataset.fileName = evt.id;
        maxParticipants.dataset.field = 'max_participants';
        wrapper.appendChild(maxParticipants);
    }

    // Анимация появления
    setTimeout(() => {
        wrapper.classList.add('visible');
    }, 100);

    return wrapper;
}

// Функция загрузки и рендеринга событий
async function loadEvents() {
    try {
        const lang = getCurrentLanguage();
        const events = await fetchData(`/api/events?lang=${lang}`);
        const container = document.getElementById('events-container');

        if (!container) return; // Если нет контейнера на странице, выходим

        container.innerHTML = '';
        events.forEach(evt => container.appendChild(createEventElement(evt)));
    } catch (e) {
        console.error('Ошибка загрузки событий:', e);
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
    // Все относительные пути `/...` отправляем на воркер
    const base = 'https://psychologist-server.art-valentina-a.workers.dev';
    const apiUrl = url.match(/^https?:\/\//)
        ? url                    // уже абсолютный – оставляем как есть
        : `${base}${url}`;       // любой `/…` – префиксим воркером

    const cacheKey = `data_${apiUrl}`;
    const cached = dataCache.get(cacheKey);

    try {
        const headers = new Headers();
        // Если в кеше есть дата последнего изменения, добавляем If-Modified-Since
        if (cached?.lastModified) {
            headers.append('If-Modified-Since', cached.lastModified);
        }

        const response = await fetch(apiUrl, { headers });
        console.log(`← ${apiUrl} status: ${response.status}`);

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
        const pageData = await fetchData(`/${getCurrentLanguage()}/pages-data/${filename}.json`);
        updateData(pageData, 'pages-data', filename);

        // Проверяем наличие параметра игры в URL и загружаем соответствующие данные
        const productName = getProductNameFromUrl();
        if (productName) {
            const productData = await fetchData(`/${getCurrentLanguage()}/products-data/${productName}.json`);
            updateData(productData, 'products-data', productName);
        }

        // Проверяем наличие параметра игры в URL и загружаем соответствующие данные
        const gameName = getGameNameFromUrl();
        if (gameName) {
            const gameData = await fetchData(`/${getCurrentLanguage()}/games-data/${gameName}.json`);
            updateData(gameData, 'games-data', gameName);
        }

        // Проверяем наличие параметра группы в URL и загружаем соответствующие данные
        const groupName = getGroupFromUrl();
        if (groupName) {
            const groupData = await fetchData(`/${getCurrentLanguage()}/groups-data/${groupName}.json`);
            updateData(groupData, 'groups-data', groupName);
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
        childElement.setAttribute('data-editable', 'true');
        fragment.appendChild(childElement);
    });
    element.appendChild(fragment);
}

function updateImage(element, value) {
    element.style.backgroundImage = `url(${value})`;
}

function updateData(data, folder, fileName) {
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

            // Прописываем откуда этот элемент
            element.dataset.folder = folder;
            element.dataset.fileName = fileName;
            element.dataset.field = baseId;

            if (matchArray) {
                updateArray(element, value, matchArray[1]);
            } else if (matchImg) {
                updateImage(element, value);
            } else if (element.tagName.toLowerCase() === 'input') {
                element.setAttribute('placeholder', value);
                element.setAttribute('data-editable', 'true');
            } else {
                updateText(element, value);
                element.setAttribute('data-editable', 'true');
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
        const data = await fetchData(`/${getCurrentLanguage()}/assets.json`);

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
        // Загружаем данные из API
        const links = await fetchData(`/api/social_links`);

        const socialSidebar = document.createElement('section');
        socialSidebar.id = 'social-sidebar';
        document.body.appendChild(socialSidebar);

        links.forEach(({ url, network, icon_path }) => {
            const link = document.createElement('a');
            link.href = url;
            link.title = network;
            link.target = "_blank";
            const img = document.createElement('img');
            img.src = icon_path;
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

    // Загрузка данных о социальных сетях из API и текста из локального файла
    Promise.all([
        fetchData(`/api/social_links`),
        fetchData(`/${getCurrentLanguage()}/assets.json`)
    ])
        .then(([socialLinks, assetsData]) => {
            const socialIconsHTML = socialLinks.map(social =>
                `<a href="${social.url}" title="${social.network}" target="_blank">
                    <img src="${social.icon_path}" alt="${social.network}">
                </a>`
            ).join('');

            modal.innerHTML = `
                <div class="contact-modal-content">
                    <h1>${assetsData.socialText}</h1>
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
        if (element.id.includes('joinButton') || element.id.includes('demoJoin') || element.id.includes('buyButton')) {
            element.addEventListener('click', function () {
                openModal();
            });
        }
    });
}


/* -- Home Return -- */

async function initHomeButton() {
    // Загружаем данные из JSON файла
    const { blogButton } = await fetchData(`/${getCurrentLanguage()}/assets.json`);

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

    // Загружаем события, если есть контейнер для них
    if (document.getElementById('events-container')) {
        loadEvents();
    }

    if (!window.location.pathname.includes('schedule')) {
        initHomeButton();
        initLanguageSelector();
        addSocialSidebar();
    }
});