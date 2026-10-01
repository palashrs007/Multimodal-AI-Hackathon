import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { pinoHttp } from 'pino-http';
import crypto from 'crypto';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { generalLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route modules
import healthRouter from './routes/health.js';
import authRouter from './routes/auth.js';
import meRouter from './routes/me.js';
import tripsRouter from './routes/trips.js';
import analysisRouter from './routes/analysis.js';
import itineraryRouter from './routes/itinerary.js';
import shareRouter from './routes/share.js';

const app = express();

// Disable X-Powered-By
app.disable('x-powered-by');

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", env.CLIENT_ORIGIN, 'https:', 'http:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Strict CORS allowlist
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [env.CLIENT_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Request ID assignment
app.use((req, res, next) => {
  req.id = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
});

// HTTP Request Logger
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.id,
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
  })
);

// General Rate Limiting
app.use('/api', generalLimiter);

// JSON body parser with 1 MB limit
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// API Routes (Public routes first)
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', shareRouter);
app.use('/api', meRouter);
app.use('/api', tripsRouter);
app.use('/api', analysisRouter);
app.use('/api', itineraryRouter);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `API route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
