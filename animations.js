document.addEventListener('DOMContentLoaded', () => {
    if (window.innerWidth >= 1025) {
        initScrollAnimations();
    } else {
        makeAllVisible();
    }
});

function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1 
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const elementsToAnimate = document.querySelectorAll('[fade="data-fade"]');
    elementsToAnimate.forEach(el => observer.observe(el));
}

function makeAllVisible() {
    const elements = document.querySelectorAll('[fade="data-fade"]');
    elements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'none';
    });
}