/**
 * @file Domain entity untuk Channel
 * @description Representasi channel Telegram dalam domain layer
 */
class Channel {
  /**
   * Membuat instance Channel baru
   * @param {string} id - ID channel Telegram
   * @param {string} name - Nama channel (@channelname)
   * @param {number|null} lastMessageId - ID pesan terakhir yang diproses
   * @param {string|null} lastMessageTimestamp - Timestamp pesan terakhir (ISO string)
   */
  constructor (id, name, lastMessageId = null, lastMessageTimestamp = null) {
    this.id = id;
    this.name = name;
    this.lastMessageId = lastMessageId;
    this.lastMessageTimestamp = lastMessageTimestamp;
  }

  /**
   * Mengecek apakah ada pesan baru sejak terakhir diproses
   * @param {number} latestId - ID pesan terbaru dari channel
   * @returns {boolean} True jika ada pesan baru
   */
  hasNewMessages (latestId) {
    return latestId > this.lastMessageId;
  }
}

module.exports = Channel;
