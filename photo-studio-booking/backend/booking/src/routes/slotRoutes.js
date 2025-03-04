import express from 'express';
import slotController from '../controllers/slotController.js';
import protect from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', slotController.getAvailableSlots);
router.post('/', protect, slotController.createSlot);

export default router;