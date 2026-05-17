(function registerReportsTableView(global) {
  const { App } = global;
  const { formatShortDateTime } = App.utils.formatters;
  const { escapeAttribute, escapeHtml } = App.shared.html;
  const { DROPDOWN_CHEVRON, SORT_DIR_ICON_UP, SORT_DIR_ICON_DOWN } = App.shared.icons;
  const { formatDaysOptionLabel } = App.shared.days;
  const { getSoloStatLabelRowMarkup } = App.shared.dropdownView;
  const { STAT_ICON_TOTAL_REPORTS, STAT_ICON_NEW, STAT_ICON_PROCESSED } = App.views.reports.icons;
  const {
    reportsState,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_NEW,
    STAT_KIND_PROCESSED,
    STATUS_OPTIONS,
    SORT_FIELDS,
    STATUS_LABELS,
  } = App.modules.reports.state;
  const {
    countNewReportsWithinDays,
    countProcessedReportsWithinDays,
    getStatusLabel,
  } = App.modules.reports.filters;

  function getReportsStatWithinDaysDropdownMarkup(kind, selected) {
    const triggerId =
      kind === STAT_KIND_NEW ? "reports-new-within-trigger" : "reports-processed-within-trigger";
    const ariaLabel =
      kind === STAT_KIND_NEW
        ? "Обрати кількість днів для статистики «Нові»"
        : "Обрати кількість днів для статистики «Оброблені»";
    const optionsHtml = WITHIN_DAY_OPTIONS.map((d) => {
      const label = escapeHtml(formatDaysOptionLabel(d));
      const isSel = d === selected;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-reports-stat-option data-stat-kind="${kind}" data-days="${d}" aria-selected="${isSel ? "true" : "false"}">${label}</button>`;
    }).join("");
    const currentLabel = escapeHtml(formatDaysOptionLabel(selected));
    return `
      <div class="stat-card__dropdown" data-reports-stat-dropdown data-stat-kind="${kind}">
        <button
          type="button"
          class="stat-card__dropdown-trigger"
          data-reports-stat-trigger
          data-stat-kind="${kind}"
          id="${triggerId}"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="${escapeAttribute(ariaLabel)}"
        >
          <span class="stat-card__dropdown-value">${currentLabel}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="${triggerId}" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function getReportsStatsMarkup(totalReports, allReports, newWithinDays, processedWithinDays) {
    const newCount = countNewReportsWithinDays(allReports, newWithinDays);
    const processedCount = countProcessedReportsWithinDays(allReports, processedWithinDays);
    return `
      <div class="stats-grid-wrap">
        <div class="stats-grid stats-grid--three" aria-label="Статистика скарг">
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_TOTAL_REPORTS}</div>
            ${getSoloStatLabelRowMarkup("Всього скарг")}
            <p class="stat-card__value">${totalReports}</p>
          </article>
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_NEW}</div>
            <div class="stat-card__label-row">
              <span class="stat-card__label">Нові за останні</span>
              ${getReportsStatWithinDaysDropdownMarkup(STAT_KIND_NEW, newWithinDays)}
            </div>
            <p class="stat-card__value">${newCount}</p>
          </article>
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_PROCESSED}</div>
            <div class="stat-card__label-row">
              <span class="stat-card__label">Оброблені за останні</span>
              ${getReportsStatWithinDaysDropdownMarkup(STAT_KIND_PROCESSED, processedWithinDays)}
            </div>
            <p class="stat-card__value">${processedCount}</p>
          </article>
        </div>
      </div>
    `;
  }

  function getStatusBadgeMarkup(status) {
    const safe = STATUS_LABELS[status] ? status : "new";
    return `<span class="report-status report-status--${escapeAttribute(safe)}">${escapeHtml(
      getStatusLabel(safe)
    )}</span>`;
  }


  function getReporterCellMarkup(report) {
    const name = report.reporter?.name || "—";
    const phone = report.reporter?.phone;
    if (!phone) {
      return `<span class="users-table__user-primary">${escapeHtml(name)}</span>`;
    }
    return `
      <div class="users-table__user-cell">
        <span class="users-table__user-primary">${escapeHtml(name)}</span>
        <span class="users-table__user-sub">${escapeHtml(phone)}</span>
      </div>
    `;
  }

  function getSortDirLabel(sortDir) {
    return sortDir === "asc" ? "За зростанням" : "За спаданням";
  }

  function getStatusFilterLabel(value) {
    return STATUS_OPTIONS.find((opt) => opt.value === value)?.label || STATUS_OPTIONS[0].label;
  }

  function getReportsStatusFilterDropdownMarkup(selected) {
    const safe = STATUS_OPTIONS.some((opt) => opt.value === selected) ? selected : "all";
    const optionsHtml = STATUS_OPTIONS.map((opt) => {
      const isSel = opt.value === safe;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-reports-status-filter-option data-status-filter="${escapeAttribute(opt.value)}" aria-selected="${isSel ? "true" : "false"}">${escapeHtml(opt.label)}</button>`;
    }).join("");
    return `
      <div class="stat-card__dropdown users-sort-dropdown" data-reports-status-filter-dropdown>
        <button
          type="button"
          class="users-sort-dropdown__trigger"
          data-reports-status-filter-trigger
          id="reports-status-filter-trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-labelledby="reports-status-filter-label"
        >
          <span class="users-sort-dropdown__value">${escapeHtml(getStatusFilterLabel(safe))}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="reports-status-filter-trigger" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function getReportsSortByDropdownMarkup(selected) {
    const field = SORT_FIELDS.find((f) => f.value === selected) || SORT_FIELDS[0];
    const optionsHtml = SORT_FIELDS.map((f) => {
      const isSel = f.value === selected;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-reports-sort-option data-sort-by="${escapeAttribute(f.value)}" aria-selected="${isSel ? "true" : "false"}">${escapeHtml(f.label)}</button>`;
    }).join("");
    return `
      <div class="stat-card__dropdown users-sort-dropdown" data-reports-sort-dropdown>
        <button
          type="button"
          class="users-sort-dropdown__trigger"
          data-reports-sort-trigger
          id="reports-sort-by-trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-labelledby="reports-sort-by-label"
        >
          <span class="users-sort-dropdown__value">${escapeHtml(field.label)}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="reports-sort-by-trigger" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function getSortDirToggleMarkup(sortDir) {
    const isAsc = sortDir === "asc";
    const label = `${getSortDirLabel(sortDir)}. Натисніть, щоб змінити напрямок`;
    return `<button
      type="button"
      class="users-sort-dir-btn${isAsc ? " is-asc" : " is-desc"}"
      data-reports-sort-dir-toggle
      aria-label="${escapeAttribute(label)}"
      title="${escapeAttribute(getSortDirLabel(sortDir))}"
    >${isAsc ? SORT_DIR_ICON_UP : SORT_DIR_ICON_DOWN}</button>`;
  }

  function getReportsToolbarMarkup() {
    const { query, statusFilter, sortBy, sortDir } = reportsState;
    return `
      <div class="table-toolbar users-table-toolbar reports-toolbar">
        <div class="users-table-toolbar__row users-table-toolbar__row--main">
          <div class="filter-field reports-toolbar__search">
            <span class="filter-field__label" id="reports-search-label">Рядок пошуку</span>
            <input
              class="search-field__input"
              type="search"
              id="reports-search-input"
              placeholder="Пошук"
              value="${escapeAttribute(query)}"
              data-reports-search
              autocomplete="off"
              aria-labelledby="reports-search-label"
            />
          </div>
          <div class="filter-field reports-toolbar__status">
            <span class="filter-field__label" id="reports-status-filter-label">Статус</span>
            ${getReportsStatusFilterDropdownMarkup(statusFilter)}
          </div>
          <div class="filter-field reports-toolbar__sort-field">
            <span class="filter-field__label" id="reports-sort-by-label">Сортування</span>
            <div class="reports-sort-row">
              ${getReportsSortByDropdownMarkup(sortBy)}
              ${getSortDirToggleMarkup(sortDir)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getPaginationMarkup() {
    const { page, limit, total, totalPages } = reportsState;
    if (total === 0) return "";
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    const prevDisabled = page <= 1 ? " disabled" : "";
    const nextDisabled = page >= totalPages ? " disabled" : "";

    return `
      <div class="table-toolbar users-table-toolbar reports-pagination">
        <p class="reports-pagination__meta">Показано ${from}–${to} з ${total}</p>
        <div class="reports-pagination__nav">
          <button type="button" class="drawer__action-btn" data-reports-page-prev${prevDisabled}>Попередня</button>
          <button type="button" class="drawer__action-btn" data-reports-page-next${nextDisabled}>Наступна</button>
        </div>
      </div>
    `;
  }

  function getReportsTableMarkup() {
    const { items, selectedReportId } = reportsState;

    const rowsHtml = items
      .map((report) => {
        const isSelected = report.id === selectedReportId;
        return `
          <tr
            data-row-action="open-report"
            data-report-id="${escapeAttribute(report.id)}"
            tabindex="0"
            role="button"
            class="${isSelected ? "is-selected" : ""}"
          >
            <td class="reports-table__id users-table__cell-muted">${escapeHtml(report.id)}</td>
            <td class="users-table__cell-date">${formatShortDateTime(report.createdAt)}</td>
            <td class="users-table__td-user">${getReporterCellMarkup(report)}</td>
            <td class="reports-table__td-status">${getStatusBadgeMarkup(report.status)}</td>
          </tr>
        `;
      })
      .join("");

    const emptyRow =
      items.length === 0
        ? '<tr class="table-row--empty"><td colspan="4">Скарг за цими фільтрами не знайдено</td></tr>'
        : "";

    return `
      <div class="section-stack">
        ${getReportsStatsMarkup(
          reportsState.statsTotal,
          reportsState.allReports,
          reportsState.newWithinDays,
          reportsState.processedWithinDays
        )}
        <div class="table-wrap table-wrap--users table-wrap--reports">
          ${getReportsToolbarMarkup()}
          <div class="table-scroll">
            <table class="users-table reports-table">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Дата</th>
                  <th scope="col">Скаржник</th>
                  <th scope="col">Статус</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}${emptyRow}</tbody>
            </table>
          </div>
          ${getPaginationMarkup()}
        </div>
      </div>
    `;
  }


  function renderReportsLoadErrorMarkup(message) {
    return `<div class="section-stack"><p class="users-fetch-error" role="alert">Не вдалося завантажити скарги: ${escapeAttribute(
      message
    )}</p><p class="users-fetch-hint">Запусти панель через <code>npm run dev</code> з http://127.0.0.1:8787/</p></div>`;
  }

  App.views.reports.table = {
    getReportsTableMarkup,
    getReportsToolbarMarkup,
    renderReportsLoadErrorMarkup,
  };
})(window);
