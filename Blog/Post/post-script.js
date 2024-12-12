// Blog/Post/post-script.js

// Функция для получения параметра id из URL
function getPostIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Функция для загрузки и отображения поста
async function loadPost() {
    const postId = getPostIdFromUrl();
    if (!postId) {
        console.error('ID поста не указан в URL.');
        displayError('Пост не найден.');
        return;
    }

    try {
        const language = getCurrentLanguage();
        const postsData = await fetchData(`/Data/${language}/blog-posts/posts.json`);
        const post = postsData.posts.find(p => p.id === postId);

        if (!post) {
            console.error('Пост с таким ID не найден.');
            displayError('Пост не найден.');
            return;
        }

        const postContainer = document.getElementById('post-container');

        // Создание элементов для отображения поста
        const postHeader = document.createElement('div');
        postHeader.classList.add('post-header');

        const postTitle = document.createElement('h1');
        postTitle.classList.add('post-title');
        postTitle.textContent = post.title;

        const postDate = document.createElement('p');
        postDate.classList.add('post-date');
        postDate.textContent = `Дата публикации: ${post.date}`;

        postHeader.appendChild(postTitle);
        postHeader.appendChild(postDate);

        const postImage = document.createElement('img');
        postImage.src = post.image;
        postImage.alt = 'Изображение поста';
        postImage.classList.add('post-main-image');
        postImage.loading = 'lazy';

        const postContent = document.createElement('div');
        postContent.classList.add('post-content');

        // Парсинг Markdown в HTML
        postContent.innerHTML = marked.parse(post.content);

        // Создание футера поста с тегами
        const postFooter = document.createElement('div');
        postFooter.classList.add('post-footer');

        const postTags = document.createElement('span');
        postTags.classList.add('post-tags');
        postTags.textContent = '#' + post.tags.join(' #');

        postFooter.appendChild(postTags);

        // Добавление всех элементов в контейнер поста
        postContainer.appendChild(postHeader);
        postContainer.appendChild(postImage);
        postContainer.appendChild(postContent);
        postContainer.appendChild(postFooter);
    } catch (error) {
        console.error('Ошибка загрузки поста:', error);
        displayError('Произошла ошибка при загрузке поста.');
    }
}

// Функция для отображения сообщения об ошибке
function displayError(message) {
    const postContainer = document.getElementById('post-container');
    postContainer.innerHTML = `<p class="error-message">${message}</p>`;
}

// Инициализация загрузки поста при загрузке страницы
document.addEventListener('DOMContentLoaded', loadPost);
