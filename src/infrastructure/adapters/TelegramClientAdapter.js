// src/infrastructure/adapters/TelegramClientAdapter.js
// Interface: ITelegramClient
/**
 *
 */
class ITelegramClient {
  /**
   *
   * @param channel
   */
  async getEntity (channel) { throw new Error('Not implemented'); }
  /**
   *
   * @param channel
   * @param options
   */
  async getMessages (channel, options) { throw new Error('Not implemented'); }
  /**
   *
   * @param chatId
   * @param message
   */
  async sendMessage (chatId, message) { throw new Error('Not implemented'); }
}

/**
 *
 */
class TelegramClientAdapter {
  /**
   *
   * @param client
   */
  constructor (client) {
    this.client = client;
  }

  /**
   * Helper: Execute API call with retries and timeout
   * @param {Function} fn - Async function to execute
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} baseDelay - Base delay in ms between retries
   * @returns {Promise<any>} Result of the function
   */
  async _withRetries(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⚠️ API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  }

  /**
   * Mengambil entity dari Telegram dengan retry mechanism
   * @param {string|number} channel - Nama channel (@channelname) atau ID numeric
   * @returns {Promise<Object>} Entity object
   */
  async getEntity (channel) {
    return await this._withRetries(() => this.client.getEntity(channel));
  }

  /**
   * Mengambil pesan dari Telegram dengan retry mechanism
   * @param {Object} channel - Channel entity
   * @param {Object} options - Opsi getMessages
   * @returns {Promise<Object[]>} Array pesan
   */
  async getMessages (channel, options) {
    return await this._withRetries(() => this.client.getMessages(channel, options));
  }

  /**
   * Mengirim pesan ke Telegram dengan retry mechanism
   * @param {Object} chatId - Chat entity atau ID
   * @param {string} message - Pesan yang akan dikirim
   * @returns {Promise<Object>} Hasil pengiriman
   */
  async sendMessage (chatId, message) {
    return await this._withRetries(() => this.client.sendMessage(chatId, {
      message,
    }));
  }
}

module.exports = { /**
 *
 */
  TelegramClientAdapter, /**
 *
 */
  ITelegramClient,
};
