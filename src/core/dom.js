(function setupDomCache(global) {
  const { App } = global;

  App.core.dom = {
    body: document.body,
    appShell: document.querySelector(".app-shell"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    layoutWorkspace: document.getElementById("layout-main-workspace"),
    detailDock: document.getElementById("detail-dock"),
    detailDockInner: document.getElementById("detail-dock-inner"),
    tableWrap: document.getElementById("table-wrap"),
    sectionTitle: document.querySelector(".section-title"),
    menuButtons: Array.from(document.querySelectorAll(".sidebar__nav .menu-item[data-section]")),
    themeToggle: document.getElementById("theme-toggle"),
    sidebarToggle: document.getElementById("sidebar-toggle"),
  };

  App.core.syncDetailDock = function syncDetailDock() {
    const userOpen = document.getElementById("user-profile-drawer")?.classList?.contains("is-open");
    const reportOpen = document.getElementById("report-detail-drawer")?.classList?.contains("is-open");
    const open = Boolean(userOpen || reportOpen);
    App.core.dom.layoutWorkspace?.classList.toggle("has-detail-open", open);
    App.core.dom.detailDock?.setAttribute("aria-hidden", open ? "false" : "true");
  };
})(window);
