(function registerReportsModuleAliases(global) {
  const { App } = global;
  App.modules.reportsTable = {
    renderReportsTable: () => App.controllers.reports.renderReportsTable(),
    closeReportDrawer: () => App.controllers.reportsDrawer.closeReportDrawer(),
  };
})(window);
