// src/application/useCases/RunDeepLinkScraperUseCase.js
class RunDeepLinkScraperUseCase {
  constructor(scrapingService, ui) {
    this.scrapingService = scrapingService;
    this.ui = ui;
  }

  async execute(account) {
    const channelInput = await this.ui.getChannelInput();
    const channel = await this.ui.selectChannel(channelInput); // Simplified
    const startId = await this.ui.getStartId();
    const results = await this.scrapingService.scrapeChannel(channel, startId);
    this.ui.displayResults(results);
  }
}

module.exports = RunDeepLinkScraperUseCase;