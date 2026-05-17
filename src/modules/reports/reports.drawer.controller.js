(function registerReportsDrawerController(global) {
  const { App } = global;
  const { reportsState, runtime, normalizeDrawerStatus } = App.modules.reports.state;
  const { normalizeReport, getAdminReplyText, getStatusLabel, upsertReportInState } =
    App.modules.reports.filters;
  const { renderReportDrawerContent } = App.views.reports.detail;
  const { escapeHtml } = App.shared.html;

  function getDrawerElements() {
    return {
      drawer: document.getElementById("report-detail-drawer"),
      body: document.getElementById("report-detail-body"),
      closeButton: document.getElementById("report-detail-close"),
    };
  }

  function setReportDrawerOpen(drawer, open) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.classList.remove("is-scrolled");
    if (open) drawer.scrollTop = 0;
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    App.core.syncDetailDock();
  }

  function closeReportStatusDropdown() {
    const dd = document.querySelector("[data-report-status-dropdown].is-open");
    if (!dd) return;
    dd.classList.remove("is-open");
    dd.querySelector("[data-report-status-trigger]")?.setAttribute("aria-expanded", "false");
    dd.querySelector(".stat-card__dropdown-panel")?.setAttribute("hidden", "");
  }

  function setReportStatusValue(body, status) {
    if (!body) return;
    const safe = normalizeDrawerStatus(status);
    const hidden = body.querySelector("[data-report-detail-status]");
    const dd = body.querySelector("[data-report-status-dropdown]");
    if (hidden) hidden.value = safe;
    if (!dd) return;
    const valueEl = dd.querySelector("[data-report-status-value]");
    if (valueEl) valueEl.textContent = getStatusLabel(safe);
    dd.querySelectorAll("[data-report-status-option]").forEach((opt) => {
      const isSel = opt.dataset.status === safe;
      opt.classList.toggle("is-selected", isSel);
      opt.setAttribute("aria-selected", isSel ? "true" : "false");
    });
  }

  function fillReportDrawerFields(report) {
    const { body } = getDrawerElements();
    if (!body || !report) return;
    const normalized = normalizeReport(report);
    if (!normalized) return;

    const adminReplyEl = body.querySelector("[data-report-detail-admin-reply]");
    const replyText = getAdminReplyText(normalized);

    setReportStatusValue(body, normalized.status);
    if (adminReplyEl) {
      adminReplyEl.defaultValue = replyText;
      adminReplyEl.value = replyText;
    }
  }

  function mountReportDrawerContent(report) {
    const { body } = getDrawerElements();
    if (!body || !report) return;
    body.innerHTML = renderReportDrawerContent(normalizeReport(report));
    fillReportDrawerFields(report);
    requestAnimationFrame(() => fillReportDrawerFields(report));
  }

  async function openReportDrawer(reportOrId) {
    const reportId = typeof reportOrId === "string" ? reportOrId : reportOrId?.id;
    const { drawer, body } = getDrawerElements();
    if (!drawer || !body || !reportId) return;
    const loadSeq = ++runtime.reportDrawerLoadSeq;
    App.core.closeSidebar?.();
    App.modules.usersProfileModal?.closeUserProfileModal?.({ skipDockSync: true });
    reportsState.selectedReportId = reportId;
    setReportDrawerOpen(drawer, true);
    body.innerHTML = '<div class="profile-loading">Завантаження…</div>';
    highlightSelectedRow();

    try {
      const report = normalizeReport(await App.api.reports.getReport(reportId));
      if (!report?.id) throw new Error("Некоректна відповідь сервера");
      if (loadSeq !== runtime.reportDrawerLoadSeq) return;
      upsertReportInState(report);
      mountReportDrawerContent(report);
    } catch (error) {
      if (loadSeq !== runtime.reportDrawerLoadSeq) return;
      const message = error instanceof Error ? error.message : String(error);
      body.innerHTML = `<p class="users-fetch-error" role="alert">Не вдалося завантажити скаргу: ${escapeHtml(message)}</p>`;
    }
  }

  function closeReportDrawer() {
    runtime.reportDrawerLoadSeq += 1;
    const { drawer, body } = getDrawerElements();
    reportsState.selectedReportId = null;
    setReportDrawerOpen(drawer, false);
    if (body) body.innerHTML = "";
    highlightSelectedRow();
  }

  function highlightSelectedRow() {
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;
    tableWrap.querySelectorAll("tr[data-report-id]").forEach((row) => {
      row.classList.toggle("is-selected", row.dataset.reportId === reportsState.selectedReportId);
    });
  }

  async function saveReportFromDrawer(reportId) {
    const { body } = getDrawerElements();
    if (!body) return;
    const statusEl = body.querySelector("[data-report-detail-status]");
    const adminReplyEl = body.querySelector("[data-report-detail-admin-reply]");
    const status = normalizeDrawerStatus(statusEl?.value);
    const adminReply = adminReplyEl?.value ?? "";

    try {
      await App.api.reports.patchReport(reportId, { status, adminReply });
      const report = normalizeReport(await App.api.reports.getReport(reportId));
      if (!report?.id) throw new Error("Некоректна відповідь сервера");
      upsertReportInState(report);
      await App.controllers.reports.loadAndRenderReports({ silent: true });
      mountReportDrawerContent(report);
      reportsState.selectedReportId = reportId;
      highlightSelectedRow();

      const msgEl = getDrawerElements().body?.querySelector("[data-report-save-msg]");
      if (msgEl) {
        msgEl.textContent = "Збережено";
        msgEl.hidden = false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const msgEl = body.querySelector("[data-report-save-msg]");
      if (msgEl) {
        msgEl.textContent = `Помилка: ${message}`;
        msgEl.hidden = false;
      } else {
        global.alert(`Не вдалося зберегти: ${message}`);
      }
    }
  }

  function initReportDrawer() {
    if (runtime.isReportDrawerInitialized) return;
    runtime.isReportDrawerInitialized = true;
    const { closeButton, body } = getDrawerElements();
    closeButton?.addEventListener("click", closeReportDrawer);

    if (!global.__reportStatusDropdownDocListeners) {
      global.__reportStatusDropdownDocListeners = true;
      document.addEventListener(
        "pointerdown",
        (event) => {
          if (event.target.closest("[data-report-status-dropdown]")) return;
          closeReportStatusDropdown();
        },
        true
      );
    }

    body?.addEventListener("click", (event) => {
      const statusTrigger = event.target.closest("[data-report-status-trigger]");
      if (statusTrigger) {
        event.preventDefault();
        const dd = statusTrigger.closest("[data-report-status-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeReportStatusDropdown();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          statusTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const statusOpt = event.target.closest("[data-report-status-option]");
      if (statusOpt) {
        event.preventDefault();
        setReportStatusValue(body, normalizeDrawerStatus(statusOpt.dataset.status));
        closeReportStatusDropdown();
        return;
      }

      const btn = event.target.closest("[data-report-action]");
      if (!btn) return;
      const reportId = reportsState.selectedReportId;
      if (!reportId) return;

      if (btn.dataset.reportAction === "save") {
        void saveReportFromDrawer(reportId);
      }
    });

    if (!global.__nymoReportDrawerEscape) {
      global.__nymoReportDrawerEscape = true;
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const el = document.getElementById("report-detail-drawer");
        if (!el?.classList.contains("is-open")) return;
        if (document.querySelector("[data-report-status-dropdown].is-open")) {
          closeReportStatusDropdown();
          return;
        }
        closeReportDrawer();
      });
    }
  }


  App.controllers.reportsDrawer = {
    openReportDrawer,
    closeReportDrawer,
    initReportDrawer,
    highlightSelectedRow,
  };
})(window);
