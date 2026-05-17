(function registerReportsFilters(global) {
  const { App } = global;
  const { reportsState, STATUS_LABELS } = App.modules.reports.state;
  function normalizeReport(report) {
    if (!report || typeof report !== "object") return null;
    const adminReply =
      typeof report.adminReply === "string"
        ? report.adminReply
        : typeof report.admin_reply === "string"
          ? report.admin_reply
          : "";
    return { ...report, adminReply };
  }

  function getAdminReplyText(report) {
    const normalized = normalizeReport(report);
    return normalized ? String(normalized.adminReply ?? "") : "";
  }

  function getStatusLabel(status) {
    return STATUS_LABELS[status] || status;
  }

  function parseReportDate(value) {
    if (value == null || value === "") return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }

  function countNewReportsWithinDays(reports, days) {
    if (!Array.isArray(reports) || days < 1) return 0;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let n = 0;
    for (const report of reports) {
      if (report.status !== "new") continue;
      const t = parseReportDate(report.createdAt);
      if (t !== null && t >= cutoff) n += 1;
    }
    return n;
  }

  function countProcessedReportsWithinDays(reports, days) {
    if (!Array.isArray(reports) || days < 1) return 0;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let n = 0;
    for (const report of reports) {
      if (report.status !== "processed") continue;
      const t = parseReportDate(report.processedAt);
      if (t !== null && t >= cutoff) n += 1;
    }
    return n;
  }


  function findReportInState(id) {
    return reportsState.items.find((r) => r.id === id) || null;
  }

  function upsertReportInState(report) {
    if (!report?.id) return;
    const idx = reportsState.items.findIndex((r) => r.id === report.id);
    if (idx >= 0) reportsState.items[idx] = report;
  }

  App.modules.reports.filters = {
    normalizeReport,
    getAdminReplyText,
    parseReportDate,
    countNewReportsWithinDays,
    countProcessedReportsWithinDays,
    getStatusLabel,
    findReportInState,
    upsertReportInState,
  };
})(window);
