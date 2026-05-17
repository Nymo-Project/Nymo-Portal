(function registerReportDetailView(global) {
  const { App } = global;
  const { formatProfileDateTime } = App.utils.formatters;
  const { escapeAttribute, escapeHtml } = App.shared.html;
  const { DROPDOWN_CHEVRON } = App.shared.icons;
  const { DRAWER_STATUS_VALUES, normalizeDrawerStatus } = App.modules.reports.state;
  const { getStatusLabel } = App.modules.reports.filters;

  function getReportStatusDropdownMarkup(selectedStatus) {
    const safe = normalizeDrawerStatus(selectedStatus);
    const optionsHtml = DRAWER_STATUS_VALUES.map((value) => {
      const isSel = value === safe;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-report-status-option data-status="${escapeAttribute(value)}" aria-selected="${isSel ? "true" : "false"}">${escapeHtml(getStatusLabel(value))}</button>`;
    }).join("");
    return `
      <input type="hidden" id="report-detail-status" data-report-detail-status value="${escapeAttribute(safe)}">
      <div class="stat-card__dropdown users-sort-dropdown report-status-dropdown" data-report-status-dropdown>
        <button
          type="button"
          class="users-sort-dropdown__trigger"
          data-report-status-trigger
          id="report-detail-status-trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-labelledby="report-detail-status-label"
        >
          <span class="users-sort-dropdown__value" data-report-status-value>${escapeHtml(getStatusLabel(safe))}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="report-detail-status-trigger" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }


  function profileFieldRow(label, valueHtml, options = {}) {
    const valueClass = options.datetime ? " profile-field-value--datetime" : "";
    return `
      <div class="profile-field-row">
        <span class="profile-field-label">${escapeHtml(label)}</span>
        <span class="profile-field-value${valueClass}">${valueHtml}</span>
      </div>
    `;
  }


  function renderReportDrawerContent(report) {
    const statusDropdown = getReportStatusDropdownMarkup(report.status);

    const reporterName = report.reporter?.name || "—";
    const reporterInitial = reporterName !== "—" ? reporterName.trim().slice(0, 1).toUpperCase() : "?";
    const phoneValue = report.reporter?.phone
      ? escapeHtml(report.reporter.phone)
      : '<span class="profile-field-value--muted">Не вказано</span>';

    const processedRow = report.processedAt
      ? profileFieldRow("Оброблено", escapeHtml(formatProfileDateTime(report.processedAt)), { datetime: true })
      : "";

    return `
      <div class="profile-section">
        <h3 class="profile-section-title">Картка скарги</h3>
        <div class="profile-field-list">
          ${profileFieldRow("ID", escapeHtml(report.id))}
          ${profileFieldRow("Створено", escapeHtml(formatProfileDateTime(report.createdAt)), { datetime: true })}
          ${profileFieldRow("Оновлено", escapeHtml(formatProfileDateTime(report.updatedAt)), { datetime: true })}
          ${processedRow}
        </div>
      </div>
      <div class="profile-section profile-section--user">
        <h3 class="profile-section-title">Скаржник</h3>
        <div class="profile-user">
          <div class="profile-avatar profile-avatar--fallback" aria-hidden="true">${escapeHtml(reporterInitial)}</div>
          <div class="profile-field-list profile-user-info">
            ${profileFieldRow("Ім'я", escapeHtml(reporterName))}
            ${profileFieldRow("Телефон", phoneValue)}
          </div>
        </div>
      </div>
      <div class="profile-section">
        <h3 class="profile-section-title">Текст скарги</h3>
        <p class="profile-report-text">${escapeHtml(report.text || "")}</p>
      </div>
      <div class="profile-section profile-section--moderation">
        <h3 class="profile-section-title">Модерація</h3>
        <div class="profile-moderation-form">
          <div class="profile-moderation-field">
            <label class="profile-moderation-label" id="report-detail-status-label">Статус</label>
            ${statusDropdown}
          </div>
          <div class="profile-moderation-field">
            <label class="profile-moderation-label" for="report-detail-admin-reply">Відповідь адміна</label>
            <textarea
              id="report-detail-admin-reply"
              class="profile-moderation-control profile-moderation-textarea report-detail-textarea"
              data-report-detail-admin-reply
              rows="5"
              placeholder="Введіть відповідь для скаржника…"
            ></textarea>
          </div>
        </div>
      </div>
      <div class="drawer__toolbar drawer__toolbar--report-footer">
        <p class="report-detail-save-msg" data-report-save-msg hidden role="status"></p>
        <button type="button" class="drawer__action-btn drawer__action-btn--primary" data-report-action="save">Зберегти зміни</button>
      </div>
    `;
  }


  App.views.reports.detail = {
    profileFieldRow,
    renderReportDrawerContent,
    getReportStatusDropdownMarkup,
  };
})(window);
