const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'onw-dev-secret-change-in-production';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.email?.split('@')[0] || 'Player',
    picture: payload.picture || null,
  };
}

function signJwt(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function verifyJwt(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

async function handleGoogleLogin(idToken) {
  const google = await verifyGoogleToken(idToken);

  let user = db.getUserByGoogle(google.googleId);
  if (!user) {
    const id = uuidv4();
    user = db.createUser(id, google.googleId, google.email, google.name, google.picture);
  }

  const token = signJwt(user.id);
  return { user, token };
}

function handleGuestLogin(name) {
  const id = uuidv4();
  const user = db.createUser(id, null, null, name || 'Guest', null);
  const token = signJwt(user.id);
  return { user, token };
}

function authenticateToken(token) {
  const payload = verifyJwt(token);
  if (!payload) return null;
  return db.getUser(payload.userId);
}

module.exports = { handleGoogleLogin, handleGuestLogin, authenticateToken, verifyJwt, GOOGLE_CLIENT_ID };
