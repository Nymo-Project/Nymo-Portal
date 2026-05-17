(function registerUsersTableView(global) {
  const { App } = global;
  const { formatShortDateTime } = App.utils.formatters;
  const { escapeAttribute, escapeHtml } = App.shared.html;
  const { DROPDOWN_CHEVRON, SORT_DIR_ICON_UP, SORT_DIR_ICON_DOWN } = App.shared.icons;
  const { formatDaysOptionLabel } = App.shared.days;
  const { getSoloStatLabelRowMarkup } = App.shared.dropdownView;
  const { STAT_ICON_TOTAL_USERS, STAT_ICON_ONLINE, STAT_ICON_REGISTERED } = App.views.users.icons;
  const {
    usersState,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_ONLINE,
    STAT_KIND_REGISTERED,
    REGISTRATION_FILTER_STEPS,
    SORT_FIELDS,
    registrationSliderIndexFromDays,
  } = App.modules.users.state;
  const {
    countUsersWithinDays,
    getSortDirLabel,
    getRegistrationFilterLabel,
    getRegistrationSliderTickLabel,
  } = App.modules.users.filters;

  function getSafeAvatarUrl(url) {
    const s = String(url || "").trim();
    if (!s) return "";
    return /^https?:\/\//i.test(s) ? s : "";
  }

  function getUserTableAvatarMarkup(user) {
    const displayName = user.nickname || user.name || "Користувач";
    const initialSource = (user.nickname || user.name || "?").trim();
    const initial = initialSource ? initialSource.slice(0, 1).toUpperCase() : "?";
    const safeUrl = getSafeAvatarUrl(user.avatarUrl);
    if (safeUrl) {
      return `<img class="users-table-avatar users-table-avatar--image" src="${escapeAttribute(
        safeUrl
      )}" alt="${escapeAttribute(displayName)}" width="36" height="36" loading="lazy" decoding="async" />`;
    }
    return `<div class="users-table-avatar users-table-avatar--fallback" aria-hidden="true">${escapeHtml(
      initial
    )}</div>`;
  }

  function getUserPrimaryLabel(user) {
    const nick = user.nickname?.trim();
    if (nick) return nick;
    const name = user.name?.trim();
    if (name) return name;
    return "—";
  }

  function getUserTableUserCellMarkup(user) {
    const primary = getUserPrimaryLabel(user);
    const nick = user.nickname?.trim();
    const name = user.name?.trim();
    const showSubline = Boolean(name && (!nick || name !== nick));
    const subline = showSubline ? `<span class="users-table__user-sub">${escapeHtml(name)}</span>` : "";
    return `<div class="users-table__user-cell"><span class="users-table__user-primary">${escapeHtml(
      primary
    )}</span>${subline}</div>`;
  }

  function getStatWithinDaysDropdownMarkup(kind, selected) {
    const triggerId =
      kind === STAT_KIND_ONLINE ? "users-online-within-trigger" : "users-registered-within-trigger";
    const ariaLabel =
      kind === STAT_KIND_ONLINE
        ? "Обрати кількість днів для статистики «в мережі»"
        : "Обрати кількість днів для статистики реєстрацій";
    const optionsHtml = WITHIN_DAY_OPTIONS.map((d) => {
      const label = escapeHtml(formatDaysOptionLabel(d));
      const isSel = d === selected;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-users-stat-option data-stat-kind="${kind}" data-days="${d}" aria-selected="${isSel ? "true" : "false"}">${label}</button>`;
    }).join("");
    const currentLabel = escapeHtml(formatDaysOptionLabel(selected));
    return `
      <div class="stat-card__dropdown" data-users-stat-dropdown data-stat-kind="${kind}">
        <button
          type="button"
          class="stat-card__dropdown-trigger"
          data-users-stat-trigger
          data-stat-kind="${kind}"
          id="${triggerId}"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-label="${escapeAttribute(ariaLabel)}"
        >
          <span class="stat-card__dropdown-value">${currentLabel}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="${triggerId}" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function getUsersStatsMarkup(totalUsers, allUsers, onlineWithinDays, registeredWithinDays) {
    const onlineCount = countUsersWithinDays(allUsers, onlineWithinDays, "lastActiveAt");
    const registeredCount = countUsersWithinDays(allUsers, registeredWithinDays, "createdAt");
    return `
      <div class="stats-grid-wrap">
        <div class="stats-grid stats-grid--three" aria-label="Статистика користувачів">
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_TOTAL_USERS}</div>
            ${getSoloStatLabelRowMarkup("Всього користувачів")}
            <p class="stat-card__value">${totalUsers}</p>
          </article>
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_ONLINE}</div>
            <div class="stat-card__label-row">
              <span class="stat-card__label">Були в мережі за останні</span>
              ${getStatWithinDaysDropdownMarkup(STAT_KIND_ONLINE, onlineWithinDays)}
            </div>
            <p class="stat-card__value">${onlineCount}</p>
          </article>
          <article class="stat-card">
            <div class="stat-card__icon-wrap">${STAT_ICON_REGISTERED}</div>
            <div class="stat-card__label-row">
              <span class="stat-card__label">Зареєстровані за останні</span>
              ${getStatWithinDaysDropdownMarkup(STAT_KIND_REGISTERED, registeredWithinDays)}
            </div>
            <p class="stat-card__value">${registeredCount}</p>
          </article>
        </div>
      </div>
    `;
  }

  function getSortByDropdownMarkup(selected) {
    const field = SORT_FIELDS.find((f) => f.value === selected) || SORT_FIELDS[0];
    const optionsHtml = SORT_FIELDS.map((f) => {
      const isSel = f.value === selected;
      return `<button type="button" class="stat-card__dropdown-option${isSel ? " is-selected" : ""}" role="option" data-users-sort-option data-sort-by="${f.value}" aria-selected="${isSel ? "true" : "false"}">${escapeHtml(f.label)}</button>`;
    }).join("");
    return `
      <div class="stat-card__dropdown users-sort-dropdown" data-users-sort-dropdown>
        <button
          type="button"
          class="users-sort-dropdown__trigger"
          data-users-sort-trigger
          id="users-sort-by-trigger"
          aria-haspopup="listbox"
          aria-expanded="false"
          aria-labelledby="users-sort-by-label"
        >
          <span class="users-sort-dropdown__value">${escapeHtml(field.label)}</span>
          <span class="stat-card__dropdown-chevron" aria-hidden="true">${DROPDOWN_CHEVRON}</span>
        </button>
        <div class="stat-card__dropdown-panel" role="listbox" aria-labelledby="users-sort-by-trigger" hidden>
          ${optionsHtml}
        </div>
      </div>
    `;
  }

  function getSortDirToggleMarkup(sortDir) {
    const isAsc = sortDir === "asc";
    const label = `${getSortDirLabel(sortDir)}. Натисніть, щоб змінити напрямок`;
    return `<button
      type="button"
      class="users-sort-dir-btn${isAsc ? " is-asc" : " is-desc"}"
      data-users-sort-dir-toggle
      aria-label="${escapeAttribute(label)}"
      title="${escapeAttribute(getSortDirLabel(sortDir))}"
    >${isAsc ? SORT_DIR_ICON_UP : SORT_DIR_ICON_DOWN}</button>`;
  }

  function getRegistrationSliderDotsMarkup(selectedDays) {
    const selectedIndex = registrationSliderIndexFromDays(selectedDays);
    return REGISTRATION_FILTER_STEPS.map((days, i) => {
      const isActive = i === selectedIndex;
      return `<span class="users-reg-slider__dot${isActive ? " is-active" : ""}" style="--tick-i: ${i}"></span>`;
    }).join("");
  }

  function getRegistrationSliderTicksMarkup(selectedDays) {
    const selectedIndex = registrationSliderIndexFromDays(selectedDays);
    return REGISTRATION_FILTER_STEPS.map((days, i) => {
      const isActive = i === selectedIndex;
      return `<span class="users-reg-slider__tick${isActive ? " is-active" : ""}" style="--tick-i: ${i}" data-reg-tick-index="${i}">${escapeHtml(
        getRegistrationSliderTickLabel(days)
      )}</span>`;
    }).join("");
  }

  function getUsersToolbarMarkup() {
    const { query, tableRegisteredWithinDays, sortBy, sortDir } = usersState;
    const regDays =
      REGISTRATION_FILTER_STEPS.includes(tableRegisteredWithinDays) ? tableRegisteredWithinDays : 0;
    const sliderIndex = registrationSliderIndexFromDays(regDays);
    const sliderMax = REGISTRATION_FILTER_STEPS.length - 1;
    const regLabel = getRegistrationFilterLabel(regDays);

    return `
      <div class="table-toolbar users-table-toolbar">
        <div class="users-table-toolbar__row users-table-toolbar__row--main">
          <div class="filter-field users-toolbar__search">
            <span class="filter-field__label" id="users-search-label">Рядок пошуку</span>
            <input
              class="search-field__input"
              type="search"
              id="users-search-input"
              placeholder="Пошук"
              value="${escapeAttribute(query)}"
              data-users-search
              autocomplete="off"
              aria-labelledby="users-search-label"
            />
          </div>
          <div class="filter-field users-toolbar__sort-field">
            <span class="filter-field__label" id="users-sort-by-label">Сортування</span>
            <div class="users-toolbar__sort-row">
              ${getSortByDropdownMarkup(sortBy)}
              ${getSortDirToggleMarkup(sortDir)}
            </div>
          </div>
        </div>
        <div class="users-table-toolbar__row users-table-toolbar__row--registration" role="group" aria-labelledby="users-reg-filter-label">
          <div class="users-reg-slider-block">
            <span class="users-reg-filter__label" id="users-reg-filter-label">За реєстрацією</span>
            <div
              class="users-reg-slider__track-wrap"
            data-users-reg-slider-track
            style="--slider-index: ${sliderIndex}; --tick-max: ${sliderMax}"
          >
            <div class="users-reg-slider__track" aria-hidden="true">
              <div class="users-reg-slider__fill"></div>
              <div class="users-reg-slider__dots" style="--tick-max: ${sliderMax}">${getRegistrationSliderDotsMarkup(
                regDays
              )}</div>
            </div>
            <input
              type="range"
              class="users-reg-slider__input"
              min="0"
              max="${sliderMax}"
              step="1"
              value="${sliderIndex}"
              data-users-filter-registered-slider
              aria-label="Фільтр за реєстрацією за останні дні"
              aria-valuemin="0"
              aria-valuemax="${sliderMax}"
              aria-valuenow="${sliderIndex}"
              aria-valuetext="${escapeAttribute(regLabel)}"
            />
          </div>
            <div class="users-reg-slider__ticks" style="--tick-max: ${sliderMax}" aria-hidden="true"><div class="users-reg-slider__ticks-track">${getRegistrationSliderTicksMarkup(
              regDays
            )}</div></div>
          </div>
        </div>
      </div>
    `;
  }

  function getUsersTableMarkup(users, allUsers) {
    const rowsHtml = users
      .map(
        (user, index) => `
          <tr data-row-action="open-user" data-user-id="${user.id}" tabindex="0" role="button">
            <th scope="row" class="users-table__th-row-num">${index + 1}</th>
            <td class="users-table__td-avatar">${getUserTableAvatarMarkup(user)}</td>
            <td class="users-table__td-user">${getUserTableUserCellMarkup(user)}</td>
            <td class="users-table__cell-muted">${user.mobile ? escapeHtml(user.mobile) : "—"}</td>
            <td class="users-table__cell-date">${formatShortDateTime(user.lastActiveAt)}</td>
          </tr>
        `
      )
      .join("");

    const emptyRow =
      users.length === 0
        ? '<tr class="table-row--empty"><td colspan="5">Користувачів за цими фільтрами не знайдено</td></tr>'
        : "";

    return `
      <div class="section-stack">
        ${getUsersStatsMarkup(
          allUsers.length,
          allUsers,
          usersState.onlineWithinDays,
          usersState.registeredWithinDays
        )}
        <div class="table-wrap table-wrap--users">
          ${getUsersToolbarMarkup()}
          <div class="table-scroll">
            <table class="users-table">
              <thead>
                <tr>
                  <th class="users-table__th-num" scope="col">№</th>
                  <th class="users-table__th-avatar" scope="col" aria-label="Аватар"></th>
                  <th scope="col">Користувач</th>
                  <th scope="col">Телефон</th>
                  <th scope="col">Був у мережі</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}${emptyRow}</tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }


  function renderUsersFetchErrorMarkup(message) {
    return `<div class="section-stack"><p class="users-fetch-error" role="alert">Не вдалося завантажити користувачів: ${escapeAttribute(
      message
    )}</p><p class="users-fetch-hint">Якщо це CORS: з кореня проєкту виконай npm install і npm run dev, відкрий панель з http://127.0.0.1:8787/ (не Live Server). Або вимкни USE_API_PROXY у src/utils/constants.js, якщо бекенд дозволив твій origin.</p></div>`;
  }

  App.views.users.table = {
    getUsersTableMarkup,
    getUsersToolbarMarkup,
    renderUsersFetchErrorMarkup,
  };
})(window);
