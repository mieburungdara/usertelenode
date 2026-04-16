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
    const num = parseInt(channelInput);
    if (num >= 1 && num <= finalChannelCache.length) {
      const selectedChannel = finalChannelCache[num - 1];
      const channel = selectedChannel.channelName;
      // Default start: last scraped ID, end: last message ID
      const startId = selectedChannel.lastScrapedId || 0;
      const endId = selectedChannel.lastMessageId || 0;
      const results = await this.scrapingService.scrapeChannel(channel, startId, endId);
      this.ui.displayResults(results);

      // Generate simple report
      if (results.deepLinks.length > 0) {
        console.log('\n📄 Laporan Deep Links:');
        console.log(`Channel: ${channel}`);
        console.log(`Total Messages: ${results.messages}`);
        console.log(`Deep Links Found: ${results.deepLinks.length}`);
        console.log('Sample Links:');
        results.deepLinks.slice(0, 10).forEach(link => console.log(`- ${link.link} (Msg ID: ${link.messageId})`));
      }
    } else {
      console.log('❌ Nomor channel tidak valid.');
    }
  }
}

module.exports = RunDeepLinkScraperUseCase;