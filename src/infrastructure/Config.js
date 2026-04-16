// src/infrastructure/Config.js
class Config {
  constructor() {
    this.telegramApiId = process.env.TELEGRAM_API_ID;
    this.telegramApiHash = process.env.TELEGRAM_API_HASH;
    // Other configs
  }
}

module.exports = Config;