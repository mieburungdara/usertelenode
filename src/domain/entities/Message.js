/**
 * @file Domain entity untuk Message
 * @description Representasi pesan Telegram dalam domain layer
 */
class Message {
  /**
   * Membuat instance Message baru
   * @param {number} id - ID pesan Telegram
   * @param {string|null} text - Konten teks pesan
   * @param {number} timestamp - Timestamp pesan (Unix timestamp)
   */
  constructor (id, text, timestamp) {
    this.id = id;
    this.text = text;
    this.timestamp = timestamp;
  }
}

module.exports = Message;
