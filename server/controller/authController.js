import jwt from 'jsonwebtoken';
import User, { toUser } from '../models/User.js';

const JWT_TOKEN = process.env.JWT_TOKEN || 'token_fallback';
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// clearCookie only matches a cookie whose attributes line up with the ones it
// was set with, so both paths share this object.
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: THIRTY_DAYS_MS,
  path: '/',
};

const setSessionToken = (res, payload) => {
  const token = jwt.sign(payload, JWT_TOKEN, {
    expiresIn: '30d',
  });

  res.cookie('token', token, COOKIE_OPTIONS);
};

export async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: 'fields are required' });

  const user = await User.authenticate(email, password);

  // One message for both "no such email" and "wrong password", so the response
  // does not reveal which addresses have accounts.
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  setSessionToken(res, { userId: user.id, email: user.email });

  return res.json({ user: toUser(user) });
}

export async function register(req, res) {
  const { email, name, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'fields are required' });

  const trimmedEmail = email.trim().toLowerCase();

  const existingUser = User.findByEmail(trimmedEmail);

  // check existing;

  if (existingUser)
    return res.status(400).json({ error: 'An account is already existed' });

  // The check above can still lose a race with a simultaneous signup, so the
  // UNIQUE constraint is the actual guard and this turns it into a clean 400.
  let user;
  try {
    user = await User.create({ name, email: trimmedEmail, password });
  } catch (err) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE')
      return res.status(400).json({ error: 'An account is already existed' });

    throw err;
  }

  setSessionToken(res, { userId: user.id, email: user.email });

  return res.status(201).json({
    user: toUser(user),
  });
}

export async function logout(req, res) {
  res.clearCookie('token', COOKIE_OPTIONS);

  return res.json({ message: 'Logged out' });
}

export async function me(req, res) {
  const user = User.findById(req.user.userId);

  // Valid signature but the row is gone (deleted account, or a token minted
  // against a database that has since been reset).
  if (!user) {
    res.clearCookie('token', COOKIE_OPTIONS);

    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.json({ user: toUser(user) });
}
