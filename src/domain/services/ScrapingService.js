// src/domain/services/ScrapingService.js
// Interface: IScrapingService
class IScrapingService {
  async scrapeChannel(channel, startId) { throw new Error('Not implemented'); }
}

class ScrapingService {
  constructor(telegramClient, historyRepo) {
    this.telegramClient = telegramClient;
    this.historyRepo = historyRepo;
  }

  async scrapeChannel(channel, startId) {
    // Core scraping logic
    const messages = await this.telegramClient.getMessages(channel, { limit: 100, offsetId: startId });
    const deepLinks = messages.filter(msg => msg.text && msg.text.includes('t.me/'));
    // Update history
    await this.historyRepo.saveHistory(channel, startId, messages[messages.length - 1]?.id || startId);
    return { messages: messages.length, deepLinks: deepLinks.length };
  }

  async getAvailableChannels() {
    return await this.historyRepo.getAllChannels();
  }
}

module.exports = { ScrapingService, IScrapingService };