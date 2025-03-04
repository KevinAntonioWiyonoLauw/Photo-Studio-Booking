import express from 'express';
import slotController from '../controllers/slotController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', slotController.getAvailableSlots);

// Admin routes
router.get('/studio/:studioId', authMiddleware, adminMiddleware, slotController.getAllSlotsByStudio);
router.post('/', authMiddleware, adminMiddleware, slotController.createSlot);
router.post('/batch', authMiddleware, adminMiddleware, slotController.batchCreateSlots);
router.put('/:id', authMiddleware, adminMiddleware, slotController.updateSlot);
router.delete('/:id', authMiddleware, adminMiddleware, slotController.deleteSlot);

export default router;