import chalk from 'chalk';
import log4js from 'log4js';

// Setup logger
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    file: { type: 'file', filename: 'server.log' },
  },
  categories: {
    default: {
      appenders: ['out', 'file'],
      level: process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG',
    },
  },
});

// Get logger object
const logger = log4js.getLogger();

// Get ticket check interval in seconds (defaults to 1 minute)
const interval = process.env.CHECK_INTERVAL || 60;

logger.debug('HELLO WORLD');
