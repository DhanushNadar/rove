const { z } = require('zod');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGO_URI: z.string().min(1, 'MongoDB URI is required'),
  REDIS_URI: z.string().optional(),
  JWT_SECRET: z.string().min(10, 'JWT Secret must be at least 10 characters long'),
  JWT_REFRESH_SECRET: z.string().min(10, 'JWT Refresh Secret must be at least 10 characters long'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
});

// Clean process.env of any accidental leading/trailing quotes pasted during cloud configuration
const cleanedEnv = {};
for (const [key, value] of Object.entries(process.env)) {
  if (value && typeof value === 'string') {
    cleanedEnv[key] = value.replace(/^['"]|['"]$/g, '');
  } else {
    cleanedEnv[key] = value;
  }
}

const parseResult = envSchema.safeParse(cleanedEnv);

if (!parseResult.success) {
  console.error('❌ Invalid environment variables:', parseResult.error.format());
  process.exit(1);
}

module.exports = parseResult.data;
