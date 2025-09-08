import Redis from 'redis';
import logger from '@/utils/logger';
import { config } from '@/config/environment';

let redis: Redis.RedisClientType;

export const createRedisClient = (): Redis.RedisClientType => {
  const client = Redis.createClient({
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

  return client;
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
    logger.error('Failed to connect to Redis:', error);
    throw error;
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

export const getRedisClient = (): Redis.RedisClientType => {
  if (!redis) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redis;
};

export default getRedisClient;