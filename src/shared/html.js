(function registerSharedHtml(global) {
  const { App } = global;

  function escapeAttribute(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeHtml(value) {
    return escapeAttribute(value);
  }

  App.shared.html = { escapeAttribute, escapeHtml };
})(window);
