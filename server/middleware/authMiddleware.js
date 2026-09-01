import jwt from 'jsonwebtoken';

const JWT_TOKEN = process.env.JWT_TOKEN || 'token_fallback';

export function authMiddleware(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'token is missing' });
  }

  try {
    req.user = jwt.verify(token, JWT_TOKEN);
  } catch {
    return res.status(401).json({ error: 'Session is expired' });
  }

  return next();
}

export default authMiddleware;
