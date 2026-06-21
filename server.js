// PlateMind backend — minimal username/password auth + static app server.
// Deliberately uses only pure-JavaScript dependencies (no native compiler
// / Visual Studio Build Tools needed on Windows) — users are stored in a
// plain JSON file, sessions in a plain file store.
const fs = require("fs");
const path = require("path");
const express = require("express");
const session = require("express-session");
const FileStore = require("session-file-store")(session);
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || __dirname; // override with a Render persistent disk path
const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SESSIONS_DIR = path.join(DATA_DIR, "sessions");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(SESSIONS_DIR)) fs.mkdirSync(SESSIONS_DIR, { recursive: true });

// ---------- Tiny JSON "database" ----------
function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
function findUser(username) {
  return loadUsers().find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );
}

// ---------- App ----------
const app = express();
app.set("trust proxy", 1); // needed on Render so secure cookies work behind its proxy

app.use(express.json());
app.use(
  session({
    store: new FileStore({ path: SESSIONS_DIR, retries: 0, logFn: () => {} }),
    name: "platemind.sid",
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    },
  })
);

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

// ---------- Auth API ----------
app.post("/api/register", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const cleanUsername = username.trim();
  if (!USERNAME_RE.test(cleanUsername)) {
    return res.status(400).json({
      error: "Username must be 3-20 characters: letters, numbers, underscore only.",
    });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  if (findUser(cleanUsername)) {
    return res.status(409).json({ error: "That username is already taken." });
  }

  const hash = await bcrypt.hash(password, 12);
  const users = loadUsers();
  const newUser = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    username: cleanUsername,
    password_hash: hash,
    created_at: new Date().toISOString(),
  };
  users.push(newUser);
  saveUsers(users);

  req.session.userId = newUser.id;
  req.session.username = newUser.username;
  res.json({ user: { username: newUser.username } });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Username and password are required." });
  }
  const user = findUser(username.trim());

  // Generic error message on purpose — don't reveal whether the username exists.
  if (!user) return res.status(401).json({ error: "Incorrect username or password." });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Incorrect username or password." });

  req.session.userId = user.id;
  req.session.username = user.username;
  res.json({ user: { username: user.username } });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("platemind.sid");
    res.json({ ok: true });
  });
});

app.get("/api/me", (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({ user: { username: req.session.username } });
  }
  res.status(401).json({ error: "Not signed in." });
});

// ---------- Static assets ----------
// Login/register page and its assets are always public.
app.use(express.static(path.join(__dirname, "public-auth")));

// The main app's assets (css/js) are harmless to serve publicly, but the
// app page itself requires a session.
app.use(
  express.static(path.join(__dirname, "public"), {
    index: false, // don't auto-serve index.html for unauthenticated requests
  })
);

app.get("/", (req, res) => {
  if (!(req.session && req.session.userId)) {
    return res.redirect("/login.html");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/api/*", (req, res) => res.status(404).json({ error: "Not found." }));

app.listen(PORT, () => {
  console.log(`PlateMind server listening on port ${PORT}`);
});
