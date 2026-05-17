(function registerConstants(global) {
  const { App } = global;

  App.utils.constants = {
    THEME_KEY: "orion-panel-theme",
    /**
     * Якщо true — запити йдуть на той самий origin у шлях `/api-proxy` (потрібен `npm run dev`).
     * Live Server (порт 5500) без цього проксі не підійде: став false лише якщо бекенд дозволив CORS для твого origin.
     */
    USE_API_PROXY: true,
    /** Прямий URL API (використовується коли USE_API_PROXY === false). */
    CHAT_APP_API_BASE_URL: "https://chat-app-anzi.onrender.com",
    WALLET_CURRENCY: "COIN",
  };
})(window);
