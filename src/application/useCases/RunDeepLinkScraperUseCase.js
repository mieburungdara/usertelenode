// src/application/useCases/RunDeepLinkScraperUseCase.js
class RunDeepLinkScraperUseCase {
  constructor(scrapingService, ui) {
    this.scrapingService = scrapingService;
    this.ui = ui;
  }

  async execute(account) {
    // Check and get channel cache
    const savedChannels = await this.scrapingService.getAvailableChannels();
    // Filter unique channels by name
    const uniqueChannels = savedChannels.filter((ch, index, arr) =>
      arr.findIndex(c => c.channelName === ch.channelName) === index
    );
    const channelCache = await this.scrapingService.checkChannels(uniqueChannels);

    // Display table
    this.ui.displayChannelTable(channelCache);

    const channelInput = this.ui.getChannelInput();
    const channel = channelInput; // Simplified
    const startId = this.ui.getStartId();
    const results = await this.scrapingService.scrapeChannel(channel, startId);
    this.ui.displayResults(results);
  }
}

module.exports = RunDeepLinkScraperUseCase;