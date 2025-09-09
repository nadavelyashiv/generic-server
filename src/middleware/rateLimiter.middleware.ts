import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { config } from '@/config/environment';
import { RateLimitError } from '@/utils/errors';
import getRedisClient from '@/config/redis';
import logger from '@/utils/logger';

// In-memory store fallback
const memoryStore = new Map<string, { count: number; resetTime: number }>();

class RedisStore {
  private redis: ReturnType<typeof getRedisClient> | null = null;
  private prefix: string;

  constructor(prefix = 'rate_limit:') {
    this.prefix = prefix;
  }

  private getRedis() {
    // For development, always use memory store to avoid Redis auth issues
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    if (!this.redis) {
      try {
        this.redis = getRedisClient();
      } catch (error) {
        logger.warn('Redis not available, using memory fallback for rate limiting');
        return null;
      }
    }
    return this.redis;
  }

  async increment(key: string, windowMs: number): Promise<{ totalHits: number; timeToReset: number }> {
    const redisKey = `${this.prefix}${key}`;
    const redis = this.getRedis();
    
    try {
      if (redis) {
        const multi = redis.multi();
        multi.incr(redisKey);
        multi.expire(redisKey, Math.ceil(windowMs / 1000));
        multi.ttl(redisKey);
        
        const results = await multi.exec();
        const totalHits = results?.[0] as number ?? 1;
        const ttl = results?.[2] as number ?? Math.ceil(windowMs / 1000);
        
        const timeToReset = ttl * 1000;
        
        return { totalHits, timeToReset };
      }
    } catch (error) {
      logger.error('Redis rate limit error, falling back to memory store:', error);
    }
    
    // Fallback to memory store
    const now = Date.now();
    const entry = memoryStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      memoryStore.set(key, { count: 1, resetTime: now + windowMs });
      return { totalHits: 1, timeToReset: windowMs };
    }
    
    entry.count++;
    return { totalHits: entry.count, timeToReset: entry.resetTime - now };
  }

  async decrement(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    const redis = this.getRedis();
    
    try {
      if (redis) {
        await redis.decr(redisKey);
        return;
      }
    } catch (error) {
      logger.error('Redis rate limit decrement error:', error);
    }
    
    // Fallback to memory store
    const entry = memoryStore.get(key);
    if (entry && entry.count > 0) {
      entry.count--;
    }
  }

  async resetKey(key: string): Promise<void> {
    const redisKey = `${this.prefix}${key}`;
    const redis = this.getRedis();
    
    try {
      if (redis) {
        await redis.del(redisKey);
        return;
      }
    } catch (error) {
      logger.error('Redis rate limit reset error:', error);
    }
    
    // Fallback to memory store
    memoryStore.delete(key);
  }
}

const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyPrefix?: string;
}) => {
  const store = new RedisStore(options.keyPrefix);
  
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    skipFailedRequests: options.skipFailedRequests || false,
    keyGenerator: (req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return (req.user as any)?.id || req.ip;
    },
    store: {
      incr: async (key: string) => {
        const { totalHits, timeToReset } = await store.increment(key, options.windowMs);
        return { totalHits, timeToReset };
      },
      decrement: (key: string) => store.decrement(key),
      resetKey: (key: string) => store.resetKey(key),
    },
    handler: (req: Request, res: Response) => {
      const retryAfter = Math.ceil(options.windowMs / 1000);
      
      const error = new RateLimitError(
        options.message || 'Too many requests, please try again later',
        retryAfter
      );
      
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
        errorCode: error.errorCode,
        retryAfter,
      });
    },
  });
};

// General rate limiter
export const generalRateLimit = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many requests from this IP, please try again later',
  keyPrefix: 'general:',
});

// Auth rate limiter (more restrictive)
export const authRateLimit = createRateLimiter({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.maxRequests,
  message: 'Too many authentication attempts, please try again later',
  skipSuccessfulRequests: true,
  keyPrefix: 'auth:',
});

// Password reset rate limiter
export const passwordResetRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset attempts, please try again later',
  keyPrefix: 'password_reset:',
});

// Email verification rate limiter
export const emailVerificationRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: 'Too many email verification attempts, please try again later',
  keyPrefix: 'email_verification:',
});

// Admin operations rate limiter
export const adminRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Higher limit for admin users
  message: 'Too many admin requests, please try again later',
  keyPrefix: 'admin:',
});