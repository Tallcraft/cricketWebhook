/* eslint-disable no-underscore-dangle */
import log4js from 'log4js';
import fetch from 'node-fetch';
import Ticket from './Ticket';

const fs = require('fs');
const url = require('url');

const logger = log4js.getLogger();

const LAST_TICKET_FILE = '.lastTicketId';

export default class CricketWebhook {
  /**
   * @param {Object} db - Knex database object
   * @param {String} webhookUrl - URL of webhook endpoint to send tickets to
   * @param {String} ticketWebUrl - Base URL of ticket webinterface
   */
  constructor(db, webhookUrl, ticketWebUrl) {
    this.db = db;
    this.webhookUrl = url.parse(webhookUrl);
    this.ticketWebUrl = url.parse(ticketWebUrl);

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

  /**
   * Fetch new tickets and send them to the webhook
   * @returns {Promise<any>}
   */
  check() {
    return new Promise((resolve, reject) => {
      this.getTickets()
        .then((tickets) => {
          if (tickets.length === 0) {
            logger.info('No new tickets');
            return Promise.resolve();
          }
          logger.info(`Found ${tickets.length} new tickets`);
          return this.sendTickets(tickets);
        })
        .catch((error) => {
          logger.error(error.message);
          return reject();
        })
        .then(resolve);
    });
  }

  /**
   * Fetch tickets from mySQL server
   * @returns {Promise<any>}
   */
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

          // Resolve with ticket array
          return resolve(tickets);
        })
        .catch(reject);
    });
  }

  /**
   * Send ticket to Discord webhook
   * @param {Array<Ticket>} tickets
   * @returns {Promise<any>}
   */
  sendTickets(tickets) {
    return new Promise((resolve, reject) => {
      logger.debug('sendTicket');
      if (!Array.isArray(tickets) || tickets.some(t => !(t instanceof Ticket))) {
        return reject(new Error('argument tickets must be Ticket array'));
      }

      const body = {
        username: 'Tickets',
        content: tickets.reduce((str, ticket) => `${str + ticket.toString()}\n\n`, ''),
      };

      fetch(this.webhookUrl, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: { 'content-type': 'application/json' },
      }).then((response) => {
        logger.debug('server response', response);
        if (response.ok) {
          if (response.status === 204) {
            return Promise.resolve({});
          }
          return response.json();
        }
        return Promise.reject(new Error(`Server returned status code ${response.status}`));
      })
        .then((jsonReply) => {
          logger.debug('jsonReply', jsonReply);
          logger.debug('Sent tickets');

          // Update last ticket id
          this.lastTicketId = tickets[tickets.length - 1].id;
          return resolve();
        })
        .catch((error) => {
          logger.error('Error while sending tickets to Discord', error.message);
          return reject(error);
        });
    });
  }
}
