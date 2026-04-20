// src/infrastructure/repositories/ScrapingHistoryRepository.js
// Interface: IScrapingHistoryRepository
/**
 *
 */
class IScrapingHistoryRepository {
  /**
   *
   * @param channel
   * @param startId
   * @param endId
   */
  async saveHistory (channel, startId, endId) { throw new Error('Not implemented'); }
  /**
   *
   * @param channel
   */
  async getLastScrapedId (channel) { throw new Error('Not implemented'); }
}

/**
 *
 */
class ScrapingHistoryRepository {
  /**
   *
   * @param storage
   */
  constructor (storage) {
    this.storage = storage;
    this.writeLocks = new Map(); // Prevent race condition
  }
  
  /**
   * Generate normalized, case-insensitive key for channel
   * @param {string|number} channel - Channel name or ID
   * @returns {string} Normalized key
   * @private
   */
  _getChannelKey (channel) {
    if (typeof channel === 'number') {
      return String(channel);
    }
    return channel.replace('@', '').trim().toLowerCase();
  }

  /**
   *
   * @param channel
   * @param startId
   * @param endId
   */
  async saveHistory (channel, startId, endId) {
    const key = this._getChannelKey(channel);
    
    // Prevent race condition with write lock
    if (this.writeLocks.has(key)) {
      await this.writeLocks.get(key);
    }
    
    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.writeLocks.set(key, lockPromise);
    
    try {
      const history = await this.storage.load('scraping_history') || {
        channels: {},
      };
      
      if (!history.channels[key]) {
        history.channels[key] = {
          channelName: channel,
          lastScrapedId: endId,
          lastScrapedAt: new Date().toISOString(),
          scrapingSessions: [],
          totalLinksFound: 0,
          totalMessagesScraped: 0,
        };
      } else {
        history.channels[key].lastScrapedId = endId;
        history.channels[key].lastScrapedAt = new Date().toISOString();
      }
      
      await this.storage.save('scraping_history', history);
    } finally {
      resolveLock();
      this.writeLocks.delete(key);
    }
  }

  /**
   *
   * @param channel
   */
  async getLastScrapedId (channel) {
    const history = await this.storage.load('scraping_history') || {
      channels: {},
    };
    const key = this._getChannelKey(channel);
    return history.channels[key]?.lastScrapedId || null;
  }

  /**
   *
   */
  async getAllChannels () {
    const history = await this.storage.load('scraping_history') || {
      channels: {},
    };
    const channels = Object.values(history.channels);
    // Filter valid channels and remove duplicates by NORMALIZED name
    return channels.filter(ch => ch && ch.channelName && String(ch.channelName).trim() !== '')
      .filter((ch, index, arr) => 
        arr.findIndex(c => this._getChannelKey(c.channelName) === this._getChannelKey(ch.channelName)) === index
      );
  }

  /**
   *
   * @param channelName
   * @param lastMessageId
   * @param lastMessageTimestamp
   * @param channelTitle
   */
  async updateLastMessageId (channelName, lastMessageId, lastMessageTimestamp, channelTitle) {
    const key = this._getChannelKey(channelName);
    
    // Prevent race condition with write lock
    if (this.writeLocks.has(key)) {
      await this.writeLocks.get(key);
    }
    
    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.writeLocks.set(key, lockPromise);
    
    try {
      const history = await this.storage.load('scraping_history') || {
        channels: {},
      };

      if (!history.channels[key]) {
        history.channels[key] = {
          channelName,
          channelTitle,
          lastScrapedId: null,
          lastScrapedAt: null,
          lastMessageId,
          lastMessageTimestamp,
          lastCheckedAt: new Date().toISOString(),
          scrapingSessions: [],
          totalLinksFound: 0,
          totalMessagesScraped: 0,
        };
      } else {
        if (channelTitle) { history.channels[key].channelTitle = channelTitle; }
        history.channels[key].lastMessageId = lastMessageId;
        history.channels[key].lastMessageTimestamp = lastMessageTimestamp;
        history.channels[key].lastCheckedAt = new Date().toISOString();
      }

      await this.storage.save('scraping_history', history);
    } finally {
      resolveLock();
      this.writeLocks.delete(key);
    }
  }

  /**
   * Menambahkan channel baru ke history
   * @param {string|number} channel - Nama channel (@channelname) atau ID numeric
   * @param {string} title - Judul channel
   * @returns {Promise<boolean>} True jika berhasil ditambahkan, false jika sudah ada
   */
  async addChannel (channel, title) {
    const key = this._getChannelKey(channel);
    
    // Prevent race condition with write lock
    if (this.writeLocks.has(key)) {
      await this.writeLocks.get(key);
    }
    
    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.writeLocks.set(key, lockPromise);
    
    try {
      const history = await this.storage.load('scraping_history') || {
        channels: {},
      };

      if (history.channels[key]) {
        // Channel sudah ada
        if (title && !history.channels[key].channelTitle) {
          history.channels[key].channelTitle = title;
          await this.storage.save('scraping_history', history);
        }
        return false;
      }

      history.channels[key] = {
        channelName: channel,
        channelTitle: title || channel,
        lastScrapedId: null,
        lastScrapedAt: null,
        lastMessageId: null,
        lastMessageTimestamp: null,
        lastCheckedAt: null,
        totalLinksFound: 0,
        totalMessagesScraped: 0,
        scrapingSessions: [],
      };

      await this.storage.save('scraping_history', history);
      return true;
    } finally {
      resolveLock();
      this.writeLocks.delete(key);
    }
  }

  /**
   * Menambahkan log hasil sesi scraping untuk channel tertentu
   * @param {string|number} channelName - Nama channel (@channelname) atau ID numeric
   * @param {Object} sessionData - Objek berisi { date, startId, endId, processed, linksFound, noLinks, deleted, interactions }
   */
  async addScrapingSession (channelName, sessionData) {
    if (!sessionData || typeof sessionData !== 'object') {
      throw new Error('Session data must be a valid object');
    }
    
    const key = this._getChannelKey(channelName);
    
    // Prevent race condition with write lock
    if (this.writeLocks.has(key)) {
      await this.writeLocks.get(key);
    }
    
    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.writeLocks.set(key, lockPromise);
    
    try {
      const history = await this.storage.load('scraping_history') || {
        channels: {},
      };

      if (history.channels[key]) {
        // Inisialisasi properti jika merupakan channel lawas yang belum punya atribut baru ini
        if (!Array.isArray(history.channels[key].scrapingSessions)) {
          history.channels[key].scrapingSessions = [];
        }
        if (typeof history.channels[key].totalLinksFound !== 'number') {
          history.channels[key].totalLinksFound = 0;
        }
        if (typeof history.channels[key].totalMessagesScraped !== 'number') {
          history.channels[key].totalMessagesScraped = 0;
        }

        history.channels[key].scrapingSessions.push(sessionData);
        
        // PREVENT MEMORY LEAK: Keep only last 100 sessions
        if (history.channels[key].scrapingSessions.length > 100) {
          history.channels[key].scrapingSessions = 
            history.channels[key].scrapingSessions.slice(-100);
        }
        
        history.channels[key].totalLinksFound += (sessionData.linksFound || 0);
        history.channels[key].totalMessagesScraped += (sessionData.processed || 0);

        await this.storage.save('scraping_history', history);
      }
    } finally {
      resolveLock();
      this.writeLocks.delete(key);
    }
  }
}

module.exports = { /**
 *
 */
  ScrapingHistoryRepository, /**
 *
 */
  IScrapingHistoryRepository,
};
