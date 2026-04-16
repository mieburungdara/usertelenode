// src/domain/services/ReplyService.js
// Interface: IReplyService
class IReplyService {
  async processMessage(message) { throw new Error('Not implemented'); }
}

class ReplyService {
  constructor(telegramClient) {
    this.telegramClient = telegramClient;
  }

  async processMessage(message) {
    // Core reply logic
    if (message.text.includes('hello')) {
      await this.telegramClient.sendMessage(message.chatId, { message: 'Hi there!' });
    }
  }
}

module.exports = { ReplyService, IReplyService };