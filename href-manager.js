function getGameNameFromUrl() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get('game'); // Получение названия игры из параметров URL
}

function getCurrentLanguageFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('language') || 'eng';
}

function openMasterPage() {
    location.href=`/Masters/master.html?language=${getCurrentLanguageFromUrl()}&game=${getGameNameFromUrl()}`;
}

function openGameInfo(gameName) {
    location.href=`/Games/game.html?language=${getCurrentLanguageFromUrl()}&game=${gameName}`;
}

function openSchedule() {
    location.href=`/Schedule/schedule.html?language=${getCurrentLanguageFromUrl()}`;
}

function openQuestPage() {
    location.href=`/Quest/quest.html?language=${getCurrentLanguageFromUrl()}`;
}