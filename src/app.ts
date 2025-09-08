import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { v4 as uuidv4 } from 'uuid';

import { config } from './config/environment';
import { connectDatabase } from './config/database';
import './config/passport'; // Initialize passport strategies
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler.middleware';

// Import routes
import authRoutes from './routes/auth.routes';

const app = express();

// Request ID middleware
app.use((req: any, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// CORS middleware
app.use(cors({
  origin: config.server.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

// Passport middleware
app.use(passport.initialize());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Basic API endpoints
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication server is working!',
    data: req.body,
    requestId: (req as any).requestId,
  });
});

// Error handlers
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    errorCode: 'NOT_FOUND',
  });
});

app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();

    const port = config.server.port;
    app.listen(port, () => {
      logger.info(`🚀 Authentication Server running on port ${port}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Health check: http://localhost:${port}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;