(function initAppNamespace(global) {
  const App = (global.App = global.App || {});
  App.api = App.api || {};
  App.modules = App.modules || {};
  App.controllers = App.controllers || {};
  App.views = App.views || {};
  App.shared = App.shared || {};
  App.utils = App.utils || {};
  App.core = App.core || {};
})(window);
