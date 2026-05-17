(function registerReportsController(global) {
  const { App } = global;
  const {
    reportsState,
    runtime,
    STATUS_OPTIONS,
    SORT_FIELDS,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_NEW,
    STAT_KIND_PROCESSED,
  } = App.modules.reports.state;
  const { getReportsTableMarkup, renderReportsLoadErrorMarkup } = App.views.reports.table;

  function closeReportsStatDropdowns() {
    document.querySelectorAll("[data-reports-stat-dropdown].is-open").forEach((el) => {
      el.classList.remove("is-open");
      el.querySelector("[data-reports-stat-trigger]")?.setAttribute("aria-expanded", "false");
      el.querySelector(".stat-card__dropdown-panel")?.setAttribute("hidden", "");
    });
  }

  function closeReportsPageDropdowns() {
    closeReportsToolbarDropdowns();
    closeReportsStatDropdowns();
  }

  function closeReportsToolbarDropdowns() {
    document
      .querySelectorAll("[data-reports-status-filter-dropdown].is-open, [data-reports-sort-dropdown].is-open")
      .forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector("[data-reports-status-filter-trigger], [data-reports-sort-trigger]")?.setAttribute(
          "aria-expanded",
          "false"
        );
        el.querySelector(".stat-card__dropdown-panel")?.setAttribute("hidden", "");
      });
  }

  async function fetchReportsList() {
    const data = await App.api.reports.listReports({
      status: reportsState.statusFilter,
      q: reportsState.query,
      sortBy: reportsState.sortBy,
      sortDir: reportsState.sortDir,
      page: reportsState.page,
      limit: reportsState.limit,
    });
    reportsState.items = Array.isArray(data.items) ? data.items : [];
    reportsState.total = Number(data.total) || 0;
    reportsState.page = Number(data.page) || 1;
    reportsState.limit = Number(data.limit) || reportsState.limit;
    reportsState.totalPages = Number(data.totalPages) || 1;
    reportsState.loadError = null;
  }

  async function fetchAllReportsForStats() {
    let page = 1;
    let all = [];
    let total = 0;
    let totalPages = 1;
    do {
      const data = await App.api.reports.listReports({
        sortBy: "createdAt",
        sortDir: "desc",
        page,
        limit: 100,
      });
      total = Number(data.total) || 0;
      totalPages = Number(data.totalPages) || 1;
      all = all.concat(Array.isArray(data.items) ? data.items : []);
      page += 1;
    } while (page <= totalPages);
    reportsState.allReports = all;
    reportsState.statsTotal = total;
  }

  function renderReportsView(options = {}) {
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;

    if (reportsState.loadError) {
      tableWrap.innerHTML = renderReportsLoadErrorMarkup(reportsState.loadError);
      return;
    }

    tableWrap.innerHTML = getReportsTableMarkup();
    App.controllers.reportsDrawer.highlightSelectedRow();

    if (options.restoreSearchFocus) {
      const input = tableWrap.querySelector("[data-reports-search]");
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }

    if (options.restoreReportsStatDropdownFocus) {
      const triggerId =
        options.restoreReportsStatDropdownFocus === STAT_KIND_NEW
          ? "reports-new-within-trigger"
          : "reports-processed-within-trigger";
      document.getElementById(triggerId)?.focus();
    }
  }

  function scheduleReportsReload(options = {}) {
    if (runtime.searchDebounceTimer) clearTimeout(runtime.searchDebounceTimer);
    runtime.searchDebounceTimer = setTimeout(() => {
      runtime.searchDebounceTimer = null;
      void loadAndRenderReports(options);
    }, options.immediate ? 0 : 300);
  }

  async function loadAndRenderReports(options = {}) {
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;

    if (!options.silent) {
      tableWrap.textContent = "Завантаження даних...";
    }

    try {
      await Promise.all([fetchReportsList(), fetchAllReportsForStats()]);
    } catch (error) {
      reportsState.items = [];
      reportsState.allReports = [];
      reportsState.statsTotal = 0;
      reportsState.total = 0;
      reportsState.loadError = error instanceof Error ? error.message : String(error);
      renderReportsView();
      return;
    }

    renderReportsView(options);
  }

  function initReportsDelegation() {
    if (runtime.isReportsDelegationInitialized) return;
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;

    tableWrap.addEventListener("input", (event) => {
      const input = event.target.closest("[data-reports-search]");
      if (!input) return;
      reportsState.query = input.value;
      reportsState.page = 1;
      scheduleReportsReload({ restoreSearchFocus: true });
    });

    if (!global.__reportsPageDropdownDocListeners) {
      global.__reportsPageDropdownDocListeners = true;
      document.addEventListener(
        "pointerdown",
        (event) => {
          if (
            event.target.closest(
              "[data-reports-status-filter-dropdown], [data-reports-sort-dropdown], [data-reports-stat-dropdown]"
            )
          ) {
            return;
          }
          closeReportsPageDropdowns();
        },
        true
      );
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        closeReportsPageDropdowns();
      });
    }

    tableWrap.addEventListener("click", (event) => {
      const statTrigger = event.target.closest("[data-reports-stat-trigger]");
      if (statTrigger) {
        event.preventDefault();
        const dd = statTrigger.closest("[data-reports-stat-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeReportsPageDropdowns();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          statTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const statOpt = event.target.closest("[data-reports-stat-option]");
      if (statOpt) {
        event.preventDefault();
        const kind = statOpt.dataset.statKind;
        const raw = Number(statOpt.dataset.days);
        const next = WITHIN_DAY_OPTIONS.includes(raw) ? raw : 7;
        if (kind === STAT_KIND_NEW) reportsState.newWithinDays = next;
        else if (kind === STAT_KIND_PROCESSED) reportsState.processedWithinDays = next;
        closeReportsPageDropdowns();
        renderReportsView({ restoreReportsStatDropdownFocus: kind });
        return;
      }

      const statusFilterTrigger = event.target.closest("[data-reports-status-filter-trigger]");
      if (statusFilterTrigger) {
        event.preventDefault();
        const dd = statusFilterTrigger.closest("[data-reports-status-filter-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeReportsPageDropdowns();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          statusFilterTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const statusFilterOpt = event.target.closest("[data-reports-status-filter-option]");
      if (statusFilterOpt) {
        event.preventDefault();
        const next = statusFilterOpt.dataset.statusFilter;
        reportsState.statusFilter = STATUS_OPTIONS.some((opt) => opt.value === next) ? next : "all";
        reportsState.page = 1;
        closeReportsPageDropdowns();
        void loadAndRenderReports();
        return;
      }

      const sortTrigger = event.target.closest("[data-reports-sort-trigger]");
      if (sortTrigger) {
        event.preventDefault();
        const dd = sortTrigger.closest("[data-reports-sort-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeReportsPageDropdowns();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          sortTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const sortOpt = event.target.closest("[data-reports-sort-option]");
      if (sortOpt) {
        event.preventDefault();
        const next = sortOpt.dataset.sortBy;
        reportsState.sortBy = SORT_FIELDS.some((f) => f.value === next) ? next : "createdAt";
        reportsState.page = 1;
        closeReportsPageDropdowns();
        void loadAndRenderReports();
        return;
      }

      const sortDirToggle = event.target.closest("[data-reports-sort-dir-toggle]");
      if (sortDirToggle) {
        event.preventDefault();
        reportsState.sortDir = reportsState.sortDir === "asc" ? "desc" : "asc";
        reportsState.page = 1;
        void loadAndRenderReports();
        return;
      }

      const prev = event.target.closest("[data-reports-page-prev]");
      if (prev && !prev.disabled) {
        reportsState.page = Math.max(1, reportsState.page - 1);
        void loadAndRenderReports();
        return;
      }

      const next = event.target.closest("[data-reports-page-next]");
      if (next && !next.disabled) {
        reportsState.page = Math.min(reportsState.totalPages, reportsState.page + 1);
        void loadAndRenderReports();
        return;
      }

      const row = event.target.closest("tr[data-row-action='open-report'][data-report-id]");
      if (!row) return;
      void App.controllers.reportsDrawer.openReportDrawer(row.dataset.reportId);
    });

    tableWrap.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("tr[data-row-action='open-report'][data-report-id]");
      if (!row) return;
      event.preventDefault();
      void App.controllers.reportsDrawer.openReportDrawer(row.dataset.reportId);
    });

    runtime.isReportsDelegationInitialized = true;
  }

  async function renderReportsTable() {
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;
    initReportsDelegation();
    App.controllers.reportsDrawer.initReportDrawer();
    reportsState.loadError = null;
    reportsState.page = 1;
    await loadAndRenderReports();
  }


  App.controllers.reports = {
    renderReportsTable,
    loadAndRenderReports,
    renderReportsView,
  };
})(window);
