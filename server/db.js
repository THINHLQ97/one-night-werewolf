const { Pool } = require('pg');
const { getRank } = require('./ranking');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      google_id TEXT UNIQUE,
      email TEXT,
      display_name TEXT NOT NULL,
      avatar_url TEXT,
      points INTEGER NOT NULL DEFAULT 0,
      games_played INTEGER NOT NULL DEFAULT 0,
      games_won INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS game_history (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      room_code TEXT,
      original_role TEXT,
      final_role TEXT,
      won INTEGER NOT NULL DEFAULT 0,
      points_change INTEGER NOT NULL DEFAULT 0,
      played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_history_user ON game_history(user_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC)');

  console.log('Database tables initialized');
}

initDB().catch(err => console.error('DB init error:', err));

async function getUser(id) {
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  const user = rows[0] || null;
  if (user) user.rank = getRank(user.points);
  return user;
}

async function getUserByGoogle(googleId) {
  const { rows } = await pool.query('SELECT * FROM users WHERE google_id = $1', [googleId]);
  const user = rows[0] || null;
  if (user) user.rank = getRank(user.points);
  return user;
}

async function createUser(id, googleId, email, displayName, avatarUrl) {
  await pool.query(
    'INSERT INTO users (id, google_id, email, display_name, avatar_url, points) VALUES ($1, $2, $3, $4, $5, 0)',
    [id, googleId, email, displayName, avatarUrl]
  );
  return getUser(id);
}

async function updateProfile(id, displayName, avatarUrl) {
  await pool.query(
    'UPDATE users SET display_name = $1, avatar_url = $2, updated_at = NOW() WHERE id = $3',
    [displayName, avatarUrl, id]
  );
  return getUser(id);
}

async function updatePoints(id, pointsDelta, won, roomCode, originalRole, finalRole) {
  await pool.query(
    'UPDATE users SET points = LEAST(5000, GREATEST(0, points + $1)), games_played = games_played + 1, games_won = games_won + $2, updated_at = NOW() WHERE id = $3',
    [pointsDelta, won ? 1 : 0, id]
  );
  await pool.query(
    'INSERT INTO game_history (user_id, room_code, original_role, final_role, won, points_change) VALUES ($1, $2, $3, $4, $5, $6)',
    [id, roomCode, originalRole, finalRole, won ? 1 : 0, pointsDelta]
  );
  return getUser(id);
}

async function getLeaderboard(limit = 20) {
  const { rows } = await pool.query(
    'SELECT id, display_name, avatar_url, points, games_played, games_won FROM users ORDER BY points DESC LIMIT $1',
    [limit]
  );
  return rows.map(r => ({ ...r, rank: getRank(r.points) }));
}

async function getUserPosition(id) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) as rank FROM users WHERE points > (SELECT points FROM users WHERE id = $1)',
    [id]
  );
  return rows[0] ? parseInt(rows[0].rank) + 1 : null;
}

module.exports = { getUser, getUserByGoogle, createUser, updateProfile, updatePoints, getLeaderboard, getUserPosition };
