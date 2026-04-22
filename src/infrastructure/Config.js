// src/infrastructure/Config.js
const fs = require('fs');
const path = require('path');

/**
 * @file Infrastructure layer untuk konfigurasi aplikasi
 * @description Kelas untuk mengelola konfigurasi aplikasi dari environment variables dan file config
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

  /**
   * Load chat synchronization configuration
   * @returns {Object} Chat sync configuration object
   */
  getChatSyncConfig () {
    // Default configuration
    const defaultConfig = {
      /**
       *
       */
      enabled: false,
      /**
       *
       */
      sourceChatId: null,
      /**
       *
       */
      targetChatId: null,
      /**
       *
       */
      sourceChatType: 'channel',
      /**
       *
       */
      targetChatType: 'channel',
      /**
       *
       */
      syncIntervalSeconds: 30,
      /**
       *
       */
      batchSize: 10,
      /**
       *
       */
      includeMedia: true,
      /**
       *
       */
      preserveTimestamps: false,
      /**
       *
       */
      retryAttempts: 3,
      /**
       *
       */
      rateLimitDelayMs: 1000,
      /**
       *
       */
      maxMessageAgeHours: 24,
      /**
       *
       */
      excludedMessageTypes: [],
      /**
       *
       */
      logLevel: 'info',
    };

    try {
      // Try to load from config file if it exists
      const configPath = path.join(process.cwd(), 'data', 'chat_sync_config.json');

      if (fs.existsSync(configPath)) {
        const fileContent = fs.readFileSync(configPath, 'utf8');
        if (fileContent && fileContent.trim()) {
          const fileConfig = JSON.parse(fileContent);
          return { ...defaultConfig, ...fileConfig };
        }
      }
    } catch (error) {
      console.warn('Warning: Could not load chat sync config file, using defaults:', error.message);
    }

    return defaultConfig;
  }

  /**
   * Save chat synchronization configuration
   * @param {Object} config - Configuration object to save
   */
  saveChatSyncConfig (config) {
    if (!config || typeof config !== 'object') {
      throw new Error('Config must be a valid object');
    }

    try {
      const configDir = path.join(process.cwd(), 'data');

      // Ensure data directory exists
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { /**
         *
         */
          recursive: true,
        });
      }

      const configPath = path.join(configDir, 'chat_sync_config.json');
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving chat sync config:', error.message);
      throw error;
    }
  }
}

module.exports = Config;
