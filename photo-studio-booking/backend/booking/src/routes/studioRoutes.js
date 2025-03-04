import express from 'express';
import studioController from '../controllers/studioController.js';

const router = express.Router();

router.get('/', studioController.getAllStudios);
router.get('/:id', studioController.getStudioById);

export default router;