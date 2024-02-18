function scrollToPrice() {
    const sourceElement = document.getElementById('priceButton');
    const targetElement = document.getElementById('priceDetails');

    if (sourceElement && targetElement) {
        sourceElement.addEventListener('click', function () {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
}

function togglePriceHeaderVisibility() {
    var header = document.getElementById('priceHeaderFull');
    var priceButton = document.getElementById('priceButton');
    var joinButton = document.getElementById('joinButton');
    var priceDescription = document.getElementById('priceDescription-array-li');

    header.style.display = 'none';
    priceDescription.style.display = 'none';
    priceButton.style.display = 'none';
    joinButton.style.gridColumn = '1 / -1';
}

function observeListChanges() {
    var ul = document.getElementById('priceDescription-array-li');
    console.log('observe');

    if (!ul) return; // Выходим, если элемент не найден

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                var firstItem = ul.getElementsByTagName('li')[0];
                console.log(firstItem.textContent.trim());
                if (firstItem && firstItem.textContent.trim() === '') {
                    togglePriceHeaderVisibility();
                    observer.disconnect(); // Прекращаем наблюдение после выполнения функции
                }
            }
        });
    });

    var config = { childList: true };
    observer.observe(ul, config);
}

const setupCarousels = () => {
    const carousels = document.querySelectorAll('.carousel');
    console.log(carousels);

    const moveItems = (items, index, itemWidth, itemMargin) => {
        const newTransform = -(parseInt(itemWidth) + parseInt(itemMargin)) * index;
        items.style.transform = `translateX(${newTransform}px)`;
    };

    const updateCarousel = (carousel, index) => {
        const items = carousel.querySelector('.carousel-items');
        const item = items.querySelector('p');
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
        }, 15000); // new interval for automatic move
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

document.addEventListener('DOMContentLoaded', () => {
    scrollToPrice();
    setupCarousels();
    observeListChanges();
});
