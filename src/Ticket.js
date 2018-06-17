export default class Ticket {
  constructor(id, message, author, timestamp, ticketWebUrl) {
    this.id = id;
    this.message = message;
    this.author = author;
    this.timestamp = new Date(timestamp);
    this.ticketWebUrl = ticketWebUrl; // FIXME: should be static
  }

  get url() {
    return this.ticketWebUrl + this.id;
  }

  toDiscordPayload() {
    return JSON.stringify({
      username: `Ticket #${this.id}`,
      content: `**${this.author}:** ${this.message}\n${this.url}`,
    });
  }
}
