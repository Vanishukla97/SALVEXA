const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'salvexa',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'please_change_this_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    rememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || '30d',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    prescriptionModel: process.env.OPENAI_PRESCRIPTION_MODEL || process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    timeoutMs: Number(process.env.OPENAI_TIMEOUT_MS || 12000),
    lowConfidenceThreshold: Number(process.env.AI_LOW_CONFIDENCE_THRESHOLD || 0.65),
    visionMaxImageBytes: Number(process.env.OPENAI_VISION_MAX_IMAGE_BYTES || 6 * 1024 * 1024),
  },
  terms: {
    currentVersion: process.env.TERMS_VERSION || 'v1.0',
  },
};

module.exports = env;
