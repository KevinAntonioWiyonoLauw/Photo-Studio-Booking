// src/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studioRoutes from './routes/studioRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startScheduler } from './scheduler.js'; // Import the scheduler
import bookingLimiter from './middlewares/rateLimiter.js'; // Fix the import path if needed

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Apply booking limiter only to booking routes
app.use('/api/studios', studioRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingLimiter, bookingRoutes); // Apply rate limiter here

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the scheduler to generate slots daily
  startScheduler();
});