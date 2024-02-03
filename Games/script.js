function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

function loadGameData() {
    // Путь к JSON-файлу, он может быть динамически изменен в зависимости от URL
    const gameDataUrl = `/Games/games-data/${gameName}.json`;

    fetch(gameDataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Вызов функции для обновления содержимого страницы данными из JSON
            updatePageWithGameData(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных игры:', error);
            // Здесь можно добавить обработку ошибок, например, отображение сообщения пользователю
        });
}


function updatePageWithGameData(game) {
    document.getElementById('title-text').textContent = game.name;
    document.getElementById('short-description').textContent = game.shortDescription;

    document.getElementById('group-price').textContent = game.price.group;
    document.getElementById('solo-price').textContent = game.price.individual;
    document.getElementById('group-time').textContent = game.duration.group;
    document.getElementById('solo-time').textContent = game.duration.individual;

    document.getElementById('stats-group-time').textContent = game.stats.duration.group;
    document.getElementById('stats-solo-time').textContent = game.stats.duration.individual;
    document.getElementById('stats-type').textContent = game.stats.type;
    document.getElementById('stats-players-min').textContent = game.stats.players.min;
    document.getElementById('stats-players-max').textContent = game.stats.players.max;

    // Временные меры
    const randomValue = Math.random();
    document.querySelector('.game-header').style.backgroundImage = `url(${game.image}?v=${randomValue})`;
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



const gameName = getGameNameFromUrl();
if (gameName) {
    document.addEventListener('DOMContentLoaded', loadGameData);
    document.addEventListener('DOMContentLoaded', setupPricePanel);
} else {
    console.error('Игра не указана в URL');
    // Можно отобразить сообщение об ошибке или перенаправить пользователя обратно на главную страницу
}