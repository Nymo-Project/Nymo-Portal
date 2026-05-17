(function registerSharedIcons(global) {
  const { App } = global;

  App.shared.icons = {
    DROPDOWN_CHEVRON: `<svg class="stat-card__dropdown-chevron-svg" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 4.5L6 7.5L9 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    SORT_DIR_ICON_UP: `<svg class="users-sort-dir-btn__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 19V5M7 10l5-5 5 5"/></svg>`,
    SORT_DIR_ICON_DOWN: `<svg class="users-sort-dir-btn__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" aria-hidden="true"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M7 14l5 5 5-5"/></svg>`,
  };
})(window);
