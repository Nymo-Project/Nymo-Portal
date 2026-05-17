(function registerSharedDays(global) {
  const { App } = global;

  const pluralRulesDays =
    typeof Intl !== "undefined" && Intl.PluralRules ? new Intl.PluralRules("uk") : null;

  function formatDaysOptionLabel(n) {
    if (!pluralRulesDays) {
      return `${n} дн.`;
    }
    const key = pluralRulesDays.select(n);
    const word = key === "one" ? "день" : key === "few" ? "дні" : "днів";
    return `${n} ${word}`;
  }

  App.shared.days = { formatDaysOptionLabel };
})(window);
