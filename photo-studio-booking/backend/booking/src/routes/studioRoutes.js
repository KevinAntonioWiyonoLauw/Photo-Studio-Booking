import express from 'express';
import studioController from '../controllers/studioController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', studioController.getAllStudios);
router.get('/:id', studioController.getStudioById);

// Admin routes
router.post('/', authMiddleware, adminMiddleware, studioController.createStudio);
router.put('/:id', authMiddleware, adminMiddleware, studioController.updateStudio);
router.delete('/:id', authMiddleware, adminMiddleware, studioController.deleteStudio);

export default router;