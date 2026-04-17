/**
 * @file Domain service untuk auto reply
 * @description Interface dan implementasi untuk menangani pesan masuk dan memberikan balasan otomatis
 */

/**
 * @typedef {Object} Message
 * @property {string} text - Konten teks pesan
 * @property {Object} chatId - ID chat pengirim
 */

/**
 * Interface untuk reply service
 * @interface IReplyService
 */
class IReplyService {
  /**
   * Memproses pesan masuk dan memberikan balasan
   * @param {Message} _message - Pesan yang diterima
   * @returns {Promise<void>}
   */
  async processMessage (_message) { throw new Error('Not implemented'); }
}

/**
 * Implementasi service untuk auto reply
 * @implements {IReplyService}
 */
class ReplyService {
  /**
   * Membuat instance ReplyService
   * @param {ITelegramClient} telegramClient - Client Telegram untuk mengirim pesan
   */
  constructor (telegramClient) {
    this.telegramClient = telegramClient;
  }

  /**
   * Memproses pesan dan memberikan balasan otomatis
   * @param {Message} message - Pesan yang akan diproses
   * @returns {Promise<void>}
   */
  async processMessage (message) {
    // Core reply logic
    if (message.text.includes('hello')) {
      await this.telegramClient.sendMessage(message.chatId, {
        message: 'Hi there!',
      });
    }
  }
}

module.exports = {
  /**
   *
   */
  ReplyService,
  /**
   *
   */
  IReplyService,
};
