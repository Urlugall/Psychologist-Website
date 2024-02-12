function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

async function checkAndShowMasterAlert() {
    try {
        const data = await fetchData(`/Data/Ru/games-data/${getGameNameFromUrl()}.json`);
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
            // Перед установкой класса expanded, необходимо сбросить задержку для свойства visibility
            details.style.transitionDelay = '0s';
            details.classList.add('expanded');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupPricePanel();
    checkAndShowMasterAlert();
});
