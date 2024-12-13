// Blog/scripts.js

const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('search-button');
const dropdownToggle = document.getElementById('dropdownToggle');
const dropdownContent = document.getElementById('dropdown-content');
const selectedTagsContainer = document.getElementById('selected-tags');

let selectedTags = [];

// Тоггл для выпадающего списка
dropdownToggle.addEventListener('click', () => {
    dropdownContent.classList.toggle('show');
});

// Клик вне меню для его закрытия
window.addEventListener('click', (e) => {
    if (!e.target.matches('.dropdownToggle') && !e.target.closest('.custom-dropdown')) {
        dropdownContent.classList.remove('show');
    }
});

// Обработчик изменений для всех чекбоксов внутри dropdownContent
dropdownContent.addEventListener('change', (e) => {
    if (e.target && e.target.classList.contains('tag-checkbox')) {
        if (e.target.checked && selectedTags.length >= 3) {
            e.target.checked = false;
            return;
        }
        updateSelectedTags();
        filterPosts();
    }
});

function updateSelectedTags() {
    selectedTags = [];
    const tagCheckboxes = document.querySelectorAll('.tag-checkbox');
    tagCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTags.push(checkbox.value);
        }
    });

    selectedTagsContainer.innerHTML = '';
    selectedTags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.classList.add('selected-tag');
        tagSpan.textContent = '#' + tag;

        // Добавляем обработчик клика для удаления тега
        tagSpan.addEventListener('click', () => {
            tagCheckboxes.forEach(cb => {
                if (cb.value === tag) {
                    cb.checked = false;
                }
            });
            updateSelectedTags();
            filterPosts();
        });

        selectedTagsContainer.appendChild(tagSpan);
    });
}

function debounce(func, delay) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

searchInput.addEventListener('input', debounce(() => {
    filterPosts();
}, 300));

function filterPosts() {
    const query = searchInput.value.trim().toLowerCase();
    const posts = document.querySelectorAll('.post-item');

    posts.forEach(post => {
        const title = post.querySelector('.post-title').innerText.toLowerCase();
        const shortDesc = post.querySelector('.post-short').innerText.toLowerCase();
        const tags = post.getAttribute('data-tags').split(' ');

        let matchesSearch = (query === '' || title.includes(query) || shortDesc.includes(query));
        let matchesTag = (selectedTags.length === 0 || tags.some(t => selectedTags.includes(t)));

        if (matchesSearch && matchesTag) {
            post.style.display = 'flex';
        } else {
            post.style.display = 'none';
        }
    });
}
