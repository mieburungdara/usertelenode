// src/infrastructure/Config.js
/**
 * @file Infrastructure layer untuk konfigurasi aplikasi
 * @description Kelas untuk mengelola konfigurasi aplikasi dari environment variables
 */
class Config {
  /**
   * Membuat instance Config dengan nilai dari environment variables
   */
  constructor () {
    this.telegramApiId = process.env.TELEGRAM_API_ID;
    this.telegramApiHash = process.env.TELEGRAM_API_HASH;
    // Other configs
  }
}

module.exports = Config;
