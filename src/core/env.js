const dotenv = require('dotenv');

dotenv.config();

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: toInt(process.env.PORT, 3000),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  BCRYPT_SALT_ROUNDS: toInt(process.env.BCRYPT_SALT_ROUNDS, 10),

  // Webhooks (provider lead ingestion)
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  WEBHOOK_SYSTEM_USER_ID: process.env.WEBHOOK_SYSTEM_USER_ID,

  // Firebase Cloud Messaging (optional; all three required to enable FCM).
  // Private keys are stored single-line in .env, so unescape the newlines.
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY:
    (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n') || undefined,

  // Seed credentials (used by prisma/seed.js)
  SEED_ADMIN_NAME: process.env.SEED_ADMIN_NAME || 'Admin User',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@lms.local',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
  SEED_EMPLOYEE_NAME: process.env.SEED_EMPLOYEE_NAME || 'Employee User',
  SEED_EMPLOYEE_EMAIL: process.env.SEED_EMPLOYEE_EMAIL || 'employee@lms.local',
  SEED_EMPLOYEE_PASSWORD: process.env.SEED_EMPLOYEE_PASSWORD || 'Employee@123'
};

const isProduction = env.NODE_ENV === 'production';

// Fail fast on missing critical configuration.
const REQUIRED = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED.filter((key) => !env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
      'Set them in your .env file before starting the server.'
  );
}

// In production, refuse to boot with a weak/placeholder JWT secret.
if (isProduction && env.JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be at least 32 characters in production. ' +
      'Generate a strong secret and set it in the environment.'
  );
}

module.exports = env;
