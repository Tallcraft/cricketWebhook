/* eslint-disable no-underscore-dangle */
import log4js from 'log4js';

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
    return new Promise((resolve) => {
      this.getTickets()
        .then(this.sendTickets)
        .then(resolve)
        .catch((error) => {
          logger.error(error);
        });
    });
  }

  getTickets() {
    // TODO: fetch tickets starting from lastTicketId + 1 from mysql server
    return new Promise((resolve, reject) => {
      logger.debug('getTickets');
      return resolve();
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
