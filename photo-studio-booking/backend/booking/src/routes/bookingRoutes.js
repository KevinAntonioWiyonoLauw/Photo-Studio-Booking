import express from 'express';
import bookingController from '../controllers/bookingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// PUBLIC ROUTES
// Add this route before any routes with parameters like :id
router.get('/available-hours', bookingController.getAvailableHours);
router.get('/booked-slots', bookingController.getBookedSlots);

// USER ROUTES - These require authentication
router.post('/', authMiddleware, bookingController.createBooking);
router.get('/', authMiddleware, bookingController.getUserBookings);

// Make sure the parameter routes come AFTER specific routes
router.get('/:id', authMiddleware, bookingController.getBookingById);
router.put('/:id/cancel', authMiddleware, bookingController.cancelBooking);

// ADMIN ROUTES
router.get('/admin/all', authMiddleware, adminMiddleware, bookingController.getAllBookings);
router.put('/:id/status', authMiddleware, adminMiddleware, bookingController.updateBookingStatus);

export default router;