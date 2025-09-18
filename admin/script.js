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

    // 2. Трекер изменений .dirty + Save/Disable, и кнопка View
    function attachRowBehavior(tr, namespace, p) {
        const saveBtn = tr.querySelector('.save-btn');
        const viewBtn = tr.querySelector('.view-btn');
        // input tracking
        tr.querySelectorAll('[contenteditable]').forEach(td => {
            td.addEventListener('input', () => {
                td.classList.add('dirty');
                saveBtn.disabled = false;
            });
        });
        // save handler
        saveBtn.addEventListener('click', () => saveRow(namespace, p.id, tr));
        // view handler (только если кнопка существует)
        if (viewBtn) {
            viewBtn.addEventListener('click', () => openPostModal(p));
        }
    }

    // 3. Сохранение dirty-полей
    async function saveRow(namespace, id, tr) {
        const dirty = Array.from(tr.querySelectorAll('[contenteditable].dirty'));
        if (!dirty.length) return alert('Нет изменений.');
        try {
            for (let td of dirty) {
                const field = td.dataset.field;
                const value = td.innerText.trim();
                const res = await fetch(`${BASE}/api/save-content`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({ key: `${namespace}.${id}.${field}`, lang: null, value })
                });
                if (!res.ok) throw new Error((await res.json()).error || res.statusText);
                td.classList.remove('dirty');
            }
            tr.querySelector('.save-btn').disabled = true;
            alert('Сохранено!');
        } catch (e) {
            alert('Ошибка: ' + e.message);
        }
    }

    // 4. Загрузка POSTS с кнопкой View
    async function loadPosts() {
        const res = await fetch(`${BASE}/api/blog_posts`, { headers });
        const posts = await res.json();
        const groups = {};
        posts.forEach(p => (groups[p.post_key] = groups[p.post_key] || []).push(p));

        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        Object.entries(groups).forEach(([key, arr]) => {
            const div = document.createElement('div');
            div.className = 'group';
            div.innerHTML = `<h3>Post Key: ${key}</h3>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th><th>Lang</th><th>Title</th>
                            <th>Description</th><th>Image</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>`;
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
                    </td>`;
                attachRowBehavior(tr, 'blog_posts', p);
                tbody.appendChild(tr);
            });

            container.appendChild(div);
        });
    }

    // 5. Загрузка EVENTS (аналогично, но без кнопки View)
    async function loadEvents() {
        const res = await fetch(`${BASE}/api/events`, { headers });
        const evs = await res.json();
        const groups = {};
        evs.forEach(e => {
            groups[e.event_key] = groups[e.event_key] || [];
            groups[e.event_key].push(e);
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
                        <th>ID</th><th>Lang</th><th>Title</th>
                        <th>Start Date</th><th>Href</th><th>Actions</th>
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

    // 6. Загрузка SOCIAL LINKS
    async function loadLinks() {
        const res = await fetch(`${BASE}/api/social_links`, { headers });
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

    // 7. Модалка - рефакторим для двух режимов
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

    document.getElementById('modal-close').onclick = () => modal.style.display = 'none';

    // Открыть для создания нового поста
    function openCreateModal() {
        if (modalHeader) modalHeader.innerText = 'New Post';
        idInput.value = '';
        postKeyEl.value = '';
        langCodeEl.value = 'en';       // default
        titleEl.value = '';
        descEl.value = '';
        imgEl.value = '';
        dateEl.value = '';
        tagsEl.value = '';
        contEl.value = '';
        saveModalBtn.dataset.mode = 'create';
        modal.style.display = 'flex';
    }

    // Открыть для редактирования
    function openPostModal(p) {
        if (modalHeader) modalHeader.innerText = 'Edit Post';
        idInput.value = p.id;
        postKeyEl.value = p.post_key;
        langCodeEl.value = p.language_code;
        titleEl.value = p.title;
        descEl.value = p.description;
        imgEl.value = p.image;
        dateEl.value = p.date?.slice(0,10) || '';
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

    // Обработчик «Add Post» кнопки
    const addPostBtn = document.getElementById('add-post-btn');
    if (addPostBtn) {
        addPostBtn.addEventListener('click', openCreateModal);
    }

    // Сохранение (и POST, и PUT)
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
                res = await fetch(`${BASE}/api/blog_posts`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(data)
                });
                if (!res.ok) throw new Error((await res.json()).error || res.statusText);
            } else {
                const id = saveModalBtn.dataset.id;
                // обновляем только поля, разрешённые воркером
                for (let field of ['title','description','image','date','tags','content','post_key']) {
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
                        if (!res.ok) throw new Error((await res.json()).error || res.statusText);
                    }
                }
            }

            alert('Успешно сохранено!');
            modal.style.display = 'none';
            loadPosts();

        } catch (err) {
            alert('Ошибка при сохранении: ' + err.message);
        }
    };

    // 8. TRANSLATIONS без изменений
    let allTrans = {};
    const langSelect = document.getElementById('lang-select');
    const listEl = document.getElementById('translations-list');
    const editor = document.getElementById('translations-editor');
    const nameEl = document.getElementById('trans-file-name');
    const areaEl = document.getElementById('trans-content');
    const saveBtn = document.getElementById('save-translation');

    async function loadTranslations() {
        const lang = langSelect.value;
        listEl.innerHTML = 'Loading…';
        const res = await fetch(`${BASE}/api/all-translations?lang=${lang}`, { headers });
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

    // 9. Инициализация
    document.addEventListener('DOMContentLoaded', () => {
        loadPosts();
        loadEvents();
        loadLinks();
        loadTranslations();
        langSelect.onchange = loadTranslations;
    });

})();
