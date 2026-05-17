(function registerUsersModuleAliases(global) {
  const { App } = global;
  App.modules.usersTable = {
    renderUsersTable: () => App.controllers.users.renderUsersTable(),
  };
  App.modules.usersProfileModal = App.controllers.usersProfile;
})(window);
