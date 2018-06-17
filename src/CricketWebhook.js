/* eslint-disable no-underscore-dangle */
import log4js from 'log4js';
import Ticket from './Ticket';

const fs = require('fs');

const logger = log4js.getLogger();

const LAST_TICKET_FILE = '.lastTicketId';

export default class CricketWebhook {
  constructor(db, webhookUrl, ticketWebUrl) {
    this.db = db;
    this.webhookUrl = webhookUrl;
    this.ticketWebUrl = ticketWebUrl;

    this._lastTicketId = 0;
    try {
      this._lastTicketId = Number.parseInt(fs.readFileSync(LAST_TICKET_FILE, 'utf8'), 10);
    } catch (err) {
      logger.debug('Could not restore lastTicketId from file. Starting with 0');
    }
    logger.info('Current ticket id', this.lastTicketId);
  }

  get lastTicketId() {
    return this._lastTicketId;
  }

  set lastTicketId(id) {
    fs.writeFileSync(LAST_TICKET_FILE, id);
    this._lastTicketId = id;
  }

  check() {
    return new Promise((resolve, reject) => {
      this.getTickets()
        .then(this.sendTickets)
        .then(resolve)
        .catch((error) => {
          logger.error(error);
          return reject();
        });
    });
  }

  getTickets() {
    // TODO: fetch tickets starting from lastTicketId + 1 from mysql server
    return new Promise((resolve, reject) => {
      logger.debug('getTickets');

      // Build query
      this.db.select().table('titles')
        .join('uuids', 'titles.author', '=', 'uuids.uuid')
        .where('id', '>', this.lastTicketId)
        .options({ nestTables: true })
        // Execute query
        .then((queryResult) => {
          logger.debug('queryResult', queryResult);
          return resolve(queryResult); // TODO: array of ticket objects
        })
        .catch(reject);
    });
  }

  sendTicket(ticket) {
    return new Promise((resolve, reject) => {
      logger.debug('sendTicket');
      return resolve();
    });
  }

  sendTickets(tickets = []) {
    return new Promise((resolve, reject) => {
      logger.debug('sendTickets');
      return resolve();
    });
  }
}
