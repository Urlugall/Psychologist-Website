// href-manager.js

function openHomePage() {
    location.href=`/index.html`;
}

function openMasterPage() {
    location.href=`/Masters/master.html?game=${getGameNameFromUrl()}`;
}

function openGameInfo(gameName) {
    location.href=`/Games/game.html?game=${gameName}`;
}

function openGroupInfo(groupName) {
    location.href=`/Groups/group.html?group=${groupName}`;
}

function openSchedule() {
    location.href=`/Schedule/schedule.html`;
}

function openQuestPage() {
    location.href=`/Quest/quest.html`;
}