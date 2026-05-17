(function registerUsersState(global) {
  const { App } = global;

  const WITHIN_DAY_OPTIONS = [1, 3, 7, 14, 30];
  const STAT_KIND_ONLINE = "online";
  const STAT_KIND_REGISTERED = "registered";
  const REGISTRATION_FILTER_STEPS = [0, 1, 3, 7, 14, 30, 90];
  const SORT_FIELDS = [
    { value: "lastActiveAt", label: "Остання активність" },
    { value: "createdAt", label: "Дата реєстрації" },
    { value: "nickname", label: "Нікнейм" },
  ];

  const usersState = {
    query: "",
    users: [],
    onlineWithinDays: 7,
    registeredWithinDays: 7,
    tableRegisteredWithinDays: 0,
    sortBy: "lastActiveAt",
    sortDir: "desc",
  };

  function registrationDaysFromSliderIndex(index) {
    return REGISTRATION_FILTER_STEPS[Number(index)] ?? 0;
  }

  function registrationSliderIndexFromDays(days) {
    const i = REGISTRATION_FILTER_STEPS.indexOf(days);
    return i >= 0 ? i : 0;
  }

  App.modules.users = App.modules.users || {};
  App.modules.users.state = {
    usersState,
    WITHIN_DAY_OPTIONS,
    STAT_KIND_ONLINE,
    STAT_KIND_REGISTERED,
    REGISTRATION_FILTER_STEPS,
    SORT_FIELDS,
    registrationDaysFromSliderIndex,
    registrationSliderIndexFromDays,
  };
})(window);
