import express from 'express';
import authController from '../controllers/authController.js';
import authLimiter from '../middlewares/rateLimiter.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

// Apply rate limiter to authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);

// Protected route
router.get('/profile', protect, authController.getProfile);

export default router;