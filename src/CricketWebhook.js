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
    logger.info('Last ticket id', this.lastTicketId);
  }

  get lastTicketId() {
    return this._lastTicketId;
  }

  set lastTicketId(id) {
    if (Number.isInteger(id)) {
      fs.writeFileSync(LAST_TICKET_FILE, id);
      this._lastTicketId = id;
    } else {
      logger.warn('set lastTicketID: Invalid id, refusing to set');
    }
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
    // fetch tickets starting from lastTicketId + 1 from mysql server
    return new Promise((resolve, reject) => {
      logger.debug('getTickets');

      const tickets = [];

      // Build query
      this.db
        .select('id', 'timestamp', 'to as message', 'name as author')
        .table('titles')
        .join('uuids', 'titles.author', '=', 'uuids.uuid')
        .where('id', '>', this.lastTicketId)
        .orderBy('id')
        // Execute query
        .then((queryResult) => {
          queryResult.forEach((ticketRaw) => {
            logger.debug('ticketRaw', ticketRaw);
            const t = new Ticket(
              ticketRaw.id,
              ticketRaw.message,
              ticketRaw.author,
              ticketRaw.timestamp,
              this.ticketWebUrl,
            );
            tickets.push(t);
          });
          logger.debug('new tickets from db', tickets);

          // Update last ticket id
          if (tickets.length > 0) {
            this.lastTicketId = tickets[tickets.length - 1].id;
          }

          // Resolve with ticket array
          return resolve(tickets);
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
