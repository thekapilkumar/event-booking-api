const winston = require('winston');

// create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //transport is used to define how log messages are handled by the logger
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

exports.logger=logger;