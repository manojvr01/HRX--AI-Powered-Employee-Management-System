import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/hrx_dev'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters long'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters long'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  ORG_TIMEZONE: z.string().default('Asia/Kolkata'),
  ORG_LATE_THRESHOLD_MINUTES: z.coerce.number().default(15),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parseResult.error.format(), null, 2));
  process.exit(1);
}

export const env = parseResult.data;
