document.addEventListener('DOMContentLoaded', function() {
    loadContent('events.json', 'events', createEventElement);
    loadContent('blog.json', 'blog', createBlogPostElement);
    loadContent('about.html', 'aboutContent', null, true);
    setupCarousels();
});

function loadContent(url, containerId, createElement, isHTML = false) {
    fetch(url)
        .then(response => isHTML ? response.text() : response.json())
        .then(data => {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`The ${containerId} container does not exist!`);
                return;
            }
            if (isHTML) {
                container.innerHTML = data;
            } else {
                data.forEach(item => container.appendChild(createElement(item)));
            }
        })
        .catch(error => console.error(`Error loading ${containerId}:`, error));
}

function createEventElement(event) {
    const element = document.createElement('div');
    element.innerHTML = `<h3>${event.title}</h3><p>${event.date}</p>`;
    return element;
}

function createBlogPostElement(post) {
    const element = document.createElement('div');
    element.innerHTML = `<h4>${post.title}</h4><p>${post.summary}</p>`;
    return element;
}

function setupNavigation() {
    const servicesButton = document.getElementById('services-button');
    servicesButton.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('stats').scrollIntoView({ behavior: 'smooth' });
    });
}

function setupCarousels() {
    const carousels = document.querySelectorAll('.carousel');

    carousels.forEach(carousel => {
        const items = carousel.querySelector('.carousel-items');
        const visibleItems = parseInt(carousel.getAttribute('data-visible-items'), 10);
        carousel.style.setProperty('--visible-items', visibleItems);
        let index = 0;
        let interval = 3000;
        let autoMove = setInterval(next, interval);

        function update() {
            const itemWidth = items.querySelector('.carousel-item').offsetWidth + 20; // + margin
            const newTransform = -itemWidth * index;
            items.style.transform = `translateX(${newTransform}px)`;
        }

        function next() {
            if (index < items.children.length - visibleItems) {
                index++;
            } else {
                index = 0;
            }
            update();
        }

        function prev() {
            if (index > 0) {
                index--;
            } else {
                index = items.children.length - visibleItems;
            }
            update();
        }

        carousel.querySelector('.carousel-control.right').addEventListener('click', () => {
            next();
            resetTimer();
        });

        carousel.querySelector('.carousel-control.left').addEventListener('click', () => {
            prev();
            resetTimer();
        });

        function resetTimer() {
            clearInterval(autoMove);
            autoMove = setInterval(next, 9000); // new interval for automatic move
        }

        update(); // Initialize position on load
    });
}