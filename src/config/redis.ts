import { createClient } from 'redis';
import logger from '@/utils/logger';
import { config } from '@/config/environment';

let redis: ReturnType<typeof createClient>;

export const createRedisClient = (): ReturnType<typeof createClient> => {
  const client = createClient({
    url: config.redis.url,
    socket: {
      reconnectStrategy: (retries: number) => {
        if (retries > 10) {
          logger.error('Redis reconnection failed after 10 attempts');
          return false;
        }
        return Math.min(retries * 100, 3000);
      },
    },
  });

  client.on('connect', () => {
    logger.info('✅ Redis connected successfully');
  });

  client.on('error', (error) => {
    logger.error('❌ Redis connection error:', error);
  });

  client.on('ready', () => {
    logger.info('Redis client ready');
  });

  client.on('reconnecting', () => {
    logger.info('Redis reconnecting...');
  });

  return client as any;
};

export const connectRedis = async (): Promise<void> => {
  try {
    if (!redis) {
      redis = createRedisClient();
    }
    
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    logger.warn('Failed to connect to Redis (continuing without Redis):', error);
    // Don't throw error - allow app to continue without Redis
    redis = null;
  }
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redis && redis.isOpen) {
      await redis.disconnect();
      logger.info('Redis disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};

export const getRedisClient = (): ReturnType<typeof createClient> => {
  if (!redis) {
    throw new Error('Redis client not available.');
  }
  return redis;
};

export default getRedisClient;