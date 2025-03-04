import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());   // Enable CORS
app.use(express.json()); // JSON body parsing

// Routes
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('Auth Service API is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});