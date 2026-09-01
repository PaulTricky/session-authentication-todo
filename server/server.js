import express from 'express';

import 'dotenv/config';

import cors from 'cors';
import cookieParser from 'cookie-parser';

import db from './db/db.js';
import authRoute from './routes/authRoute.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(cors({ origin: process.env.ORIGINS.split(','), credentials: true }));

app.use('/api/auth', authRoute);

app.get('/', (req, res) => {
  return res.send('server is live');
});

app.get('/health', (req, res) => {
  const { ok } = db.prepare('SELECT 1 AS ok').get();

  return res.json({
    server: 'live',
    database: ok === 1 ? 'connected' : 'down',
  });
});

app.use((err, _req, res, _next) => {
  console.error(`Error ${err.message}`);

  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('server is running on ' + port);
});
