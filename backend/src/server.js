const http = require('http');
const mongoose = require('mongoose');
const env = require('./config/env');
const logger = require('./utils/logger');
const app = require('./app');
const { connectRedis, redisClient } = require('./config/redis');
const initializeSockets = require('./sockets');

// Configure Mongoose (strictQuery to suppress deprecation warnings)
mongoose.set('strictQuery', false);

const server = http.createServer(app);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(env.MONGO_URI);
    logger.info('Connected to MongoDB');

    // Connect to Redis
    await connectRedis();

    // Initialize Socket.io
    const io = initializeSockets(server);

    // Initialize Kafka Event Sourcing (runs asynchronously so brokers don't block boots)
    const { initKafka } = require('./services/kafka.service');
    initKafka(io).catch(err => logger.error(`❌ Kafka Event Sourcing engine startup failed: ${err.message}`));

    server.listen(env.PORT, () => {
      logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
  } catch (error) {
    console.error(error);
    logger.error(`Server startup failed: ${error.stack || error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle graceful shutdown
const shutdown = () => {
  logger.info('Graceful shutdown initiated...');
  server.close(async () => {
    logger.info('HTTP server closed.');
    await mongoose.connection.close();
    logger.info('MongoDB connection closed.');
    if (redisClient.isOpen) {
      await redisClient.quit();
      logger.info('Redis connection closed.');
    }
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
