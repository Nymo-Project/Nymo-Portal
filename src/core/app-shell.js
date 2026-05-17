(function registerAppShell(global) {
  const { App } = global;
  const { THEME_KEY } = App.utils.constants;
  const { dom } = App.core;

  const sectionConfig = {
    users: { title: "Користувачі" },
    reports: { title: "Скарги" },
  };

  function syncThemeToggleUi() {
    const btn = dom.themeToggle;
    if (!btn) return;
    const theme = dom.body.getAttribute("data-theme");
    btn.setAttribute(
      "aria-label",
      theme === "dark" ? "Увімкнути світлу тему" : "Увімкнути темну тему"
    );
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    dom.body.setAttribute("data-theme", savedTheme === "light" ? "light" : "dark");
    syncThemeToggleUi();
  }

  function toggleTheme() {
    const current = dom.body.getAttribute("data-theme");
    const nextTheme = current === "dark" ? "light" : "dark";
    dom.body.setAttribute("data-theme", nextTheme);
    localStorage.setItem(THEME_KEY, nextTheme);
    syncThemeToggleUi();
  }

  function closeSidebar() {
    if (!dom.appShell || dom.appShell.classList.contains("is-sidebar-collapsed")) return;
    dom.appShell.classList.add("is-sidebar-collapsed");
    syncSidebarBackdropAria();
  }

  function closeDetailDrawers() {
    App.modules.usersProfileModal?.closeUserProfileModal?.({ skipDockSync: true });
    App.modules.reportsTable?.closeReportDrawer?.();
    App.core.syncDetailDock();
  }

  function toggleSidebar() {
    if (!dom.appShell) return;
    const willOpen = dom.appShell.classList.contains("is-sidebar-collapsed");
    if (willOpen) closeDetailDrawers();
    dom.appShell.classList.toggle("is-sidebar-collapsed");
    syncSidebarBackdropAria();
  }

  function isNarrowShell() {
    return global.matchMedia?.("(max-width: 991px)")?.matches ?? global.innerWidth <= 991;
  }

  function syncSidebarBackdropAria() {
    const backdrop = dom.sidebarBackdrop;
    if (!backdrop || !dom.appShell) return;
    const collapsed = dom.appShell.classList.contains("is-sidebar-collapsed");
    backdrop.setAttribute("aria-hidden", collapsed ? "true" : "false");
  }

  function syncShellHeaderHeight() {
    const header = document.querySelector(".header");
    if (!header) return;
    document.documentElement.style.setProperty("--shell-header-h", `${header.offsetHeight}px`);
  }

  let lastNarrowShell = isNarrowShell();

  function applyShellLayoutForViewport(isInitial) {
    if (!dom.appShell) return;
    const narrow = isNarrowShell();
    if (isInitial) {
      dom.appShell.classList.add("is-sidebar-collapsed");
    } else if (narrow && !lastNarrowShell) {
      dom.appShell.classList.add("is-sidebar-collapsed");
    }
    lastNarrowShell = narrow;
    syncShellHeaderHeight();
    syncSidebarBackdropAria();
  }

  function setActiveMenu(sectionKey) {
    dom.menuButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.section === sectionKey);
    });
  }

  async function renderTable(sectionKey) {
    const config = sectionConfig[sectionKey];
    if (!config) return;
    App.modules.usersProfileModal.closeUserProfileModal();
    App.modules.reportsTable?.closeReportDrawer?.();
    dom.sectionTitle.textContent = config.title;

    if (sectionKey === "users") return App.modules.usersTable.renderUsersTable();
    if (sectionKey === "reports") return App.modules.reportsTable.renderReportsTable();
  }

  function initMenuSwitching() {
    dom.menuButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const sectionKey = button.dataset.section;
        if (!sectionKey) return;
        setActiveMenu(sectionKey);
        await renderTable(sectionKey);
        if (dom.appShell && !dom.appShell.classList.contains("is-sidebar-collapsed")) {
          dom.appShell.classList.add("is-sidebar-collapsed");
          syncSidebarBackdropAria();
        }
      });
    });
  }

  function initDetailModalBackdropDismiss() {
    const inner = dom.detailDockInner;
    if (!inner) return;
    inner.addEventListener("click", (event) => {
      if (!global.matchMedia?.("(max-width: 991px)")?.matches) return;
      if (!dom.layoutWorkspace?.classList.contains("has-detail-open")) return;
      if (event.target !== inner) return;
      const userDrawer = document.getElementById("user-profile-drawer");
      const reportDrawer = document.getElementById("report-detail-drawer");
      if (reportDrawer?.classList.contains("is-open")) App.modules.reportsTable?.closeReportDrawer?.();
      else if (userDrawer?.classList.contains("is-open")) App.modules.usersProfileModal.closeUserProfileModal();
    });
  }

  function initDetailPanelScrollState() {
    document.querySelectorAll(".detail-panel").forEach((panel) => {
      panel.addEventListener("scroll", () => {
        panel.classList.toggle("is-scrolled", panel.scrollTop > 0);
      });
    });
  }

  async function init() {
    applyShellLayoutForViewport(true);
    applySavedTheme();
    initMenuSwitching();
    initDetailPanelScrollState();
    initDetailModalBackdropDismiss();
    App.modules.usersProfileModal.initUserProfileModal();
    await renderTable("users");

    dom.themeToggle?.addEventListener("click", toggleTheme);
    dom.sidebarToggle?.addEventListener("click", toggleSidebar);
    dom.sidebarBackdrop?.addEventListener("click", () => {
      if (!dom.appShell?.classList.contains("is-sidebar-collapsed")) toggleSidebar();
    });
    global.addEventListener("resize", () => {
      applyShellLayoutForViewport(false);
    });
    if (global.ResizeObserver && document.querySelector(".header")) {
      const ro = new ResizeObserver(() => syncShellHeaderHeight());
      ro.observe(document.querySelector(".header"));
    }
  }

  App.core.closeSidebar = closeSidebar;

  init();
})(window);
