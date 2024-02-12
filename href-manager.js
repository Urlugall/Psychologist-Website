function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

function openMasterPage() {
    location.href=`/Masters/master.html?game=${getGameNameFromUrl()}`;
}

function openGameInfo(gameName) {
    location.href=`/Games/game.html?game=${gameName}`;
}

function openSchedule() {
    location.href=`/Schedule/schedule.html`;
}