/*function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

function loadGameData() {
    const gameName = getGameNameFromUrl();
    if (!gameName) {
        console.error('Игра не указана в URL');
        // Можно отобразить сообщение об ошибке или перенаправить пользователя обратно на главную страницу
        return;
    }

    // Путь к JSON-файлу, он может быть динамически изменен в зависимости от URL
    const gameDataUrl = `/Data/Ru/games-data/${gameName}.json`;

    fetch(gameDataUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Вызов функции для обновления содержимого страницы данными из JSON
            updateData(data);
        })
        .catch(error => {
            console.error('Ошибка при загрузке данных игры:', error);
            // Здесь можно добавить обработку ошибок, например, отображение сообщения пользователю
        });
}

function updateData(game) {
    document.getElementById('name').textContent = game.name;
    document.getElementById('masterInfo-shortDescription').textContent = game.masterInfo.shortDescription;
    document.getElementById('masterInfo-masterNote').textContent = game.masterInfo.masterNote;
    document.getElementById('price').textContent = `${game.masterInfo.price}`;
    document.getElementById('author').textContent = game.masterInfo.author;
    

    const fullDescriptionContainer = document.getElementById('full-description-p');
    Object.keys(game.masterInfo.fullDescription).forEach(key => {
        const paragraph = document.createElement('p');
        paragraph.textContent = game.masterInfo.fullDescription[key];
        fullDescriptionContainer.appendChild(paragraph);
    });

    const priceInclude = document.getElementById('price-include-li');
    Object.keys(game.masterInfo.priceInclude).forEach(key => {
        const element = document.createElement('li');
        element.textContent = game.masterInfo.priceInclude[key];
        priceInclude.appendChild(element);
    });

    const demoInfo = document.getElementById('demo-info-p');
    Object.keys(game.masterInfo.demoInfo).forEach(key => {
        const element = document.createElement('p');
        element.textContent = game.masterInfo.demoInfo[key];
        demoInfo.appendChild(element);
    });

    // Временные меры
    const randomValue = Math.random();
    document.querySelector('.game-header').style.backgroundImage = `url(${game.image}?v=${randomValue})`;
}*/


document.addEventListener('DOMContentLoaded', () => {
    loadGameData();
});