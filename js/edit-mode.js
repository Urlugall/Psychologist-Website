/*
 * edit-mode.js
 * Включает режим редактирования: при двойном клике на любом текстовом элементе
 * на домене edit.art-valentina.com появляется модальное окно для правки текста и
 * отправки изменений на сервер в JSON-файл для текущего языка.
 */
(function () {
    // Активировать только на режиме редактирования
    if (!window.location.host.startsWith('edit.art-valentina.com')) {
        return;
    }

    // Создание модального окна
    const modal = document.createElement('div');
    modal.id = 'inline-edit-modal';
    Object.assign(modal.style, {
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: 9999,
        visibility: 'hidden'
    });

    const editor = document.createElement('div');
    Object.assign(editor.style, {
        backgroundColor: '#fff', padding: '20px', borderRadius: '8px',
        width: '80%', maxWidth: '500px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
    });

    const textarea = document.createElement('textarea');
    textarea.style.width = '100%';
    textarea.style.height = '150px';

    const btnSave = document.createElement('button');
    btnSave.textContent = 'Сохранить';
    btnSave.style.marginRight = '10px';

    const btnCancel = document.createElement('button');
    btnCancel.textContent = 'Отмена';

    editor.appendChild(textarea);
    editor.appendChild(document.createElement('br'));
    editor.appendChild(btnSave);
    editor.appendChild(btnCancel);
    modal.appendChild(editor);
    document.body.appendChild(modal);

    let currentElem = null;
    let jsonKey = null;

    // Определение ключа JSON по id элемента (замена '-' на '.')
    function getJsonKey(el) {
        if (el.id) {
            return el.id.replace(/-/g, '.');
        }
        return null;
    }

    // Показать модал
    function showModal(el) {
        currentElem = el;
        jsonKey = getJsonKey(el);
        textarea.value = el.innerText;
        modal.style.visibility = 'visible';
        textarea.focus();
    }

    // Скрыть модал
    function hideModal() {
        modal.style.visibility = 'hidden';
        currentElem = null;
        jsonKey = null;
    }

    // Отправка изменений на сервер
    async function saveChange(key, value) {
        const lang = localStorage.getItem('selectedLanguage') || 'en';
        try {
            const res = await fetch(`/api/save-content`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, lang, value })
            });
            if (!res.ok) throw new Error('Ошибка сохранения: ' + res.status);
        } catch (err) {
            console.error(err);
            alert('Не удалось сохранить изменения.');
        }
    }

    // Обработчики кнопок
    btnSave.addEventListener('click', () => {
        if (!currentElem || !jsonKey) { hideModal(); return; }
        const newValue = textarea.value;
        currentElem.innerText = newValue;
        saveChange(jsonKey, newValue);
        hideModal();
    });
    btnCancel.addEventListener('click', hideModal);

    // Скрыть при клике вне editor
    modal.addEventListener('click', e => {
        if (e.target === modal) hideModal();
    });

    // Двойной клик по тексту
    document.addEventListener('dblclick', e => {
        const target = e.target;
        // игнорировать интерактивные элементы
        if (['BUTTON', 'INPUT', 'TEXTAREA', 'A', 'IMG'].includes(target.tagName)) return;
        if (target.innerText && target.innerText.trim().length > 0) {
            showModal(target);
        }
    });
})();
