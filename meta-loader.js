// meta-loader.js

/**
 * Функция для получения текущего языка.
 */
const getCurrentLanguage = () => {
    return localStorage.getItem('selectedLanguage') || 'en';
};

/**
 * Функция для получения имени текущей страницы без расширения.
 */
const getCurrentPage = () => {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1).split('.')[0];
    return page || 'index'; // По умолчанию 'index'
};

/**
 * Кеширование данных в LocalStorage.
 */
const metaDataCache = {
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

/**
 * Функция для получения данных мета-тегов с сервера с учетом кеширования.
 * @param {string} url - URL для запроса данных.
 * @returns {Promise<Object>} - Возвращает объект с метаданными.
 */
async function fetchMetaData(url) {
    const cacheKey = `meta_${url}`;
    const cached = metaDataCache.get(cacheKey);

    try {
        const headers = new Headers();
        if (cached?.lastModified) {
            headers.append('If-Modified-Since', cached.lastModified);
        }

        const response = await fetch(url, { headers });

        if (response.status === 304) {
            console.log('Meta data hasn\'t changed. Using cache.');
            return cached.data;
        }

        if (response.ok) {
            const lastModified = response.headers.get('Last-Modified');
            const data = await response.json();
            metaDataCache.set(cacheKey, data, lastModified);
            return data;
        }

        throw new Error(`HTTP error! status: ${response.status}`);
    } catch (error) {
        console.error('Fetching meta data failed:', error);
        if (cached?.data) {
            console.log('Using cached meta data due to error.');
            return cached.data;
        }
        throw error;
    }
}

/**
 * Функция для обновления мета-тегов в документе.
 * @param {Object} metaData - Объект с метаданными.
 */
function updateMetaTags(metaData) {
    const head = document.head;

    // Установка заголовка страницы
    if (metaData.title) {
        document.title = metaData.title;
    }

    // Функция для создания или обновления мета-тега
    const setMetaTag = (name, content) => {
        if (name === 'title') return; // Заголовок уже установлен

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

    // Установка всех мета-тегов
    for (const [key, value] of Object.entries(metaData)) {
        if (value) {
            setMetaTag(key, value);
        }
    }
}

/**
 * Основная функция для загрузки и установки мета-тегов.
 */
async function loadAndSetMetaTags() {
    const language = getCurrentLanguage();
    const page = getCurrentPage();
    const metaUrl = `/Data/${language}/pages-data/${page}.json`;

    try {
        const pageData = await fetchMetaData(metaUrl);
        if (pageData.meta) {
            updateMetaTags(pageData.meta);
        } else {
            console.warn(`No meta data found for page: ${page} in language: ${language}`);
        }
    } catch (error) {
        console.error('Error loading meta tags:', error);
    }
}

// Запуск загрузки мета-тегов при загрузке DOM
document.addEventListener('DOMContentLoaded', loadAndSetMetaTags);
