/*
 * js/api-key.js
 * Получает API-ключ из URL-параметра и сохраняет его в localStorage
 */
(function () {
  // Парсим query string
  const params = new URLSearchParams(window.location.search);
  const apiKey = params.get('api-key');
  if (apiKey) {
    // Сохраняем в localStorage
    localStorage.setItem('apiKey', apiKey);
    // Убираем параметр из адресной строки, чтобы не светить ключ
    const cleanUrl = window.location.origin + window.location.pathname + window.location.hash;
    history.replaceState(null, '', cleanUrl);
    console.log('API key сохранён в localStorage');
  }
})();