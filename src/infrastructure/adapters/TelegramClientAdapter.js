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
  async _withRetries (fn, maxRetries = 3, baseDelay = 1000) {
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
      /**
       *
       */
      message,
    }));
  }

  /**
   * Forward message from one chat to another
   * @param {Object} chatId - Target chat entity atau ID
   * @param {number} messageId - ID of message to forward
   * @param {Object} fromChatId - Source chat entity atau ID
   * @returns {Promise<Object>} Forwarded message result
   */
  async forwardMessage (chatId, messageId, fromChatId) {
    return await this._withRetries(() => this.client.forwardMessages(chatId, {
      messages: [messageId],
      fromPeer: fromChatId
    }));
  }

  /**
   * Send photo to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} photo - Photo file or InputMediaPhoto
   * @param {Object} options - Additional options (caption, etc.)
   * @returns {Promise<Object>} Sent message result
   */
  async sendPhoto (chatId, photo, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, photo, {
      ...options,
      forceDocument: false
    }));
  }

  /**
   * Send video to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} video - Video file or InputMediaVideo
   * @param {Object} options - Additional options (caption, etc.)
   * @returns {Promise<Object>} Sent message result
   */
  async sendVideo (chatId, video, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, video, {
      ...options,
      forceDocument: false
    }));
  }

  /**
   * Send document to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} document - Document file or InputMediaDocument
   * @param {Object} options - Additional options (caption, etc.)
   * @returns {Promise<Object>} Sent message result
   */
  async sendDocument (chatId, document, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, document, {
      ...options,
      forceDocument: true
    }));
  }

  /**
   * Send audio to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} audio - Audio file or InputMediaAudio
   * @param {Object} options - Additional options (caption, etc.)
   * @returns {Promise<Object>} Sent message result
   */
  async sendAudio (chatId, audio, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, audio, {
      ...options,
      forceDocument: false
    }));
  }

  /**
   * Send voice message to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} voice - Voice file
   * @returns {Promise<Object>} Sent message result
   */
  async sendVoice (chatId, voice) {
    return await this._withRetries(() => this.client.sendFile(chatId, voice, {
      voiceNote: true
    }));
  }

  /**
   * Send sticker to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} sticker - Sticker file
   * @returns {Promise<Object>} Sent message result
   */
  async sendSticker (chatId, sticker) {
    return await this._withRetries(() => this.client.sendFile(chatId, sticker));
  }

  /**
   * Send animation (GIF) to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} animation - Animation file
   * @param {Object} options - Additional options (caption, etc.)
   * @returns {Promise<Object>} Sent message result
   */
  async sendAnimation (chatId, animation, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, animation, {
      ...options,
      forceDocument: false
    }));
  }

  /**
   * Send poll to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} poll - Poll object
   * @returns {Promise<Object>} Sent message result
   */
  async sendPoll (chatId, poll) {
    return await this._withRetries(() => this.client.sendMessage(chatId, {
      poll: poll
    }));
  }

  /**
   * Send location to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} geo - Geo point
   * @returns {Promise<Object>} Sent message result
   */
  async sendLocation (chatId, geo) {
    return await this._withRetries(() => this.client.sendMessage(chatId, {
      geo: geo
    }));
  }

  /**
   * Send contact to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} contact - Contact object
   * @returns {Promise<Object>} Sent message result
   */
  async sendContact (chatId, contact) {
    return await this._withRetries(() => this.client.sendMessage(chatId, {
      contact: contact
    }));
  }

  /**
   * Send venue to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Object} venue - Venue object
   * @returns {Promise<Object>} Sent message result
   */
  async sendVenue (chatId, venue) {
    return await this._withRetries(() => this.client.sendMessage(chatId, {
      venue: venue
    }));
  }

  /**
   * Send album (multiple media) to chat
   * @param {Object} chatId - Target chat entity atau ID
   * @param {Array} media - Array of media objects
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Sent message result
   */
  async sendAlbum (chatId, media, options = {}) {
    return await this._withRetries(() => this.client.sendFile(chatId, media, {
      ...options,
      album: true
    }));
  }

  /**
   * Download media file from Telegram
   * @param {Object} media - Media object to download
   * @param {Object} options - Download options (progress callback, etc.)
   * @returns {Promise<Buffer>} Downloaded file buffer
   */
  async downloadMedia (media, options = {}) {
    return await this._withRetries(() => this.client.downloadMedia(media, {
      ...options
    }));
  }

  /**
   * Download media file to specific path
   * @param {Object} media - Media object to download
   * @param {string} filePath - Path to save the file
   * @param {Object} options - Download options
   * @returns {Promise<string>} Path to downloaded file
   */
  async downloadMediaToFile (media, filePath, options = {}) {
    return await this._withRetries(() => this.client.downloadMedia(media, {
      ...options,
      outputFile: filePath
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
