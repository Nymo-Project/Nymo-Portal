(function registerUsersProfileController(global) {
  const { App } = global;
  const { renderProfileContent } = App.views.users.profile;

  let openUserId = null;

  function getElements() {
    return {
      drawer: document.getElementById("user-profile-drawer"),
      body: document.getElementById("user-profile-body"),
      closeButton: document.getElementById("user-profile-close"),
    };
  }

  function setDrawerOpen(drawer, open, syncDock = true) {
    if (!drawer) return;
    drawer.classList.toggle("is-open", open);
    drawer.classList.remove("is-scrolled");
    if (open) drawer.scrollTop = 0;
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    if (syncDock) App.core.syncDetailDock();
  }

  async function openUserProfile(userId) {
    const { drawer, body } = getElements();
    if (!drawer || !body) return;
    App.core.closeSidebar?.();
    App.modules.reportsTable?.closeReportDrawer?.();
    openUserId = userId;
    setDrawerOpen(drawer, true);
    body.innerHTML = '<div class="profile-loading">Завантаження профілю...</div>';
    const profile = await App.api.users.apiGetUserProfile(userId);
    body.innerHTML = profile
      ? renderProfileContent(profile)
      : '<div class="profile-loading">Профіль не знайдено</div>';
  }

  function closeUserProfileModal(options = {}) {
    const { drawer, body } = getElements();
    if (!drawer || !body) return;
    openUserId = null;
    setDrawerOpen(drawer, false, !options.skipDockSync);
    body.innerHTML = "";
  }

  function initUserProfileModal() {
    const { closeButton, body } = getElements();
    closeButton?.addEventListener("click", closeUserProfileModal);

    body?.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-profile-action='delete-user']");
      if (!btn) return;
      const userId = btn.dataset.userId;
      if (!userId) return;
      const ok = global.confirm("Видалити цього користувача? Дію не можна скасувати.");
      if (!ok) return;
      void (async () => {
        try {
          await App.api.users.apiDeleteUser(userId);
          closeUserProfileModal();
          void App.modules.usersTable.refreshUsersTable();
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          global.alert(`Не вдалося видалити: ${msg}`);
        }
      })();
    });

    if (!global.__orionUserDrawerEscape) {
      global.__orionUserDrawerEscape = true;
      document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") return;
        const el = document.getElementById("user-profile-drawer");
        if (el?.classList.contains("is-open")) closeUserProfileModal();
      });
    }
  }

  App.controllers.usersProfile = {
    openUserProfile,
    closeUserProfileModal,
    initUserProfileModal,
  };
})(window);
