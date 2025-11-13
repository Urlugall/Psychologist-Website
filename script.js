document.addEventListener('DOMContentLoaded', function () {

    loadAndDisplayEvents();
    setupNavigationScroll();
    setupServicesNavigation();
    setupCarousels();
    initializeFlip();
});


function loadAndDisplayEvents() {
    // 1. Получаем язык
    const lang = getCurrentLanguage();

    // 2. Формируем URL к API
    const url = `https://psychologist-server.art-valentina-a.workers.dev/api/file?lang=${lang}&file=events.json`;
    const containerId = 'events';

    fetch(url)
        .then(response => response.json())
        .then(result => {

            const events = (result && Array.isArray(result.data)) ? result.data : [];

            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`The ${containerId} container does not exist!`);
                return;
            }
            container.innerHTML = '';

            events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('carousel-item');
                eventElement.innerHTML = `
                    <div class="alert-box">
                        <div class="event-details">${event.startDate}</div>
                        <h2>${event.title}</h2>
                        <a class="details-button" href="${event.href}">Детальнее...</a>
                    </div>
                `;
                container.appendChild(eventElement);
            });
        })
        .catch(error => console.error(`Error loading ${containerId}:`, error));
}

function setupNavigationScroll() {
    document.querySelectorAll('a[id^="navigation-"]').forEach(navElement => {
        navElement.addEventListener('click', function (event) {
            event.preventDefault(); // Предотвращаем стандартное действие ссылки

            const sectionId = navElement.id.replace('navigation', 'section');

            const sectionElement = document.getElementById(sectionId);
            if (sectionElement) {
                sectionElement.scrollIntoView({ behavior: 'smooth' });
            }
            else {
                console.error(`There are no section with name ${sectionId}`);
            }
        });
    });
}


const initializeFlip = () => {
    document.querySelectorAll('.service-card').forEach(card => {
        card.querySelector('.info-button').addEventListener('click', () => card.classList.add('flip'));
        card.addEventListener('mouseleave', () => card.classList.remove('flip'));
    });
};


function setupServicesNavigation() {
    // "Услуги" (скролл вниз)
    const servicesButton = document.getElementById('servicesButton');
    if (servicesButton) {
        servicesButton.addEventListener('click', function (e) {
            e.preventDefault();
            const section = document.getElementById('section-services');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // "Блог" (переход на страницу)
    const blogButton = document.getElementById('blogButton');
    if (blogButton) {
        blogButton.addEventListener('click', function (e) {
            e.preventDefault();
            window.location.href = '/Blog/blog.html';
        });
    }
}


const setupCarousels = () => {
    const carousels = document.querySelectorAll('.carousel');

    const moveItems = (items, index, itemWidth, itemMargin) => {
        const newTransform = -(parseInt(itemWidth) + parseInt(itemMargin)) * index;
        items.style.transform = `translateX(${newTransform}px)`;
    };

    const updateCarousel = (carousel, index) => {
        const items = carousel.querySelector('.carousel-items');
        const item = items.querySelector('.carousel-item');
        if (!item) {
            //console.error("No element with class 'carousel-item' found inside 'items'.");
            return;
        }
        const itemStyle = getComputedStyle(item);
        moveItems(items, index, itemStyle.width, itemStyle.marginRight);
    };

    const manageControls = (carousel, index, items, visibleItems) => {
        const rightControl = carousel.querySelector('.carousel-control.right');
        const leftControl = carousel.querySelector('.carousel-control.left');

        rightControl?.addEventListener('click', () => {
            index = index < items.children.length - visibleItems ? index + 1 : 0;
            updateCarousel(carousel, index);
            resetTimer(carousel, index);
        });

        leftControl?.addEventListener('click', () => {
            index = index > 0 ? index - 1 : items.children.length - visibleItems;
            updateCarousel(carousel, index);
            resetTimer(carousel, index);
        });
    };

    const resetTimer = (carousel, index) => {
        clearInterval(carousel.autoMove);
        carousel.autoMove = setInterval(() => {
            index = index < carousel.items.children.length - carousel.visibleItems ? index + 1 : 0;
            updateCarousel(carousel, index);
        }, 9000); // new interval for automatic move
    };

    carousels.forEach(carousel => {
        const items = carousel.querySelector('.carousel-items');
        const visibleItems = parseInt(carousel.getAttribute('data-visible-items'), 10);
        const moveFrequency = parseFloat(carousel.getAttribute('data-move-frequency'));
        let index = 0;

        // Store items and visibleItems in the carousel node for access in resetTimer
        carousel.items = items;
        carousel.visibleItems = visibleItems;

        // Set CSS property
        carousel.style.setProperty('--visible-items', visibleItems);

        // Initialize automatic movement
        carousel.autoMove = setInterval(() => {
            index = index < items.children.length - visibleItems ? index + 1 : 0;
            updateCarousel(carousel, index);
        }, 3000 * moveFrequency);

        manageControls(carousel, index, items, visibleItems);
        updateCarousel(carousel, index); // Initialize position on load
    });
};