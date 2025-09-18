// inline-editor.js
// Встраиваемый мощный inline-редактор локализации
// Работает только если в localStorage есть apiKey

(function () {
    const apiKey = localStorage.getItem('apiKey');
    if (!apiKey) return;

    const lang = localStorage.getItem('selectedLanguage') || 'en';
    const apiBase = 'https://psychologist-server.art-valentina-a.workers.dev';

    let enabled = false;

    function createToggleButton() {
        const btn = document.createElement('button');
        btn.id = 'inline-editor-toggle';
        btn.textContent = '🖉 Редактировать';
        Object.assign(btn.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: '10000',
            padding: '8px 12px',
            background: '#46992d',
            color: '#fff',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
        });
        document.body.appendChild(btn);
        return btn;
    }

    async function saveChange(key, value) {
        try {
            const resp = await fetch(`${apiBase}/api/save-content`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ key, lang, value })
            });
            if (!resp.ok) throw new Error(await resp.text());
            console.log(`Saved ${key}`);
            return true;
        } catch (err) {
            console.error('Save error:', err);
            return false;
        }
    }

    function startEditing(el) {
        if (el.isContentEditable) return;
        el.dataset.orig = el.innerHTML;
        el.contentEditable = true;
        el.style.outline = '2px dashed #46992d';
        createEditorToolbar(el);
    }

    function createEditorToolbar(el) {
        const rect = el.getBoundingClientRect();
        const toolbar = document.createElement('div');
        toolbar.className = 'inline-editor-toolbar';
        Object.assign(toolbar.style, {
            position: 'fixed',
            top: `${rect.top - 40}px`,
            left: `${rect.left}px`,
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            zIndex: '10001',
            boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            padding: '4px'
        });

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '💾';
        saveBtn.title = 'Сохранить';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✖';
        cancelBtn.title = 'Отменить';

        [saveBtn, cancelBtn].forEach(b => {
            Object.assign(b.style, {
                margin: '0 4px',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '16px'
            });
            toolbar.appendChild(b);
        });
        document.body.appendChild(toolbar);

        saveBtn.addEventListener('click', async () => {
            let key = el.id.replace(/-/g, '.');
            // Убираем префикс R2‑папки, если он присутствует
            key = key.replace(/^(pages-data|products-data|games-data|groups-data)\./, '');
            const value = el.innerHTML.trim();
            const success = await saveChange(key, value);
            teardown(false);
        });

        cancelBtn.addEventListener('click', () => teardown(true));

        function teardown(isCancel) {
            el.contentEditable = false;
            el.style.outline = 'none';
            toolbar.remove();
            if (isCancel) el.innerHTML = el.dataset.orig;
        }
    }

    document.addEventListener('click', e => {
        if (!enabled) return;
        const el = e.target.closest('[data-editable]');
        if (!el) return;
        e.preventDefault();
        startEditing(el);
    }, true);

    const toggle = createToggleButton();
    toggle.addEventListener('click', () => {
        enabled = !enabled;
        toggle.textContent = enabled ? '🔒 Готово' : '🖉 Редактировать';
    });
})();
