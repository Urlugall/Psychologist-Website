document.addEventListener('DOMContentLoaded', function () {
    loadAndDisplayEvents();
    setupNavigationScroll();
    setupServicesNavigation();
    setupFade();
    setupCarousels();
    initializeFlip();
});


function loadAndDisplayEvents() {
    const url = `/Data/${getCurrentLanguageFromUrl()}/events.json`; // Захардкодили URL
    const containerId = 'events'; // Захардкодили идентификатор контейнера

    fetch(url)
        .then(response => response.json())
        .then(events => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`The ${containerId} container does not exist!`);
                return;
            }
            container.innerHTML = ''; // Очистка текущего содержимого контейнера
            events.forEach(event => {
                const eventElement = document.createElement('div');
                eventElement.classList.add('carousel-item');
                eventElement.innerHTML = `
                    <div class="alert-box">
                        <div class="event-details">${event.startDate}</div>
                        <h2>${event.title}</h2>
                        <button class="details-button">Детальнее...</button>
                    </div>
                `;
                container.appendChild(eventElement);
            });
        })
        .catch(error => console.error(`Error loading ${containerId}:`, error));
}

function setupNavigationScroll() {
    document.querySelectorAll('a[id^="navigation-"]').forEach(navElement => {
        navElement.addEventListener('click', function(event) {
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
    document.querySelectorAll('.service').forEach(service => {
        service.querySelector('.info-button').addEventListener('click', () => service.classList.add('flip'));
        service.addEventListener('mouseleave', () => service.classList.remove('flip'));
    });
};


function setupServicesNavigation() {
    const servicesButton = document.getElementById('servicesButton');
    servicesButton.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('section-services').scrollIntoView({ behavior: 'smooth' });
    });
}


function setupFade() {
    const elementsToAnimate = document.querySelectorAll('[fade]');

    const showOnScroll = () => {
        elementsToAnimate.forEach(el => {
            const elementTop = el.getBoundingClientRect().top;
            const isVisible = (elementTop <= window.innerHeight);
            if (isVisible) {
                el.style.opacity = '1';
                el.style.transform = 'translateX(0) scale(1)';
            }
        });
    };

    window.addEventListener('scroll', showOnScroll);
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