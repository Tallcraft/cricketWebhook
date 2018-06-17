import log4js from 'log4js';
import knex from 'knex';
import CricketWebhook from './CricketWebhook';

const fs = require('fs');
// Read config file to variable
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

const defaultLogLevel = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';

// Setup logger
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    file: { type: 'file', filename: 'server.log' },
  },
  categories: {
    default: {
      appenders: ['out'],
      level: defaultLogLevel,
    },
    queryLogger: {
      appenders: ['out'],
      level: defaultLogLevel,
    },
  },
});

// Get logger object
const logger = log4js.getLogger();
const queryLogger = log4js.getLogger('queryLogger');

// Get ticket check interval in seconds (defaults to 1 minute)
const interval = (config.checkInterval || 60) * 1000;

// Setup DB connection
const db = knex({
  client: 'mysql',
  connection: {
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
  },
});

// Log mysql queries
db.on('query', (q) => {
  queryLogger.debug(q.sql);
});

// Test mysql connection
db.raw('select 1+1 as result')
  .catch((error) => {
    logger.error('mySQL connection failed, check your db configuration');
    logger.trace(error);
    process.exit(1);
  });

// Start application
logger.info('CricketWebhook');
logger.info(`Checking database '${config.db.database}' every ${config.checkInterval} seconds.`);

const cricketWebhook = new CricketWebhook(db, config.webhookUrl, config.ticketWebUrl);

// TODO: promise chain instead of plain setInterval
cricketWebhook.check(); // Initial call
setInterval(() => cricketWebhook.check(), interval);
// FIXME: handle promise rejection

