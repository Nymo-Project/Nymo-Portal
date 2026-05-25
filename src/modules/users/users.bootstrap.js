(function registerUsersModuleAliases(global) {
  const { App } = global;
  App.modules.usersTable = {
    renderUsersTable: (options) => App.controllers.users.renderUsersTable(options),
    refreshUsersTable: () => App.controllers.users.refreshUsersTable(),
  };
  App.modules.usersProfileModal = App.controllers.usersProfile;
})(window);
