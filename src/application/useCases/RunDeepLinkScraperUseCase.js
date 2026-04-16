// src/application/useCases/RunDeepLinkScraperUseCase.js
class RunDeepLinkScraperUseCase {
  constructor(scrapingService, ui) {
    this.scrapingService = scrapingService;
    this.ui = ui;
  }

  async execute(account) {
    // Display available channels from history
    const channels = await this.scrapingService.getAvailableChannels(); // Need to add this
    this.ui.displayChannels(channels);

    const channelInput = this.ui.getChannelInput();
    const channel = channelInput; // Simplified
    const startId = this.ui.getStartId();
    const results = await this.scrapingService.scrapeChannel(channel, startId);
    this.ui.displayResults(results);
  }
}

module.exports = RunDeepLinkScraperUseCase;