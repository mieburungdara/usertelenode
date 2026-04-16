// src/infrastructure/repositories/ScrapingHistoryRepository.js
// Interface: IScrapingHistoryRepository
class IScrapingHistoryRepository {
  async saveHistory(channel, startId, endId) { throw new Error('Not implemented'); }
  async getLastScrapedId(channel) { throw new Error('Not implemented'); }
}

class ScrapingHistoryRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async saveHistory(channel, startId, endId) {
    const history = await this.storage.load('scraping_history') || { channels: {} };
    const key = channel.replace('@', '');
    if (!history.channels[key]) {
      history.channels[key] = { channelName: channel, lastScrapedId: endId, lastScrapedAt: new Date().toISOString() };
    } else {
      history.channels[key].lastScrapedId = endId;
      history.channels[key].lastScrapedAt = new Date().toISOString();
    }
    await this.storage.save('scraping_history', history);
  }

  async getLastScrapedId(channel) {
    const history = await this.storage.load('scraping_history') || { channels: {} };
    const key = getChannelKey(channel);
    return history.channels[key]?.lastScrapedId || null;
  }

  async getAllChannels() {
    const history = await this.storage.load('scraping_history') || { channels: {} };
    return Object.values(history.channels);
  }
}

module.exports = { ScrapingHistoryRepository, IScrapingHistoryRepository };