(function registerUsersController(global) {
  const { App } = global;
  const {
    usersState,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_ONLINE,
    STAT_KIND_REGISTERED,
    SORT_FIELDS,
    REGISTRATION_FILTER_STEPS,
    registrationDaysFromSliderIndex,
  } = App.modules.users.state;
  const { applyUsersTableFilters, getRegistrationFilterLabel } = App.modules.users.filters;
  const { getUsersTableMarkup, renderUsersFetchErrorMarkup } = App.views.users.table;

  function updateRegistrationSliderUi(tableWrap, days, sliderIndex) {
    const slider = tableWrap.querySelector("[data-users-filter-registered-slider]");
    const track = tableWrap.querySelector("[data-users-reg-slider-track]");
    const label = getRegistrationFilterLabel(days);
    if (track) track.style.setProperty("--slider-index", String(sliderIndex));
    if (slider) {
      slider.setAttribute("aria-valuenow", String(sliderIndex));
      slider.setAttribute("aria-valuetext", label);
    }
    tableWrap.querySelectorAll(".users-reg-slider__dot").forEach((dot, i) => {
      dot.classList.toggle("is-active", i === sliderIndex);
    });
    tableWrap.querySelectorAll(".users-reg-slider__tick").forEach((tick, i) => {
      tick.classList.toggle("is-active", i === sliderIndex);
    });
  }

  function closeAllUsersToolbarDropdowns() {
    document
      .querySelectorAll("[data-users-stat-dropdown].is-open, [data-users-sort-dropdown].is-open")
      .forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector("[data-users-stat-trigger], [data-users-sort-trigger]")?.setAttribute(
          "aria-expanded",
          "false"
        );
        el.querySelector(".stat-card__dropdown-panel")?.setAttribute("hidden", "");
      });
  }

  let isUsersDelegationInitialized = false;
  let usersLoadPromise = null;

  const USERS_RETRY_DELAYS_MS = [1000, 2000, 4000];

  function isRateLimitError(error) {
    const msg = error instanceof Error ? error.message : String(error);
    return /\b429\b|rate\s*limit|too many requests/i.test(msg);
  }

  function delay(ms) {
    return new Promise((resolve) => {
      global.setTimeout(resolve, ms);
    });
  }

  async function fetchUsersWithRetry(forceRefresh) {
    let lastError = null;
    const maxAttempts = USERS_RETRY_DELAYS_MS.length + 1;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      try {
        return await App.api.users.apiGetUsers({ force: forceRefresh || attempt > 0 });
      } catch (error) {
        lastError = error;
        const canRetry = isRateLimitError(error) && attempt < USERS_RETRY_DELAYS_MS.length;
        if (!canRetry) throw error;
        await delay(USERS_RETRY_DELAYS_MS[attempt]);
      }
    }
    throw lastError;
  }

  function showUsersLoadError(tableWrap, message) {
    tableWrap.innerHTML = renderUsersFetchErrorMarkup(message);
  }

  function initUsersRowOpenDelegation() {
    if (isUsersDelegationInitialized) return;
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;

    if (!global.__usersStatDropdownDocListeners) {
      global.__usersStatDropdownDocListeners = true;
      document.addEventListener(
        "pointerdown",
        (e) => {
          if (e.target.closest("[data-users-stat-dropdown], [data-users-sort-dropdown]")) return;
          closeAllUsersToolbarDropdowns();
        },
        true
      );
      document.addEventListener("keydown", (e) => {
        if (e.key !== "Escape") return;
        closeAllUsersToolbarDropdowns();
      });
    }

    tableWrap.addEventListener("input", (event) => {
      const input = event.target.closest("[data-users-search]");
      if (input) {
        usersState.query = input.value;
        renderUsersView({ restoreSearchFocus: true });
        return;
      }

      const slider = event.target.closest("[data-users-filter-registered-slider]");
      if (slider) {
        const index = Number(slider.value);
        const days = registrationDaysFromSliderIndex(index);
        updateRegistrationSliderUi(tableWrap, days, index);
      }
    });

    tableWrap.addEventListener("change", (event) => {
      const slider = event.target.closest("[data-users-filter-registered-slider]");
      if (slider) {
        usersState.tableRegisteredWithinDays = registrationDaysFromSliderIndex(Number(slider.value));
        renderUsersView();
      }
    });

    tableWrap.addEventListener("click", (event) => {
      const refreshBtn = event.target.closest("[data-users-refresh]");
      if (refreshBtn) {
        event.preventDefault();
        if (refreshBtn.disabled || usersState.isRefreshing) return;
        void refreshUsersTable();
        return;
      }

      const sortDirToggle = event.target.closest("[data-users-sort-dir-toggle]");
      if (sortDirToggle) {
        event.preventDefault();
        usersState.sortDir = usersState.sortDir === "asc" ? "desc" : "asc";
        renderUsersView();
        return;
      }

      const sortTrigger = event.target.closest("[data-users-sort-trigger]");
      if (sortTrigger) {
        event.preventDefault();
        const dd = sortTrigger.closest("[data-users-sort-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeAllUsersToolbarDropdowns();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          sortTrigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const sortOpt = event.target.closest("[data-users-sort-option]");
      if (sortOpt) {
        event.preventDefault();
        const next = sortOpt.dataset.sortBy;
        usersState.sortBy = SORT_FIELDS.some((f) => f.value === next) ? next : "lastActiveAt";
        closeAllUsersToolbarDropdowns();
        renderUsersView({ restoreSortDropdownFocus: true });
        return;
      }

      const trigger = event.target.closest("[data-users-stat-trigger]");
      if (trigger) {
        event.preventDefault();
        const dd = trigger.closest("[data-users-stat-dropdown]");
        const panel = dd?.querySelector(".stat-card__dropdown-panel");
        if (!dd || !panel) return;
        const willOpen = !dd.classList.contains("is-open");
        closeAllUsersToolbarDropdowns();
        if (willOpen) {
          dd.classList.add("is-open");
          panel.removeAttribute("hidden");
          trigger.setAttribute("aria-expanded", "true");
        }
        return;
      }

      const opt = event.target.closest("[data-users-stat-option]");
      if (opt) {
        event.preventDefault();
        const kind = opt.dataset.statKind;
        const raw = Number(opt.dataset.days);
        const next = WITHIN_DAY_OPTIONS.includes(raw) ? raw : WITHIN_DAY_OPTIONS[2];
        if (kind === STAT_KIND_ONLINE) usersState.onlineWithinDays = next;
        else if (kind === STAT_KIND_REGISTERED) usersState.registeredWithinDays = next;
        closeAllUsersToolbarDropdowns();
        renderUsersView({ restoreStatDropdownFocus: kind });
        return;
      }

      const row = event.target.closest("tr[data-row-action='open-user'][data-user-id]");
      if (!row) return;
      const userId = row.dataset.userId;
      if (!userId) return;
      void App.modules.usersProfileModal.openUserProfile(userId);
    });

    tableWrap.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      const row = event.target.closest("tr[data-row-action='open-user'][data-user-id]");
      if (!row) return;
      event.preventDefault();
      const userId = row.dataset.userId;
      if (!userId) return;
      void App.modules.usersProfileModal.openUserProfile(userId);
    });

    isUsersDelegationInitialized = true;
  }

  async function loadUsersData(forceRefresh) {
    usersState.isRefreshing = true;
    try {
      const rows = await fetchUsersWithRetry(forceRefresh);
      usersState.users = rows;
      usersState.loadError = null;
      usersState.usersLoaded = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      usersState.loadError = message;
      usersState.usersLoaded = true;
      if (!usersState.users.length) usersState.users = [];
      throw error;
    } finally {
      usersState.isRefreshing = false;
    }
  }

  async function renderUsersTable(options = {}) {
    const forceRefresh = options.forceRefresh === true;
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;
    initUsersRowOpenDelegation();

    if (!forceRefresh && usersState.usersLoaded) {
      if (usersState.loadError && !usersState.users.length) {
        showUsersLoadError(tableWrap, usersState.loadError);
      } else {
        renderUsersView();
      }
      return;
    }

    if (usersLoadPromise && !forceRefresh) {
      if (!usersState.users.length) tableWrap.textContent = "Завантаження даних...";
      try {
        await usersLoadPromise;
        if (usersState.loadError && !usersState.users.length) {
          showUsersLoadError(tableWrap, usersState.loadError);
        } else {
          renderUsersView();
        }
      } catch {
        /* помилку вже записано в usersState */
      }
      return;
    }

    const keepTableVisible = forceRefresh && usersState.users.length > 0;
    if (!keepTableVisible) {
      tableWrap.textContent = "Завантаження даних...";
    } else {
      renderUsersView();
    }

    const loadTask = loadUsersData(forceRefresh)
      .then(() => {
        renderUsersView();
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!usersState.users.length) {
          showUsersLoadError(tableWrap, message);
          return;
        }
        global.alert(`Не вдалося оновити список: ${message}`);
        renderUsersView();
      });

    usersLoadPromise = loadTask.finally(() => {
      usersLoadPromise = null;
    });
    await usersLoadPromise;
  }

  async function refreshUsersTable() {
    return renderUsersTable({ forceRefresh: true });
  }

  function renderUsersView(options = {}) {
    const tableWrap = App.core.dom.tableWrap;
    if (!tableWrap) return;
    const filteredUsers = applyUsersTableFilters(usersState.users);
    tableWrap.innerHTML = getUsersTableMarkup(filteredUsers, usersState.users);
    if (options.restoreSearchFocus) {
      const input = tableWrap.querySelector("[data-users-search]");
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (options.restoreStatDropdownFocus) {
      tableWrap
        .querySelector(`[data-users-stat-trigger][data-stat-kind="${options.restoreStatDropdownFocus}"]`)
        ?.focus();
      return;
    }
    if (options.restoreSortDropdownFocus) {
      tableWrap.querySelector("[data-users-sort-trigger]")?.focus();
    }
  }

  App.controllers.users = {
    renderUsersTable,
    refreshUsersTable,
    renderUsersView,
    closeAllUsersToolbarDropdowns,
  };
})(window);
