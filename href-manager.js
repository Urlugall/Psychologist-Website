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