const winston = require("winston");
const { Logtail } = require("@logtail/node");
const { LogtailTransport } = require("@logtail/winston");
const isDevelopment = process.env.NODE_ENV !== 'production'

// Create a Logtail client
const logtail = new Logtail("qjrFhzVc3B4PoQB791o9Qn8S");

// Create a Winston logger - passing in the Logtail transport
const logger = winston.createLogger({
  transports: isDevelopment ? [
    new winston.transports.Console({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ] : [new LogtailTransport(logtail)],
});

export default logger