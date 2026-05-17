(function registerReportsState(global) {
  const { App } = global;

  const STATUS_OPTIONS = [
    { value: "all", label: "Усі статуси" },
    { value: "new", label: "Нова" },
    { value: "in_progress", label: "В обробці" },
    { value: "processed", label: "Оброблена" },
  ];

  const STATUS_LABELS = {
    new: "Нова",
    in_progress: "В обробці",
    processed: "Оброблена",
  };

  const SORT_FIELDS = [
    { value: "createdAt", label: "Дата створення" },
    { value: "updatedAt", label: "Дата оновлення" },
    { value: "status", label: "Статус" },
    { value: "reporter.name", label: "Скаржник" },
  ];

  const WITHIN_DAY_OPTIONS = [1, 3, 7, 14, 30];
  const STAT_KIND_NEW = "new";
  const STAT_KIND_PROCESSED = "processed";
  const DRAWER_STATUS_VALUES = ["in_progress", "processed"];

  const reportsState = {
    query: "",
    statusFilter: "all",
    sortBy: "createdAt",
    sortDir: "desc",
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    items: [],
    allReports: [],
    statsTotal: 0,
    newWithinDays: 7,
    processedWithinDays: 7,
    selectedReportId: null,
    loadError: null,
  };

  const runtime = {
    searchDebounceTimer: null,
    isReportsDelegationInitialized: false,
    isReportDrawerInitialized: false,
    reportDrawerLoadSeq: 0,
  };

  function normalizeDrawerStatus(status) {
    return DRAWER_STATUS_VALUES.includes(status) ? status : "in_progress";
  }

  App.modules.reports = App.modules.reports || {};
  App.modules.reports.state = {
    STATUS_OPTIONS,
    STATUS_LABELS,
    SORT_FIELDS,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_NEW,
    STAT_KIND_PROCESSED,
    DRAWER_STATUS_VALUES,
    reportsState,
    runtime,
    normalizeDrawerStatus,
  };
})(window);
