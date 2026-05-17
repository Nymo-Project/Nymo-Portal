(function registerFormatters(global) {
  const { App } = global;

  function formatDateTime(value, options) {
    if (!value) return "Невідомо";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Невідомо";
    return new Intl.DateTimeFormat("uk-UA", options).format(date);
  }

  function formatShortDateTime(value) {
    if (!value) return "Ніколи";
    return formatDateTime(value, { dateStyle: "short", timeStyle: "short" });
  }

  /** Компактна дата для карток профілю (один рядок, без «14 трав. 2026 р.»). */
  function formatProfileDateTime(value) {
    return formatDateTime(value, { dateStyle: "short", timeStyle: "short" });
  }

  /** COIN після переводу з «мінорних» одиниць API (/100 у users.api). */
  function formatCoinBalance(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return `0 COIN`;
    return `${new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n)} COIN`;
  }

  App.utils.formatters = {
    formatShortDateTime,
    formatProfileDateTime,
    formatCoinBalance,
  };
})(window);
