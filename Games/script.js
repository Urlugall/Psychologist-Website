async function checkAndShowMasterAlert() {
    try {
        const data = await fetchData(`/Data/${getCurrentLanguage()}/games-data/${getGameNameFromUrl()}.json`);
        document.getElementById('master-alert').style.display = data.masterAvailable ? 'block' : 'none';

    } catch (error) {
        console.error('Error while loading master data:', error);
        document.getElementById('master-alert').style.display = 'none';
    }
}


function openMasterPage() {
    location.href = `/Masters/Master.html?game=${getGameNameFromUrl()}`;
}

function setupPricePanel() {
    const detailsButton = document.getElementById('price-details');
    const details = document.getElementById('details');

    detailsButton.addEventListener('click', () => {
        if (details.classList.contains('expanded')) {
            details.classList.remove('expanded');
        } else {
            details.style.transitionDelay = '0s';
            details.classList.add('expanded');
        }
    });
}

function setupCarousel() {
    const carousel = document.querySelector('.grid-container');
    const items = document.querySelectorAll('.grid-item');
    const indicatorsContainer = document.getElementById('carouselIndicators');
    let currentIndex = 0;
    let isUserInteracting = false;
    let autoScrollTimeout;
    let isScrolling = false;
    let dots = [];

    function createIndicators() {
        items.forEach((item, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');
            if (index === 0) dot.classList.add('active');
            dot.addEventListener('click', () => {
                currentIndex = index;
                scrollToItem(currentIndex);
                resetAutoScroll();
            });
            indicatorsContainer.appendChild(dot);
            dots.push(dot);
        });
    }

    function updateIndicators() {
        dots.forEach((dot, index) => {
            if (index === currentIndex) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
    }

    function scrollToItem(index) {
        const itemWidth = carousel.clientWidth;
        const targetScrollLeft = index * itemWidth;
        carousel.scrollTo({ left: targetScrollLeft, behavior: 'smooth' });
    }

    function startAutoScroll() {
        clearTimeout(autoScrollTimeout);

        autoScrollTimeout = setTimeout(() => {
            if (!isUserInteracting) {
                currentIndex = (currentIndex + 1) % items.length;
                scrollToItem(currentIndex);
                updateIndicators();
            }
            startAutoScroll();
        }, 3000);
    }

    function resetAutoScroll() {
        isUserInteracting = true;
        clearTimeout(autoScrollTimeout);
        autoScrollTimeout = setTimeout(() => {
            isUserInteracting = false;
            startAutoScroll();
        }, 5000);
    }

    carousel.addEventListener('touchstart', resetAutoScroll);
    carousel.addEventListener('touchend', resetAutoScroll);
    carousel.addEventListener('wheel', resetAutoScroll);

    carousel.addEventListener('scroll', () => {
        if (!isScrolling) {
            window.requestAnimationFrame(() => {
                const itemWidth = carousel.clientWidth;
                const newIndex = Math.round(carousel.scrollLeft / itemWidth);
                if (newIndex !== currentIndex) {
                    currentIndex = newIndex;
                    updateIndicators();
                }
                isScrolling = false;
            });
            isScrolling = true;
        }
    });

    window.addEventListener('resize', () => {
        scrollToItem(currentIndex);
    });

    createIndicators();
    startAutoScroll();
}

document.addEventListener('DOMContentLoaded', () => {
    setupPricePanel();
    setupCarousel();
    checkAndShowMasterAlert();
});
