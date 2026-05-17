(function registerSharedDropdownView(global) {
  const { App } = global;
  const { escapeHtml } = App.shared.html;
  const { DROPDOWN_CHEVRON } = App.shared.icons;
  const { formatDaysOptionLabel } = App.shared.days;

  function getStatCardLabelPlaceholderDropdownMarkup() {
    const label = escapeHtml(formatDaysOptionLabel(30));
    return `
      <span class="stat-card__dropdown stat-card__dropdown--placeholder" aria-hidden="true">
        <span class="stat-card__dropdown-trigger" tabindex="-1">
          <span class="stat-card__dropdown-value">${label}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </span>
      </span>
    `;
  }

  function getSoloStatLabelRowMarkup(labelText) {
    return (
      '<div class="stat-card__label-row">' +
      `<span class="stat-card__label">${escapeHtml(labelText)}</span>` +
      getStatCardLabelPlaceholderDropdownMarkup() +
      "</div>"
    );
  }

  App.shared.dropdownView = {
    getStatCardLabelPlaceholderDropdownMarkup,
    getSoloStatLabelRowMarkup,
  };
})(window);
