const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const testRoutes = require('./routes/testRoutes');

const app = express();

// Security headers
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// JSON body parse
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, try again later' }
});
app.use('/api', limiter);

// ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/test', testRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'IntellMeet Server is running!',
    timestamp: new Date().toISOString()
  });
});

// Error handler
app.use(errorHandler);

module.exports = app;