// src/application/useCases/RunDeepLinkScraperUseCase.js
class RunDeepLinkScraperUseCase {
  constructor(scrapingService, botInteractionService, ui) {
    this.scrapingService = scrapingService;
    this.botInteractionService = botInteractionService;
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
    const num = parseInt(channelInput);
    if (num >= 1 && num <= finalChannelCache.length) {
      const selectedChannel = finalChannelCache[num - 1];
      const channel = selectedChannel.channelName;
      // Get range from user
      const startId = parseInt(this.ui.getStartId()) || (selectedChannel.lastScrapedId + 1) || 1;
      const endId = parseInt(this.ui.getEndId()) || selectedChannel.lastMessageId || startId + 100;
      const results = await this.scrapingService.scrapeChannel(channel, startId, endId, this.botInteractionService);
      this.ui.displayResults(results);
    } else {
      console.log('❌ Nomor channel tidak valid.');
    }
  }
}

module.exports = RunDeepLinkScraperUseCase;