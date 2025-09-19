import dotenv from 'dotenv';
import { z } from 'zod';
import logger from '@/utils/logger';

dotenv.config();

const envSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT Configuration
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // OAuth Configuration
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),

  // Email Configuration
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),

  // Redis Configuration
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Session Configuration
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(5),

  // Application URLs
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  SERVER_URL: z.string().url().default('http://localhost:3000'),

  // Email Verification
  EMAIL_VERIFICATION_EXPIRES_IN: z.string().default('24h'),
  PASSWORD_RESET_EXPIRES_IN: z.string().default('1h'),

  // Bcrypt
  BCRYPT_ROUNDS: z.coerce.number().min(10).max(15).default(12),
});

type Environment = z.infer<typeof envSchema>;

const validateEnvironment = (): Environment => {
  try {
    const parsed = envSchema.parse(process.env);
    logger.info('✅ Environment variables validated successfully');
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      logger.error('❌ Environment validation failed:');
      errorMessages.forEach(msg => logger.error(`  - ${msg}`));
    } else {
      logger.error('❌ Environment validation failed:', error);
    }
    process.exit(1);
  }
};

export const env = validateEnvironment();

export const config = {
  server: {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
    corsOrigin: env.CORS_ORIGIN.split(',').map(origin => origin.trim()),
  },
  database: {
    url: env.DATABASE_URL,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      appId: env.FACEBOOK_APP_ID,
      appSecret: env.FACEBOOK_APP_SECRET,
    },
  },
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    },
    from: {
      email: env.FROM_EMAIL || 'noreply@example.com',
      name: env.FROM_NAME || 'Auth Server',
    },
    verification: {
      expiresIn: env.EMAIL_VERIFICATION_EXPIRES_IN,
    },
    passwordReset: {
      expiresIn: env.PASSWORD_RESET_EXPIRES_IN,
    },
  },
  redis: {
    url: env.REDIS_URL,
  },
  session: {
    secret: env.SESSION_SECRET,
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    auth: {
      windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
      maxRequests: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
    },
  },
  urls: {
    client: env.CLIENT_URL,
    server: env.SERVER_URL,
  },
  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },
} as const;

export default config;