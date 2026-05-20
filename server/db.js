const Database = require('better-sqlite3');
const path = require('path');
const { getRank } = require('./ranking');

const db = new Database(path.join(__dirname, 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    google_id TEXT UNIQUE,
    email TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    points INTEGER NOT NULL DEFAULT 0,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id),
    room_code TEXT,
    original_role TEXT,
    final_role TEXT,
    won INTEGER NOT NULL DEFAULT 0,
    points_change INTEGER NOT NULL DEFAULT 0,
    played_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON game_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);
`);

const stmts = {
  getUser: db.prepare('SELECT * FROM users WHERE id = ?'),
  getUserByGoogle: db.prepare('SELECT * FROM users WHERE google_id = ?'),
  createUser: db.prepare(`
    INSERT INTO users (id, google_id, email, display_name, avatar_url, points)
    VALUES (?, ?, ?, ?, ?, 0)
  `),
  updateProfile: db.prepare(`
    UPDATE users SET display_name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?
  `),
  updatePoints: db.prepare(`
    UPDATE users SET points = MIN(5000, MAX(0, points + ?)), games_played = games_played + 1,
    games_won = games_won + ?, updated_at = datetime('now') WHERE id = ?
  `),
  addGameHistory: db.prepare(`
    INSERT INTO game_history (user_id, room_code, original_role, final_role, won, points_change)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getLeaderboard: db.prepare('SELECT id, display_name, avatar_url, points, games_played, games_won FROM users ORDER BY points DESC LIMIT ?'),
  getUserRank: db.prepare('SELECT COUNT(*) as rank FROM users WHERE points > (SELECT points FROM users WHERE id = ?)'),
};

function getUser(id) {
  const user = stmts.getUser.get(id);
  if (user) user.rank = getRank(user.points);
  return user;
}

function getUserByGoogle(googleId) {
  const user = stmts.getUserByGoogle.get(googleId);
  if (user) user.rank = getRank(user.points);
  return user;
}

function createUser(id, googleId, email, displayName, avatarUrl) {
  stmts.createUser.run(id, googleId, email, displayName, avatarUrl);
  return getUser(id);
}

function updateProfile(id, displayName, avatarUrl) {
  stmts.updateProfile.run(displayName, avatarUrl, id);
  return getUser(id);
}

function updatePoints(id, pointsDelta, won, roomCode, originalRole, finalRole) {
  stmts.updatePoints.run(pointsDelta, won ? 1 : 0, id);
  stmts.addGameHistory.run(id, roomCode, originalRole, finalRole, won ? 1 : 0, pointsDelta);
  return getUser(id);
}

function getLeaderboard(limit = 20) {
  const rows = stmts.getLeaderboard.all(limit);
  return rows.map(r => ({ ...r, rank: getRank(r.points) }));
}

function getUserPosition(id) {
  const result = stmts.getUserRank.get(id);
  return result ? result.rank + 1 : null;
}

module.exports = { getUser, getUserByGoogle, createUser, updateProfile, updatePoints, getLeaderboard, getUserPosition };
