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

    function setupGalleryReveal(container) {
        let activeImage = null;
        const reveal = document.createElement('img');
        reveal.className = 'post-gallery-floating-reveal';
        reveal.alt = '';
        reveal.setAttribute('aria-hidden', 'true');
        document.body.appendChild(reveal);

        const updateReveal = () => {
            if (!activeImage || !activeImage.naturalWidth || !activeImage.naturalHeight) return;

            const item = activeImage.closest('.post-gallery-item');
            const rect = item.getBoundingClientRect();
            const coverScale = Math.max(
                rect.width / activeImage.naturalWidth,
                rect.height / activeImage.naturalHeight
            );

            reveal.style.setProperty('--reveal-left', `${rect.left + rect.width / 2}px`);
            reveal.style.setProperty('--reveal-top', `${rect.top + rect.height / 2}px`);
            reveal.style.setProperty('--reveal-width', `${activeImage.naturalWidth * coverScale}px`);
            reveal.style.setProperty('--reveal-height', `${activeImage.naturalHeight * coverScale}px`);
        };

        container.querySelectorAll('.post-gallery-item img').forEach((img) => {
            img.classList.add('post-gallery-preview');

            img.closest('.post-gallery-item').addEventListener('mouseenter', () => {
                activeImage = img;
                reveal.src = img.currentSrc || img.src;
                updateReveal();
                reveal.classList.add('is-visible');
            });

            img.closest('.post-gallery-item').addEventListener('mouseleave', () => {
                reveal.classList.remove('is-visible');
                activeImage = null;
            });
        });

        window.addEventListener('resize', updateReveal);
        window.addEventListener('scroll', updateReveal, { passive: true });
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
            setupGalleryReveal(container);
        } catch (err) {
            displayError('Error loading post. Please try again later.');
        }
    }

    document.addEventListener('DOMContentLoaded', loadPost);
})();
