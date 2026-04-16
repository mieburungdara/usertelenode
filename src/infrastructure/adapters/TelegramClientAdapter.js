// src/infrastructure/adapters/TelegramClientAdapter.js
// Interface: ITelegramClient
class ITelegramClient {
  async getEntity(channel) { throw new Error('Not implemented'); }
  async getMessages(channel, options) { throw new Error('Not implemented'); }
  async sendMessage(chatId, message) { throw new Error('Not implemented'); }
}

class TelegramClientAdapter {
  constructor(client) {
    this.client = client;
  }

  async getEntity(channel) {
    return await this.client.getEntity(channel);
  }

  async getMessages(channel, options) {
    return await this.client.getMessages(channel, options);
  }

  async sendMessage(chatId, message) {
    return await this.client.sendMessage(chatId, message);
  }
}

module.exports = { TelegramClientAdapter, ITelegramClient };