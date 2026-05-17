(function registerReportsViewIcons(global) {
  const { App } = global;
  App.views.reports = App.views.reports || {};
  App.views.reports.icons = {
    STAT_ICON_TOTAL_REPORTS: `<svg class="stat-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M14 2v6h6M8 13h8M8 17h5"/></svg>`,
    STAT_ICON_NEW: `<svg class="stat-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75"/><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" d="M12 8v8M8 12h8"/></svg>`,
    STAT_ICON_PROCESSED: `<svg class="stat-card__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75"/></svg>`,
  };
})(window);
