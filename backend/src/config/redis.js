const { createClient } = require('redis');
const env = require('./env');
const logger = require('../utils/logger');

// Create Redis Client
const redisClient = createClient({
  url: env.REDIS_URI || 'redis://localhost:6379' // Default fallback for local dev without .env
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('🚀 Connected to Redis'));

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};

module.exports = {
  redisClient,
  connectRedis
};
