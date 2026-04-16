// src/application/useCases/RunDeepLinkScraperUseCase.js
class RunDeepLinkScraperUseCase {
  constructor(scrapingService, ui) {
    this.scrapingService = scrapingService;
    this.ui = ui;
  }

  async execute(account) {
    // Check and get channel cache
    const savedChannels = await this.scrapingService.getAvailableChannels();
    // Filter unique channels by normalized name
    const uniqueChannels = savedChannels.filter((ch, index, arr) =>
      arr.findIndex(c => c.channelName.trim().toLowerCase() === ch.channelName.trim().toLowerCase()) === index
    );
    const channelCache = await this.scrapingService.checkChannels(uniqueChannels);

    // Filter unique by normalized channelName after check
    const finalChannelCache = channelCache.filter((ch, index, arr) =>
      arr.findIndex(c => c.channelName.trim().toLowerCase() === ch.channelName.trim().toLowerCase()) === index
    );

    // Display table
    this.ui.displayChannelTable(finalChannelCache);

    const channelInput = this.ui.getChannelInput();
    const channel = channelInput; // Simplified
    const startId = this.ui.getStartId();
    const results = await this.scrapingService.scrapeChannel(channel, startId);
    this.ui.displayResults(results);
  }
}

module.exports = RunDeepLinkScraperUseCase;