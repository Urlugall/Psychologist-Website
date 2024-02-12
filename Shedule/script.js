// Функция для плавного проявления основного блока
function fadeInMainBlock() {
    const mainBlock = document.querySelector('.main-block');
    if (mainBlock) {
        setTimeout(() => {
            mainBlock.classList.add('visible');
        }, 100); // Небольшая задержка для CSS-переходов
    }
}

// Функция обработки клика, исключая кнопки
function handleClick(e) {
    if (e.target.tagName !== 'BUTTON') {
        const mainBlock = document.querySelector('.main-block');
        mainBlock.style.opacity = '0'; // Плавное исчезновение
        setTimeout(() => {
            window.history.back(); // Возврат на предыдущую страницу после анимации
        }, 100);
    }
}

// Инициализация и установка обработчиков событий при загрузке документа
document.addEventListener('DOMContentLoaded', () => {
    fadeInMainBlock(); // Плавное проявление основного блока
    document.body.addEventListener('click', handleClick); // Обработка кликов по странице
    loadData();
});
