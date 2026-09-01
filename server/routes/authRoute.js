import { Router } from 'express';

import { login, logout, me, register } from '../controller/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const authRoute = Router();

authRoute.post('/register', register);
authRoute.post('/login', login);
authRoute.post('/logout', logout);
authRoute.get('/me', authMiddleware, me);

export default authRoute;
