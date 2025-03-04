import express from 'express';
import packageController from '../controllers/packageController.js';

const router = express.Router();

router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

export default router;