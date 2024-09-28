import logger from "../utils/logger";

require('dotenv').config({})

import Redis from "ioredis";
import process from "process";

const redisClient = new Redis(process.env.REDIS_URI as string, {
  maxRetriesPerRequest: null
})

redisClient.on('connect', () => {
  logger.info('Redis server connected');
});

redisClient.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

export default redisClient;