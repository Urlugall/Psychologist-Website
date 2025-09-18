// Blog/Post/post-script.js

(() => {
    // Получаем параметр post_key из URL
    function getPostKeyFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('post_key');
    }

    // Показ ошибки в контейнере
    function displayError(message) {
        const container = document.getElementById('post-container') || document.body;
        container.innerHTML = '';
        const err = document.createElement('div');
        err.className = 'post-error';
        err.textContent = message;
        container.appendChild(err);
    }

    // Основная функция загрузки
    async function loadPost() {
        const postKey = getPostKeyFromUrl();
        if (!postKey) {
            console.error('Ключ поста не указан в URL.');
            displayError('Пост не найден.');
            return;
        }

        try {
            // Используем глобальные функции из content-loader.js
            const language = getCurrentLanguage();
            const posts = await fetchData(`/api/blog_posts?lang=${language}`);

            // Ищем по полю post_key вместо id
            const post = posts.find(p => String(p.post_key) === String(postKey));
            if (!post) {
                console.error(`Пост с post_key=${postKey} не найден.`);
                displayError('Пост не найден.');
                return;
            }

            // Нормализуем tags
            const tags = Array.isArray(post.tags)
                ? post.tags
                : (typeof post.tags === 'string'
                    ? post.tags.split(',').map(t => t.trim()).filter(Boolean)
                    : []);

            // Рендерим контент
            const container = document.getElementById('post-container');
            container.innerHTML = `
          <div class="post-header">
            <h1 class="post-title">${post.title}</h1>
            <p class="post-date">Дата публикации: ${post.date}</p>
          </div>
          <img 
            class="post-main-image" 
            src="${post.image}" 
            alt="Изображение поста" 
            loading="lazy"
          />
          <div class="post-content">${marked.parse(post.content)}</div>
          <div class="post-footer">
            <span class="post-tags">
              ${tags.length ? '#' + tags.join(' #') : ''}
            </span>
          </div>
        `;
        } catch (err) {
            console.error('Ошибка загрузки поста:', err);
            displayError('Не удалось загрузить пост. Попробуйте позже.');
        }
    }

    document.addEventListener('DOMContentLoaded', loadPost);
})();
