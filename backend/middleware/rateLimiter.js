import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Reduced window to 15 mins
  max: process.env.NODE_ENV === 'production' ? 15 : 1000, // Generous 1000 requests in development/hackathon demo
  message: { error: 'Too many authentication attempts from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
