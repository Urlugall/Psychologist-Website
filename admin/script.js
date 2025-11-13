(() => {
    const BASE = 'https://psychologist-server.art-valentina-a.workers.dev';

    function resolveApiKey() {
        const url = new URL(window.location.href);
        const fromQuery = url.searchParams.get('apikey');

        if (fromQuery && fromQuery.trim()) {
            localStorage.setItem('apiKey', fromQuery.trim());
            url.searchParams.delete('apikey');
            window.history.replaceState({}, '', url.toString());
            return fromQuery.trim();
        }

        const fromStorage = localStorage.getItem('apiKey');
        if (fromStorage && fromStorage.trim()) {
            return fromStorage.trim();
        }

        return '';
    }

    function blockUnauthorized() {
        document.body.innerHTML = `
            <div style="
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
                display: flex; align-items: center; justify-content: center; min-height: 100vh;
                background: #f8f8f8; color: #333; text-align: center; padding: 2rem;
            ">
                <div style="
                    background: #fff; border: 1px solid #ddd; border-radius: 8px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08); max-width: 360px; width: 100%; padding: 1.5rem;
                ">
                    <h1 style="margin-top:0; font-size:1.1rem; color:#c00;">Unauthorized</h1>
                    <p style="font-size:0.9rem; line-height:1.4;">
                        <code style="display:inline-block;margin-top:.5rem;background:#f0f0f0;padding:.25rem .5rem;border-radius:4px;">
                            ?apikey=API_KEY_HERE
                        </code>
                    </p>
                </div>
            </div>
        `;
    }

    function formatDateForInput(dateStr) {
        if (!dateStr) return '';
        if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
            return dateStr.slice(0, 10);
        }
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
            return dateStr.split('.').reverse().join('-');
        }
        try {
            return new Date(dateStr).toISOString().slice(0, 10);
        } catch (e) {
            return '';
        }
    }

    function formatDateForDB(dateStr) {
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            return dateStr;
        }
        return dateStr.split('-').reverse().join('.');
    }

    function initApp(apiKey) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        };

        // ---------- TAB SWITCH ----------
        document.querySelectorAll('nav.tabs button').forEach(btn => {
            btn.addEventListener('click', e => {
                document.querySelectorAll('nav.tabs button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');

                document.querySelectorAll('main section').forEach(s => s.classList.remove('active'));
                document.getElementById(e.target.dataset.tab).classList.add('active');
            });
        });

        // ---------- STATE ----------
        let currentLang = 'ru';
        let currentEventsLang = 'ru';
        let eventsData = [];
        let allTrans = {};
        let simpleMde = null;

        // [NEW] Переменная для хранения файла, который ждет загрузки
        let pendingUploadFile = null;

        const langSelect = document.getElementById('lang-select');
        const eventsLangSelect = document.getElementById('events-lang-select');

        // ---------- HELPERS ----------
        function attachRowBehavior(tr, namespace, objForViewModal) {
            const saveBtn = tr.querySelector('.save-btn');
            const viewBtn = tr.querySelector('.view-btn');

            tr.querySelectorAll('[contenteditable]').forEach(td => {
                td.addEventListener('input', () => {
                    td.classList.add('dirty');
                    saveBtn.disabled = false;
                });
            });

            saveBtn.addEventListener('click', () => saveRow(namespace, objForViewModal.id, tr));

            if (viewBtn) {
                viewBtn.addEventListener('click', () => openPostModal(objForViewModal));
            }
        }

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

        // ---------- POSTS (blog_posts из D1) ----------
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

                const ruPost = arr.find(p => p.language_code === 'ru');
                const mainDate = ruPost ? ruPost.date : (arr[0]?.date || '');

                // 2. Проверяем, у всех ли постов в группе такая же дата
                const isAllSameDate = arr.every(p => p.date === mainDate);

                let dateHtml = '';
                if (isAllSameDate) {
                    // Если даты совпадают (или пост один), показываем просто дату серым цветом
                    dateHtml = `<span style="font-weight: normal; color: #666; font-size: 0.85em; margin-left: 10px;">📅 ${mainDate}</span>`;
                } else {
                    // Если даты разные, перечисляем их красным цветом
                    const dateDetails = arr
                        .map(p => `<b style="color: #333;">${p.language_code}</b>: ${p.date}`)
                        .join(' | ');
                    dateHtml = `<div style="font-weight: normal; color: #666; font-size: 0.85em; margin-top: 4px;">📅 Разные даты: ${dateDetails}</div>`;
                }

                div.innerHTML = `
                    <h3 style="margin-bottom: 0.5rem;">
                        Post Key: ${key} 
                        ${isAllSameDate ? dateHtml : ''}
                    </h3>
                    ${!isAllSameDate ? dateHtml : ''}
                    
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
                        <td>${p.language_code || ''}</td>
                        <td contenteditable data-field="title">${p.title || ''}</td>
                        <td contenteditable data-field="description">${p.description || ''}</td>
                        <td contenteditable data-field="image">${p.image || ''}</td>
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

        // ---------- EVENTS ----------
        async function loadEventsFile() {
            const res = await fetch(`${BASE}/api/file?lang=${currentEventsLang}&file=events.json`, { headers });
            if (!res.ok) {
                console.error('loadEventsFile error', res.status);
                eventsData = [];
            } else {
                const { data } = await res.json();
                eventsData = Array.isArray(data) ? data : [];
            }
            renderEventsTable();
        }

        function renderEventsTable() {
            const container = document.getElementById('events-container');
            container.innerHTML = '';

            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Start Date</th>
                        <th>Href</th>
                        <th>Save</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;
            const tbody = table.querySelector('tbody');

            eventsData.forEach((ev, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${idx}</td>
                    <td contenteditable data-field="title">${ev.title || ''}</td>
                    <td contenteditable data-field="startDate">${ev.startDate || ''}</td>
                    <td contenteditable data-field="href">${ev.href || ''}</td>
                    <td><button class="save-btn" disabled>Save</button></td>
                `;

                const saveBtn = tr.querySelector('.save-btn');

                tr.querySelectorAll('[contenteditable]').forEach(td => {
                    td.addEventListener('input', () => {
                        td.classList.add('dirty');
                        saveBtn.disabled = false;
                    });
                });

                saveBtn.addEventListener('click', async () => {
                    const dirtyCells = tr.querySelectorAll('[contenteditable].dirty');
                    try {
                        for (const cell of dirtyCells) {
                            const field = cell.dataset.field;
                            const value = cell.innerText.trim();
                            const body = { key: `events.${currentEventsLang}.${idx}.${field}`, value };

                            const r = await fetch(`${BASE}/api/save-content`, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify(body)
                            });

                            if (!r.ok) throw new Error((await r.json()).error || r.statusText);

                            eventsData[idx][field] = value;
                            cell.classList.remove('dirty');
                        }
                        saveBtn.disabled = true;
                        alert('Сохранено!');
                    } catch (err) {
                        alert('Ошибка: ' + err.message);
                    }
                });

                tbody.appendChild(tr);
            });

            container.appendChild(table);
        }

        // ---------- SOCIAL LINKS ----------
        async function loadLinks() {
            const res = await fetch(`${BASE}/api/social_links`, { headers });
            if (!res.ok) return;

            const links = await res.json();
            const tbody = document.querySelector('#links-table tbody');
            tbody.innerHTML = '';

            links.forEach(l => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${l.id}</td>
                    <td contenteditable data-field="network">${l.network || ''}</td>
                    <td contenteditable data-field="url">${l.url || ''}</td>
                    <td contenteditable data-field="icon_path">${l.icon_path || ''}</td>
                    <td><button class="save-btn" disabled>Save</button></td>
                `;
                attachRowBehavior(tr, 'social_links', l);
                tbody.appendChild(tr);
            });
        }

        // ---------- MODAL (create/edit blog_post) ----------
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
        const uploadFileInput = document.getElementById('upload-file-input');
        const triggerUploadBtn = document.getElementById('trigger-upload-btn');
        const uploadStatus = document.getElementById('upload-status');

        document.getElementById('modal-close').onclick = () => {
            if (simpleMde) {
                simpleMde.toTextArea();
                simpleMde = null;
            }
            modal.style.display = 'none';
            // Сброс при закрытии
            pendingUploadFile = null;
            if (uploadFileInput) uploadFileInput.value = '';
            if (uploadStatus) uploadStatus.textContent = '';
        };

        if (triggerUploadBtn && uploadFileInput) {
            triggerUploadBtn.addEventListener('click', () => {
                uploadFileInput.click();
            });

            uploadFileInput.addEventListener('change', () => {
                const file = uploadFileInput.files[0];
                if (!file) return;

                pendingUploadFile = file;

                uploadStatus.textContent = `Выбран: ${file.name} (загрузится при сохранении)`;
                uploadStatus.style.color = '#007bff';
            });
        }

        function initEditor(initialValue = '') {
            if (simpleMde) {
                simpleMde.toTextArea();
                simpleMde = null;
            }
            contEl.value = initialValue;

            simpleMde = new EasyMDE({
                element: contEl,
                initialValue: initialValue,
                spellChecker: false,
                status: false,
                forceSync: true,
                toolbar: [
                    "bold", "italic", "heading", "|",
                    "quote", "unordered-list", "ordered-list", "|",
                    "link", "image", "|",
                    "preview", "side-by-side", "fullscreen", "|",
                    "guide"
                ]
            });

            if (initialValue) {
                simpleMde.value(initialValue);
            }
        }

        function openCreateModal() {
            if (modalHeader) modalHeader.innerText = 'New Post';
            idInput.value = '';
            postKeyEl.value = '';

            langCodeEl.value = 'ru';
            langCodeEl.disabled = true;

            titleEl.value = '';
            descEl.value = '';
            imgEl.value = '';
            dateEl.value = '';
            tagsEl.value = '';
            contEl.value = '';

            // Сброс загрузки
            pendingUploadFile = null;
            if (uploadFileInput) uploadFileInput.value = '';
            if (uploadStatus) uploadStatus.textContent = '';

            saveModalBtn.dataset.mode = 'create';
            modal.style.display = 'flex';

            initEditor('');
        }

        function openPostModal(p) {
            if (modalHeader) modalHeader.innerText = 'Edit Post';
            idInput.value = p.id;
            postKeyEl.value = p.post_key || '';

            langCodeEl.value = p.language_code || 'ru';
            langCodeEl.disabled = true;

            titleEl.value = p.title || '';
            descEl.value = p.description || '';
            imgEl.value = p.image || '';
            dateEl.value = formatDateForInput(p.date);
            tagsEl.value = typeof p.tags === 'string'
                ? p.tags
                : Array.isArray(p.tags) ? p.tags.join(', ') : '';

            // Сброс загрузки
            pendingUploadFile = null;
            if (uploadFileInput) uploadFileInput.value = '';
            if (uploadStatus) uploadStatus.textContent = '';

            saveModalBtn.dataset.mode = 'edit';
            saveModalBtn.dataset.id = p.id;
            modal.style.display = 'flex';

            initEditor(p.content || '');
        }

        const addPostBtn = document.getElementById('add-post-btn');
        if (addPostBtn) {
            addPostBtn.addEventListener('click', openCreateModal);
        }

        saveModalBtn.onclick = async () => {
            const mode = saveModalBtn.dataset.mode;
            const currentId = saveModalBtn.dataset.id;

            saveModalBtn.disabled = true;
            saveModalBtn.innerText = 'Processing...';

            try {
                if (pendingUploadFile) {
                    if (uploadStatus) uploadStatus.textContent = 'Uploading image...';

                    const formData = new FormData();
                    formData.append('file', pendingUploadFile);

                    const uploadRes = await fetch(`${BASE}/api/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': headers.Authorization },
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        throw new Error('Image upload failed: ' + (await uploadRes.json()).error);
                    }

                    const uploadResult = await uploadRes.json();
                    imgEl.value = uploadResult.url;

                    if (uploadStatus) {
                        uploadStatus.textContent = 'Image uploaded!';
                        uploadStatus.style.color = 'green';
                    }
                }

                const data = {
                    post_key: postKeyEl.value.trim(),
                    language_code: langCodeEl.value,
                    title: titleEl.value.trim(),
                    description: descEl.value.trim(),
                    image: imgEl.value.trim(),
                    date: formatDateForDB(dateEl.value),
                    tags: tagsEl.value.trim(),
                    content: simpleMde.value().trim()
                };

                if (mode === 'create') {
                    const res = await fetch(`${BASE}/api/blog_posts`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) {
                        throw new Error((await res.json()).error || res.statusText);
                    }
                } else {
                    // edit mode
                    for (let field of ['title', 'description', 'image', 'date', 'tags', 'content', 'post_key', 'language_code']) {
                        if (data[field] != null) {
                            const res = await fetch(`${BASE}/api/save-content`, {
                                method: 'PUT',
                                headers,
                                body: JSON.stringify({
                                    key: `blog_posts.${currentId}.${field}`,
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

                // Очистка
                if (simpleMde) {
                    simpleMde.toTextArea();
                    simpleMde = null;
                }
                modal.style.display = 'none';
                pendingUploadFile = null;
                loadPosts();
            } catch (err) {
                alert('Ошибка: ' + err.message);
            } finally {
                saveModalBtn.disabled = false;
                saveModalBtn.innerText = 'Save';
            }
        };

        // ---------- TRANSLATIONS ----------
        const listEl = document.getElementById('translations-list');
        const editor = document.getElementById('translations-editor');
        const nameEl = document.getElementById('trans-file-name');
        const areaEl = document.getElementById('trans-content');
        const saveBtn = document.getElementById('save-translation');

        async function loadTranslations() {
            currentLang = langSelect.value;
            listEl.innerHTML = 'Loading…';

            const res = await fetch(`${BASE}/api/translations?lang=${currentLang}`, { headers });
            if (!res.ok) {
                listEl.innerHTML = 'Access denied / error';
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
            let content;
            try {
                content = JSON.parse(areaEl.value);
            } catch (e) {
                alert('JSON невалидный');
                return;
            }

            const res = await fetch(`${BASE}/api/file`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({
                    lang: currentLang,
                    file: fname,
                    data: content
                })
            });

            if (!res.ok) {
                alert('Ошибка сохранения');
                return;
            }

            alert('Translation saved!');
            await loadTranslations();
        });

        // ---------- INIT ----------
        document.addEventListener('DOMContentLoaded', () => {
            loadPosts();
            loadLinks();

            currentEventsLang = eventsLangSelect.value || 'ru';
            loadEventsFile();

            loadTranslations();

            langSelect.onchange = () => {
                loadTranslations();
            };

            eventsLangSelect.onchange = () => {
                currentEventsLang = eventsLangSelect.value;
                loadEventsFile();
            };
        });
    }

    function bootstrap() {
        const apiKey = resolveApiKey();
        if (!apiKey) {
            blockUnauthorized();
            return;
        }
        initApp(apiKey);
    }

    bootstrap();
})();