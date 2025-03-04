import rateLimit from 'express-rate-limit';

// Create rate limiter for booking endpoints
const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // limit each IP to 30 requests per hour
  message: 'Too many booking requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export default bookingLimiter;