(function registerUsersFilters(global) {
  const { App } = global;
  const {
    usersState,
    SORT_FIELDS,
    registrationDaysFromSliderIndex,
    registrationSliderIndexFromDays,
  } = App.modules.users.state;
  const { formatDaysOptionLabel } = App.shared.days;

  function normalizeSearch(value) {
    return String(value || "").trim().toLocaleLowerCase("uk-UA");
  }

  function parseUserDate(value) {
    if (value == null || value === "") return null;
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }

  function matchesSearch(user, query) {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return true;
    const nick = normalizeSearch(user.nickname || "");
    const mobile = normalizeSearch(user.mobile || "");
    return nick.includes(normalizedQuery) || mobile.includes(normalizedQuery);
  }

  function matchesRegisteredWithinDays(user, days) {
    if (!days || days < 1) return true;
    const t = parseUserDate(user.createdAt);
    if (t === null) return false;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return t >= cutoff;
  }

  function compareSortValues(a, b, sortBy, sortDir) {
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "nickname") {
      const na = normalizeSearch(a.nickname || "");
      const nb = normalizeSearch(b.nickname || "");
      return na.localeCompare(nb, "uk") * dir;
    }
    const ta = parseUserDate(a[sortBy]);
    const tb = parseUserDate(b[sortBy]);
    if (ta === null && tb === null) return 0;
    if (ta === null) return 1;
    if (tb === null) return -1;
    return (ta - tb) * dir;
  }

  function sortUsers(users, sortBy, sortDir) {
    const field = SORT_FIELDS.some((f) => f.value === sortBy) ? sortBy : "lastActiveAt";
    const dir = sortDir === "asc" ? "asc" : "desc";
    return [...users].sort((a, b) => compareSortValues(a, b, field, dir));
  }

  function getSortDirLabel(sortDir) {
    return sortDir === "asc" ? "Зростання" : "Спадання";
  }

  function applyUsersTableFilters(users) {
    let list = users.filter((user) => matchesSearch(user, usersState.query));
    list = list.filter((user) => matchesRegisteredWithinDays(user, usersState.tableRegisteredWithinDays));
    return sortUsers(list, usersState.sortBy, usersState.sortDir);
  }

  function countUsersWithinDays(users, days, dateField) {
    if (!Array.isArray(users) || days < 1) return 0;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    let n = 0;
    for (const u of users) {
      const t = parseUserDate(u[dateField]);
      if (t !== null && t >= cutoff) n += 1;
    }
    return n;
  }

  function getRegistrationFilterLabel(days) {
    if (!days || days < 1) return "Усі";
    return formatDaysOptionLabel(days);
  }

  function getRegistrationSliderTickLabel(days) {
    if (!days || days < 1) return "Усі";
    return `${days}д`;
  }

  App.modules.users.filters = {
    applyUsersTableFilters,
    countUsersWithinDays,
    getSortDirLabel,
    getRegistrationFilterLabel,
    getRegistrationSliderTickLabel,
    registrationDaysFromSliderIndex,
    registrationSliderIndexFromDays,
    parseUserDate,
  };
})(window);
