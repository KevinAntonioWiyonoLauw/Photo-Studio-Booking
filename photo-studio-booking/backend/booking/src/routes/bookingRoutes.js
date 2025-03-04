import express from 'express';
import bookingController from '../controllers/bookingController.js';
import protect from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import bookingLimiter from '../middlewares/rateLimiter.js';

const router = express.Router();

// All routes need authentication
router.use(protect);

// User Routes
// Apply rate limiter to booking creation
router.post('/', bookingLimiter, bookingController.createBooking);
router.get('/', bookingController.getUserBookings);
router.get('/:id', bookingController.getBookingById);
router.put('/:id/cancel', bookingController.cancelBooking);

// Admin Routes
router.get('/admin/all', adminMiddleware, bookingController.getAllBookings);
router.put('/:id/status', adminMiddleware, bookingController.updateBookingStatus);

export default router;