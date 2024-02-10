document.addEventListener('DOMContentLoaded', function () {
    loadContent('events.json', 'events', createEventElement);
    loadAndDisplayEvents('events.json', 'events-description');
    setupServicesNavigation();
    setupFade();
    setupCarousels();
    initializeFlip();
    addSocialSidebar();
});

const loadContent = (url, containerId, createElement, isHTML = false) => {
    fetch(url)
        .then(response => isHTML ? response.text() : response.json())
        .then(data => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`The ${containerId} container does not exist!`);
                return;
            }
            // Динамическое обновление контента контейнера
            container.innerHTML = isHTML ? data : '';
            if (!isHTML) {
                data.forEach(item => container.appendChild(createElement(item)));
            }
        })
        .catch(error => console.error(`Error loading ${containerId}:`, error));
};


function createEventElement(event) {
    const element = document.createElement('div');
    element.classList.add('carousel-item'); // Добавляем класс "carousel-item" для стилизации
    element.innerHTML = `
        <div class="alert-box">
            <div class="event-details">${event.startDate}</div>
            <h2>${event.title}</h2>
            <button class="details-button">Детальнее...</button>
        </div>
    `;

    // Найти кнопку в созданном элементе и добавить обработчик событий
    const detailsButton = element.querySelector('.details-button');
    detailsButton.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('events-description').scrollIntoView({ behavior: 'smooth' });
    });

    return element;
}


function loadAndDisplayEvents(url, containerId) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`The ${containerId} container does not exist!`);
                return;
            }

            const gamesContainer = container.querySelector('#games');
            if (!gamesContainer) {
                console.error('The games container does not exist inside ' + containerId + '!');
                return;
            }

            gamesContainer.innerHTML = ''; // Очищаем контейнер перед добавлением новых элементов

            data.forEach(eventData => {
                const eventDescription = document.createElement('a');
                eventDescription.className = 'game';
                eventDescription.href = ''; // Установите нужный URL
                eventDescription.style.backgroundImage = `url('Extra/Photos/Groups/${eventData.image}')`; // Пример пути к изображению

                eventDescription.innerHTML = `
                    <h2>${eventData.title}</h2>
                    <p>${eventData.description}</p>
                `;

                gamesContainer.appendChild(eventDescription);
            });
        })
        .catch(error => console.error(`Error loading content into ${containerId}:`, error));
}




const initializeFlip = () => {
    document.querySelectorAll('.service').forEach(service => {
        service.querySelector('.info-button').addEventListener('click', () => service.classList.add('flip'));
        service.addEventListener('mouseleave', () => service.classList.remove('flip'));
    });
};




function setupServicesNavigation() {
    const servicesButton = document.getElementById('services-button');
    servicesButton.addEventListener('click', function (e) {
        e.preventDefault();
        document.getElementById('services-header').scrollIntoView({ behavior: 'smooth' });
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
            console.error("No element with class 'carousel-item' found inside 'items'.");
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


function addSocialSidebar() {
    const socialSidebar = document.createElement('section');
    socialSidebar.id = 'social-sidebar';
    document.body.appendChild(socialSidebar);

    const socialLinks = [
        { href: "YOUR_TELEGRAM_LINK", title: "Telegram", icon: "Extra/Icons/telegram.png" },
        { href: "YOUR_INSTAGRAM_LINK", title: "Instagram", icon: "Extra/Icons/instagram.png" },
        { href: "YOUR_FACEBOOK_LINK", title: "Facebook", icon: "Extra/Icons/facebook.png" }
    ];

    socialLinks.forEach(({ href, title, icon }) => {
        const link = document.createElement('a');
        link.href = href;
        link.title = title;
        const img = document.createElement('img');
        img.src = icon;
        link.appendChild(img);
        socialSidebar.appendChild(link);
    });
}
