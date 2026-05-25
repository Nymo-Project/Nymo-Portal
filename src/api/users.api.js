(function registerUsersApi(global) {
  const { App } = global;
  const { formatCoinBalance } = App.utils.formatters;

  const { WALLET_CURRENCY } = App.utils.constants;

  /** Кеш останнього успішного списку (для профілю без зайвого GET /users). */
  let lastUsersById = new Map();
  let lastUsersList = [];
  let usersFetchInFlight = null;

  function getBaseUrl() {
    const { CHAT_APP_API_BASE_URL, USE_API_PROXY } = App.utils.constants;
    if (
      USE_API_PROXY &&
      typeof global.location !== "undefined" &&
      (global.location.protocol === "http:" || global.location.protocol === "https:")
    ) {
      return `${global.location.origin}/api-proxy`.replace(/\/+$/, "");
    }
    return String(CHAT_APP_API_BASE_URL || "").replace(/\/+$/, "");
  }

  async function fetchJson(path, extraHeaders = {}) {
    const base = getBaseUrl();
    const rel = path.startsWith("/") ? path : `/${path}`;
    const res = await fetch(`${base}${rel}`, {
      headers: { accept: "*/*", ...extraHeaders },
    });
    return parseResponse(res);
  }

  function pickUsersArray(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.users)) return body.users;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && Array.isArray(body.items)) return body.items;
    return [];
  }

  function sanitizeUserFromApi(u) {
    if (!u || typeof u !== "object") return null;
    return {
      id: u.id,
      mobile: u.mobile ?? null,
      nickname: u.nickname ?? null,
      name: u.name ?? null,
      avatarUrl: u.avatarUrl ?? null,
      lastActiveAt: u.lastActiveAt ?? null,
      createdAt: u.createdAt ?? null,
      updatedAt: u.updatedAt ?? null,
    };
  }

  /** Бекенд повертає баланс у мінорних одиницях (×100 від відображуваного COIN). */
  function parseCoinFromWalletPayload(data) {
    if (!data || typeof data !== "object") return null;
    const raw = Number(data.balance);
    if (!Number.isFinite(raw)) return null;
    return raw / 100;
  }

  async function fetchWalletCoin(userId) {
    try {
      const data = await fetchJson(
        `/wallet/me?currency=${encodeURIComponent(WALLET_CURRENCY)}`,
        { "x-user-id": userId }
      );
      return parseCoinFromWalletPayload(data);
    } catch {
      return null;
    }
  }

  function pickChatsArray(body) {
    if (Array.isArray(body)) return body;
    if (body && Array.isArray(body.chats)) return body.chats;
    if (body && Array.isArray(body.data)) return body.data;
    if (body && Array.isArray(body.items)) return body.items;
    return [];
  }

  function countUserChatsByType(chats) {
    let privateCount = 0;
    let groupCount = 0;
    for (const chat of chats) {
      if (!chat || typeof chat !== "object") continue;
      if (chat.isPrivate) privateCount += 1;
      else if (chat.isGroup) groupCount += 1;
    }
    return { private: privateCount, group: groupCount };
  }

  /** GET /chats з заголовком x-user-id — підрахунок приватних і групових чатів. */
  async function fetchUserChatCounts(userId) {
    try {
      const data = await fetchJson("/chats", { "x-user-id": userId });
      return countUserChatsByType(pickChatsArray(data));
    } catch {
      return null;
    }
  }

  function attachCoin(user, coin) {
    const balance = coin === null ? "—" : formatCoinBalance(coin);
    return { ...user, balance };
  }

  function removeCachedUser(userId) {
    lastUsersList = lastUsersList.filter((u) => u.id !== userId);
    lastUsersById.delete(userId);
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
        (data && typeof data.message === "string" && data.message) ||
        (data && typeof data.error === "string" && data.error) ||
        `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  /** DELETE /users/:id */
  async function apiDeleteUser(userId) {
    const base = getBaseUrl();
    const path = `/users/${encodeURIComponent(userId)}`;
    const res = await fetch(`${base}${path}`, {
      method: "DELETE",
      headers: { accept: "*/*" },
    });
    await parseResponse(res);
    removeCachedUser(userId);
  }

  async function fetchUsersFromNetwork() {
    let body;
    try {
      body = await fetchJson("/users");
    } catch (error) {
      throw error;
    }

    const rawList = pickUsersArray(body);
    const sanitized = rawList.map(sanitizeUserFromApi).filter(Boolean);
    const rows = sanitized.map((user) => attachCoin(user, null));

    lastUsersList = rows;
    lastUsersById = new Map(rows.map((r) => [r.id, r]));
    return rows;
  }

  /** force: true — новий GET /users; false — повернути кеш сесії без мережі. */
  async function apiGetUsers(options = {}) {
    const force = options.force === true;
    if (!force && lastUsersList.length) {
      return lastUsersList.slice();
    }

    if (usersFetchInFlight) {
      const rows = await usersFetchInFlight;
      return rows.slice();
    }

    usersFetchInFlight = fetchUsersFromNetwork().finally(() => {
      usersFetchInFlight = null;
    });

    try {
      const rows = await usersFetchInFlight;
      return rows.slice();
    } catch (error) {
      if (force) {
        lastUsersList = [];
        lastUsersById = new Map();
      }
      throw error;
    }
  }

  function buildProfileFromRow(row) {
    const walletDisplay = row.balance === "—" ? "—" : row.balance;
    return {
      id: row.id,
      mobile: row.mobile,
      nickname: row.nickname,
      name: row.name,
      avatarUrl: row.avatarUrl,
      lastActiveAt: row.lastActiveAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      wallet: { balance: walletDisplay },
      inventory: [],
    };
  }

  async function apiGetUserProfile(userId) {
    let row = lastUsersById.get(userId);
    if (!row) {
      await apiGetUsers();
      row = lastUsersById.get(userId);
    }
    if (!row) return null;

    if (row.balance === "—") {
      const coin = await fetchWalletCoin(userId);
      if (coin !== null) {
        const patched = attachCoin(row, coin);
        lastUsersById.set(userId, patched);
        const idx = lastUsersList.findIndex((u) => u.id === userId);
        if (idx !== -1) lastUsersList[idx] = patched;
        row = patched;
      }
    }

    const profile = buildProfileFromRow(row);
    profile.chatCounts = await fetchUserChatCounts(userId);
    return profile;
  }

  App.api.users = {
    apiGetUsers,
    apiDeleteUser,
    apiGetUserProfile,
  };
})(window);
