export default class Ticket {
  /**
   * @param {Number} id - Ticket ID
   * @param {String} message - Ticket body
   * @param {String} author - Name of player who created the ticket
   * @param {String|Date} timestamp - Time when ticket was created
   * @param {String} ticketWebUrl - Base URL to ticket web panel
   */
  constructor(id, message, author, timestamp, ticketWebUrl) {
    this.id = id;
    this.message = message;
    this.author = author;
    this.timestamp = timestamp instanceof Date ? timestamp : new Date(timestamp);
    this.ticketWebUrl = ticketWebUrl; // FIXME: should be static
  }

  /**
   * Get URL to ticket in webinterface
   * @returns {String}
   */
  get url() {
    return this.ticketWebUrl.toString() + this.id;
  }

  /**
   * Convert ticket object to string compatible with discord webhook
   * @returns {String}
   */
  toDiscordPayload() {
    return JSON.stringify({
      username: `Ticket #${this.id}`,
      content: `**${this.author}:** ${this.message}\n${this.url}`,
    });
  }
}
