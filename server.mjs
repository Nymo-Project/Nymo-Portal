/**
 * Dev-сервер: вхід у панель (сесія) + статика + проксі до зовнішнього API.
 * Запуск: скопіюй .env.example → .env, npm install && npm run dev
 */
import "dotenv/config";
import express from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import fs from "fs";
import { createProxyMiddleware } from "http-proxy-middleware";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 8787;
const HOST = process.env.HOST || "0.0.0.0";
const UPSTREAM = process.env.CHAT_APP_UPSTREAM || "https://chat-app-anzi.onrender.com";
const publicBaseUrl = process.env.RENDER_EXTERNAL_URL || `http://127.0.0.1:${PORT}`;

const sessionSecret = process.env.PANEL_SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  console.error("FATAL: set PANEL_SESSION_SECRET in production.");
  process.exit(1);
}
const effectiveSecret = sessionSecret || "dev-only-insecure-secret-change-in-env";

function loadPanelAccounts() {
  const raw = process.env.PANEL_ACCOUNTS;
  if (!raw || !String(raw).trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a && typeof a.username === "string" && typeof a.password === "string")
      .map((a) => ({ username: a.username.trim(), password: a.password }));
  } catch {
    console.error("PANEL_ACCOUNTS: invalid JSON");
    return [];
  }
}

/** Пароль у .env: bcrypt-хеш ($2a$/...) або відкритий рядок (лише для dev). */
async function verifyAccountPassword(plain, stored) {
  if (stored.startsWith("$2a$") || stored.startsWith("$2b$") || stored.startsWith("$2y$")) {
    try {
      return await bcrypt.compare(plain, stored);
    } catch {
      return false;
    }
  }
  return plain === stored;
}

const app = express();
app.set("trust proxy", 1);

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ limit: "64kb" }));

const REPORTS_PATH = path.join(__dirname, "data", "reports.json");
const REPORT_STATUSES = new Set(["new", "in_progress", "processed"]);

function readReportsFile() {
  const raw = fs.readFileSync(REPORTS_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!data || !Array.isArray(data.items)) {
    throw new Error("Invalid reports.json shape");
  }
  return data;
}

function writeReportsFile(data) {
  fs.writeFileSync(REPORTS_PATH, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function normalizeReportItem(item) {
  if (!item) return item;
  if (typeof item.adminReply !== "string") item.adminReply = "";
  if (typeof item.adminReplyAt === "undefined") item.adminReplyAt = null;
  return item;
}

function normalizeReportsQuery(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("uk-UA");
}

function reportMatchesSearch(item, qNorm) {
  if (!qNorm) return true;
  const parts = [
    item.id,
    item.text,
    item.adminReply,
    item.reporter?.name,
    item.reporter?.phone,
  ]
    .filter((v) => v != null && String(v).trim())
    .join(" ")
    .toLocaleLowerCase("uk-UA");
  return parts.includes(qNorm);
}

function getReportSortValue(item, sortBy) {
  if (sortBy === "updatedAt") return item.updatedAt || "";
  if (sortBy === "status") return item.status || "";
  if (sortBy === "reporter.name") return item.reporter?.name || "";
  return item.createdAt || "";
}

function compareReports(a, b, sortBy, sortDir) {
  const av = getReportSortValue(a, sortBy);
  const bv = getReportSortValue(b, sortBy);
  let cmp = 0;
  if (sortBy === "createdAt" || sortBy === "updatedAt") {
    cmp = new Date(av).getTime() - new Date(bv).getTime();
    if (Number.isNaN(cmp)) cmp = String(av).localeCompare(String(bv), "uk");
  } else {
    cmp = String(av).localeCompare(String(bv), "uk", { sensitivity: "base" });
  }
  return sortDir === "asc" ? cmp : -cmp;
}

function listReportsFromQuery(query) {
  const status = String(query.status || "").trim();
  const qNorm = normalizeReportsQuery(query.q);
  const sortByRaw = String(query.sortBy || "createdAt").trim();
  const sortBy = ["createdAt", "updatedAt", "status", "reporter.name"].includes(sortByRaw)
    ? sortByRaw
    : "createdAt";
  const sortDir = String(query.sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number.parseInt(String(query.page || "1"), 10) || 1);
  const limitRaw = Number.parseInt(String(query.limit || "20"), 10) || 20;
  const limit = Math.min(100, Math.max(1, limitRaw));

  let items = readReportsFile().items.slice();
  if (status && REPORT_STATUSES.has(status)) {
    items = items.filter((item) => item.status === status);
  }
  if (qNorm) {
    items = items.filter((item) => reportMatchesSearch(item, qNorm));
  }
  items.sort((a, b) => compareReports(a, b, sortBy, sortDir));

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const pageItems = items.slice(start, start + limit).map(normalizeReportItem);

  return { items: pageItems, total, page: safePage, limit, totalPages };
}

function findReportById(id) {
  const data = readReportsFile();
  const item = data.items.find((r) => r.id === id);
  return { data, item };
}

function patchReportById(id, body) {
  const { data, item } = findReportById(id);
  if (!item) return null;

  const now = new Date().toISOString();
  if (body && typeof body.status === "string") {
    const next = body.status.trim();
    if (!REPORT_STATUSES.has(next)) {
      const err = new Error("Invalid status");
      err.statusCode = 400;
      throw err;
    }
    item.status = next;
    if (next === "processed") {
      item.processedAt =
        typeof body.processedAt === "string" && body.processedAt.trim()
          ? body.processedAt.trim()
          : now;
    } else {
      item.processedAt = null;
    }
  }

  if (body && typeof body.adminReply === "string") {
    const nextReply = body.adminReply;
    const prevReply = item.adminReply || "";
    item.adminReply = nextReply;
    if (nextReply.trim()) {
      if (nextReply.trim() !== prevReply.trim()) {
        item.adminReplyAt = now;
      }
    } else {
      item.adminReplyAt = null;
    }
  }

  item.updatedAt = now;
  writeReportsFile(data);
  return normalizeReportItem(item);
}

app.use(
  session({
    name: "nymo_panel_sid",
    secret: effectiveSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

function requirePanelAuth(req, res, next) {
  if (req.session?.panelUser) return next();
  const accepts = req.accepts(["html", "json"]);
  if (accepts === "json") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return res.redirect(302, "/login");
}

const accounts = loadPanelAccounts();
if (accounts.length === 0) {
  console.warn("WARN: PANEL_ACCOUNTS is empty — nobody can log in. Copy .env.example to .env and set accounts.");
}

const loginHtmlPath = path.join(__dirname, "login.html");
if (!fs.existsSync(loginHtmlPath)) {
  console.error(`FATAL: login page not found at ${loginHtmlPath}`);
  process.exit(1);
}

function sendLoginPage(req, res) {
  if (req.session?.panelUser) return res.redirect(302, "/");
  res.sendFile(loginHtmlPath);
}

app.get(["/login", "/login.html"], sendLoginPage);

/** CSS для /login (статика під requirePanelAuth недоступна без сесії). */
app.get("/styles.css", (_req, res) => {
  res.type("text/css");
  res.sendFile(path.join(__dirname, "styles.css"));
});

app.use(
  "/styles",
  express.static(path.join(__dirname, "styles"), {
    setHeaders(res, filePath) {
      if (filePath.endsWith(".css")) res.type("text/css");
    },
  })
);

app.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim();
  const password = String(req.body?.password || "");
  if (!username || !password) {
    return res.redirect(302, "/login?err=1");
  }
  const user = accounts.find((a) => a.username === username);
  if (!user) {
    return res.redirect(302, "/login?err=1");
  }
  const ok = await verifyAccountPassword(password, user.password);
  if (!ok) {
    return res.redirect(302, "/login?err=1");
  }
  req.session.panelUser = username;
  req.session.save((err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Session error");
    }
    return res.redirect(302, "/");
  });
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect(302, "/login");
  });
});

app.get("/api/local/reports", requirePanelAuth, (req, res) => {
  try {
    res.json(listReportsFromQuery(req.query));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to read reports" });
  }
});

app.get("/api/local/reports/:id", requirePanelAuth, (req, res) => {
  try {
    const { item } = findReportById(req.params.id);
    if (!item) return res.status(404).json({ error: "Not found" });
    return res.json(normalizeReportItem(item));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to read report" });
  }
});

app.patch("/api/local/reports/:id", requirePanelAuth, (req, res) => {
  try {
    const updated = patchReportById(req.params.id, req.body || {});
    if (!updated) return res.status(404).json({ error: "Not found" });
    return res.json(updated);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    console.error(error);
    return res.status(500).json({ error: "Failed to update report" });
  }
});

app.use(
  "/api-proxy",
  requirePanelAuth,
  createProxyMiddleware({
    target: UPSTREAM,
    changeOrigin: true,
    pathRewrite: { "^/api-proxy": "" },
    secure: true,
    logLevel: "warn",
  })
);

app.use(requirePanelAuth, express.static(__dirname));

app.use((req, res) => {
  if (req.session?.panelUser) {
    return res.status(404).send("Not found");
  }
  return res.redirect(302, "/login");
});

app.listen(PORT, HOST, () => {
  console.log(`NYMO Panel: ${publicBaseUrl}/`);
  console.log(`Login:       ${publicBaseUrl}/login`);
  console.log(`API proxy:   ${publicBaseUrl}/api-proxy → ${UPSTREAM}`);
  if (!sessionSecret) {
    console.warn("WARN: PANEL_SESSION_SECRET not set — using insecure dev default.");
  }
});
