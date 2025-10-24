(() => {
    const BASE = 'https://psychologist-server.art-valentina-a.workers.dev';
    const apiKey = localStorage.getItem('apiKey');
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
    };

    // 1. Таб-меню
    document.querySelectorAll('nav.tabs button').forEach(btn => {
        btn.addEventListener('click', e => {
            document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
            document.getElementById(e.target.dataset.tab).classList.add('active');
        });
    });

    function resolveApiKey() {
        const url = new URL(window.location.href);
        const fromQuery = url.searchParams.get('apikey');

        if (fromQuery && fromQuery.trim()) {
            // сохраним ключ из URL для следующих заходов
            localStorage.setItem('apiKey', fromQuery.trim());

            // опционально можно подчистить URL от apikey чтобы не торчал в истории/адресной строке
            url.searchParams.delete('apikey');
            window.history.replaceState({}, '', url.toString());

            return fromQuery.trim();
        }

        const fromStorage = localStorage.getItem('apiKey');
        if (fromStorage && fromStorage.trim()) {
            return fromStorage.trim();
        }

        return ''; // нет ключа
    }

    function blockUnauthorized() {
        document.body.innerHTML = `
            <div style="
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: #f8f8f8;
                color: #333;
                text-align: center;
                padding: 2rem;
            ">
                <div style="
                    background: #fff;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                    max-width: 360px;
                    width: 100%;
                    padding: 1.5rem;
                ">
                    <h1 style="margin-top:0; font-size:1.1rem; color:#c00;">Unauthorized</h1>
                    <p style="font-size:0.9rem; line-height:1.4;">
                        <code style="display:inline-block;margin-top:.5rem;background:#f0f0f0;padding:.25rem .5rem;border-radius:4px;">
                            ?apikey=ВАШ_КЛЮЧ
                        </code>
                    </p>
                </div>
            </div>
        `;
    }

    function initApp(apiKey) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        };

        // ------------------------
        // 1. Таб-меню
        // ------------------------
        document.querySelectorAll('nav.tabs button').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
                document.getElementById(e.target.dataset.tab).classList.add('active');
            });
        });

        // ------------------------
        // 2. Трекер изменений .dirty + Save/Disable + View
        // ------------------------
        function attachRowBehavior(tr, namespace, p) {
            const saveBtn = tr.querySelector('.save-btn');
            const viewBtn = tr.querySelector('.view-btn');

            // Любое изменение ячейки делает её "грязной"
            tr.querySelectorAll('[contenteditable]').forEach(td => {
                td.addEventListener('input', () => {
                    td.classList.add('dirty');
                    saveBtn.disabled = false;
                });
            });

            // Сохранение строки
            saveBtn.addEventListener('click', () => saveRow(namespace, p.id, tr));

            // Открыть модалку со всем постом
            if (viewBtn) {
                viewBtn.addEventListener('click', () => openPostModal(p));
            }
        }

        // ------------------------
        // 3. Сохранение dirty полей через /api/save-content
        // ------------------------
        async function saveRow(namespace, id, tr) {
            const dirty = Array.from(tr.querySelectorAll('[contenteditable].dirty'));
            if (!dirty.length) {
                alert('Нет изменений.');
                return;
            }

            try {
                for (let td of dirty) {
                    const field = td.dataset.field;
                    const value = td.innerText.trim();

                    const res = await fetch(`${BASE}/api/save-content`, {
                        method: 'PUT',
                        headers,
                        body: JSON.stringify({
                            key: `${namespace}.${id}.${field}`,
                            lang: null,
                            value
                        })
                    });

                    if (!res.ok) {
                        throw new Error((await res.json()).error || res.statusText);
                    }

                    td.classList.remove('dirty');
                }

                tr.querySelector('.save-btn').disabled = true;
                alert('Сохранено!');
            } catch (e) {
                alert('Ошибка: ' + e.message);
            }
        }

        // ------------------------
        // 4. Загрузка POSTS
        // ------------------------
        async function loadPosts() {
            const res = await fetch(`${BASE}/api/blog_posts`, { headers });
            if (!res.ok) {
                console.error('loadPosts error', res.status);
                return;
            }

            const posts = await res.json();
            const groups = {};
            posts.forEach(p => {
                (groups[p.post_key] = groups[p.post_key] || []).push(p);
            });

            const container = document.getElementById('posts-container');
            container.innerHTML = '';

            Object.entries(groups).forEach(([key, arr]) => {
                const div = document.createElement('div');
                div.className = 'group';
                div.innerHTML = `
                    <h3>Post Key: ${key}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Lang</th>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Image</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                `;
                const tbody = div.querySelector('tbody');

                arr.forEach(p => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${p.id}</td>
                        <td>${p.language_code}</td>
                        <td contenteditable data-field="title">${p.title}</td>
                        <td contenteditable data-field="description">${p.description}</td>
                        <td contenteditable data-field="image">${p.image}</td>
                        <td>
                            <button class="view-btn">View</button>
                            <button class="save-btn" disabled>Save</button>
                        </td>
                    `;
                    attachRowBehavior(tr, 'blog_posts', p);
                    tbody.appendChild(tr);
                });

                container.appendChild(div);
            });
        }

        // ------------------------
        // 5. Загрузка EVENTS
        // ------------------------
        async function loadEvents() {
            const res = await fetch(`${BASE}/api/events`, { headers });
            if (!res.ok) {
                console.error('loadEvents error', res.status);
                return;
            }

            const evs = await res.json();
            const groups = {};
            evs.forEach(e => {
                (groups[e.event_key] = groups[e.event_key] || []).push(e);
            });

            const container = document.getElementById('events-container');
            container.innerHTML = '';

            Object.entries(groups).forEach(([key, arr]) => {
                const div = document.createElement('div');
                div.classList.add('group');
                div.innerHTML = `<h3>Event Key: ${key}</h3>`;
                const table = document.createElement('table');
                table.innerHTML = `
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Lang</th>
                            <th>Title</th>
                            <th>Start Date</th>
                            <th>Href</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                `;
                const tbody = table.querySelector('tbody');

                arr.forEach(e => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${e.id}</td>
                        <td>${e.language_code}</td>
                        <td contenteditable data-field="title">${e.title}</td>
                        <td contenteditable data-field="start_date">${e.start_date}</td>
                        <td contenteditable data-field="href">${e.href}</td>
                        <td>
                            <button class="save-btn" disabled>Save</button>
                        </td>
                    `;
                    attachRowBehavior(tr, 'events', e);
                    tbody.appendChild(tr);
                });

                div.appendChild(table);
                container.appendChild(div);
            });
        }

        // ------------------------
        // 6. Загрузка SOCIAL LINKS
        // ------------------------
        async function loadLinks() {
            const res = await fetch(`${BASE}/api/social_links`, { headers });
            if (!res.ok) {
                console.error('loadLinks error', res.status);
                return;
            }

            const links = await res.json();
            const tbody = document.querySelector('#links-table tbody');
            tbody.innerHTML = '';

            links.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${l.id}</td>
                    <td contenteditable data-field="network">${l.network}</td>
                    <td contenteditable data-field="url">${l.url}</td>
                    <td contenteditable data-field="icon_path">${l.icon_path}</td>
                    <td>
                        <button class="save-btn" disabled>Save</button>
                    </td>
                `;
                attachRowBehavior(tr, 'social_links', l);
                tbody.appendChild(tr);
            });
        }

        // ------------------------
        // 7. Модалка поста (create/edit)
        // ------------------------
        const modal = document.getElementById('post-modal');
        const modalHeader = modal.querySelector('header h2') || modal.querySelector('h2');
        const idInput = document.getElementById('modal-post-id');
        const postKeyEl = document.getElementById('modal-post-key');
        const langCodeEl = document.getElementById('modal-language-code');
        const titleEl = document.getElementById('modal-title');
        const descEl = document.getElementById('modal-description');
        const imgEl = document.getElementById('modal-image');
        const dateEl = document.getElementById('modal-date');
        const tagsEl = document.getElementById('modal-tags');
        const contEl = document.getElementById('modal-content');
        const saveModalBtn = document.getElementById('modal-save');

        document.getElementById('modal-close').onclick = () => {
            modal.style.display = 'none';
        };

        // Открыть пустую модалку для создания нового поста
        function openCreateModal() {
            if (modalHeader) modalHeader.innerText = 'New Post';
            idInput.value = '';
            postKeyEl.value = '';
            langCodeEl.value = 'en';
            titleEl.value = '';
            descEl.value = '';
            imgEl.value = '';
            dateEl.value = '';
            tagsEl.value = '';
            contEl.value = '';
            saveModalBtn.dataset.mode = 'create';
            modal.style.display = 'flex';
        }

        // Открыть модалку для редактирования существующего поста
        function openPostModal(p) {
            if (modalHeader) modalHeader.innerText = 'Edit Post';
            idInput.value = p.id;
            postKeyEl.value = p.post_key;
            langCodeEl.value = p.language_code;
            titleEl.value = p.title;
            descEl.value = p.description;
            imgEl.value = p.image;
            dateEl.value = p.date?.slice(0, 10) || '';
            tagsEl.value =
                typeof p.tags === 'string'
                    ? p.tags
                    : Array.isArray(p.tags)
                        ? p.tags.join(', ')
                        : '';
            contEl.value = p.content || '';
            saveModalBtn.dataset.mode = 'edit';
            saveModalBtn.dataset.id = p.id;
            modal.style.display = 'flex';
        }

        const addPostBtn = document.getElementById('add-post-btn');
        if (addPostBtn) {
            addPostBtn.addEventListener('click', openCreateModal);
        }

        // Сохранение поста из модалки (create или edit)
        saveModalBtn.onclick = async () => {
            const mode = saveModalBtn.dataset.mode;
            const data = {
                post_key: postKeyEl.value.trim(),
                language_code: langCodeEl.value,
                title: titleEl.value.trim(),
                description: descEl.value.trim(),
                image: imgEl.value.trim(),
                date: dateEl.value,
                tags: tagsEl.value.trim(),
                content: contEl.value.trim()
            };

            try {
                let res;

                if (mode === 'create') {
                    // создаём новый пост
                    res = await fetch(`${BASE}/api/blog_posts`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) {
                        throw new Error((await res.json()).error || res.statusText);
                    }
                } else {
                    // редактируем уже существующую запись
                    const id = saveModalBtn.dataset.id;

                    // воркер позволяет обновлять поля через /api/save-content
                    for (let field of ['title', 'description', 'image', 'date', 'tags', 'content', 'post_key']) {
                        if (data[field] != null) {
                            res = await fetch(`${BASE}/api/save-content`, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify({
                                    key: `blog_posts.${id}.${field}`,
                                    lang: null,
                                    value: data[field]
                                })
                            });
                            if (!res.ok) {
                                throw new Error((await res.json()).error || res.statusText);
                            }
                        }
                    }
                }

                alert('Успешно сохранено!');
                modal.style.display = 'none';
                loadPosts(); // перезагружаем список постов после апдейта
            } catch (err) {
                alert('Ошибка при сохранении: ' + err.message);
            }
        };

        // ------------------------
        // 8. TRANSLATIONS
        // ------------------------
        let allTrans = {};
        const langSelect = document.getElementById('lang-select');
        const listEl = document.getElementById('translations-list');
        const editor = document.getElementById('translations-editor');
        const nameEl = document.getElementById('trans-file-name');
        const areaEl = document.getElementById('trans-content');
        const saveBtn = document.getElementById('save-translation');

        async function loadTranslations() {
            // переводы в рабочей версии админки считаем приватной зоной
            // поэтому на бэке /api/all-translations лучше тоже проверять ключ
            const lang = langSelect.value;
            listEl.innerHTML = 'Loading…';

            const res = await fetch(`${BASE}/api/all-translations?lang=${lang}`, {
                headers
            });

            if (!res.ok) {
                listEl.innerHTML = 'Access denied / error';
                console.error('loadTranslations error', res.status);
                return;
            }

            allTrans = await res.json();
            listEl.innerHTML = '';

            Object.keys(allTrans).forEach(fname => {
                const li = document.createElement('li');
                li.textContent = fname;
                li.onclick = () => {
                    nameEl.innerText = fname;
                    areaEl.value = JSON.stringify(allTrans[fname], null, 2);
                    editor.style.display = 'block';
                };
                listEl.appendChild(li);
            });
        }

        saveBtn.addEventListener('click', async () => {
            const fname = nameEl.innerText;
            const content = JSON.parse(areaEl.value);

            await fetch(`${BASE}/api/save-content`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    key: fname.replace(/\//g, '.'),
                    lang: langSelect.value,
                    value: content
                })
            });

            alert('Translation saved!');
            await loadTranslations();
        });

        // ------------------------
        // 9. Финальная инициализация UI после загрузки DOM
        // ------------------------
        document.addEventListener('DOMContentLoaded', () => {
            loadPosts();
            loadEvents();
            loadLinks();
            loadTranslations();
            langSelect.onchange = loadTranslations;
        });
    }

    /**
     * bootstrap():
     * 1. Пытаемся добыть ключ.
     * 2. Если нет ключа -> показываем Unauthorized и прекращаем работу.
     * 3. Если ключ нашли -> инициализируем всё приложение с этим ключом.
     */
    function bootstrap() {
        const apiKey = resolveApiKey();

        // проверяем сразу здесь, до любой логики
        if (!apiKey) {
            blockUnauthorized();
            return;
        }

        // грузим полноценную админку
        initApp(apiKey);
    }

    // Запускаем bootstrap немедленно
    bootstrap();
})();