function fadeInMainBlock() {
    const mainBlock = document.querySelector('.main-block');
    if (mainBlock) {
        setTimeout(() => {
            mainBlock.classList.add('visible');
        }, 100);
    }
}

function handleClick(e) {
    if (e.target.tagName !== 'BUTTON') {
        const mainBlock = document.querySelector('.main-block');
        mainBlock.style.opacity = '0';
        setTimeout(() => {
            window.history.back();
        }, 100);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fadeInMainBlock();
    document.body.addEventListener('click', handleClick);
});
