import express from 'express';
import packageController from '../controllers/packageController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Public routes - no authentication needed
router.get('/', packageController.getAllPackages);
router.get('/:id', packageController.getPackageById);

// Admin routes - require admin privileges
router.post('/', authMiddleware, adminMiddleware, packageController.createPackage);
router.put('/:id', authMiddleware, adminMiddleware, packageController.updatePackage);
router.delete('/:id', authMiddleware, adminMiddleware, packageController.deletePackage);

export default router;