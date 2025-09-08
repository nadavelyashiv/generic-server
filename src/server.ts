import express from 'express';
import { connectDatabase } from './config/database';
import logger from './utils/logger';

const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Basic auth test endpoint
app.post('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Server is working!',
    data: req.body
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
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