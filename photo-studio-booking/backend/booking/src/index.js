import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import studioRoutes from './routes/studioRoutes.js';
import packageRoutes from './routes/packageRoutes.js';
import slotRoutes from './routes/slotRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());   // Enable CORS
app.use(express.json()); // JSON body parsing

// Routes
app.use('/api/studios', studioRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/', (req, res) => {
  res.send('Booking Service API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Booking Service running on port ${PORT}`);
});