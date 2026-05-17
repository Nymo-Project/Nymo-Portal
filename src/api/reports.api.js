(function registerReportsApi(global) {
  const { App } = global;

  function getBaseUrl() {
    if (typeof global.location === "undefined") return "/api/local/reports";
    return `${global.location.origin}/api/local/reports`.replace(/\/+$/, "");
  }

  async function parseResponse(res) {
    const text = await res.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }
    if (!res.ok) {
      const msg =
        (data && typeof data.error === "string" && data.error) ||
        (data && typeof data.message === "string" && data.message) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  function buildQuery(params) {
    const qs = new URLSearchParams();
    if (params.status && params.status !== "all") qs.set("status", params.status);
    if (params.q) qs.set("q", params.q);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortDir) qs.set("sortDir", params.sortDir);
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const s = qs.toString();
    return s ? `?${s}` : "";
  }

  const fetchOptions = {
    credentials: "same-origin",
    cache: "no-store",
  };

  async function listReports(params = {}) {
    const base = getBaseUrl();
    const res = await fetch(`${base}${buildQuery(params)}`, {
      ...fetchOptions,
      headers: { accept: "application/json" },
    });
    return parseResponse(res);
  }

  async function getReport(id) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/${encodeURIComponent(id)}?t=${Date.now()}`, {
      ...fetchOptions,
      headers: { accept: "application/json" },
    });
    return parseResponse(res);
  }

  async function patchReport(id, partial) {
    const base = getBaseUrl();
    const res = await fetch(`${base}/${encodeURIComponent(id)}`, {
      ...fetchOptions,
      method: "PATCH",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify(partial),
    });
    return parseResponse(res);
  }

  App.api.reports = {
    listReports,
    getReport,
    patchReport,
  };
})(window);
