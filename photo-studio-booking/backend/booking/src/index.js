// src/server.js or your main server file
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studioRoutes from './routes/studioRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import { startScheduler } from './scheduler.js'; // Import the scheduler

// Initialize environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/studios', studioRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start the scheduler to generate slots daily
  startScheduler();
});