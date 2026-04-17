/**
 * @file Application use case untuk menjalankan deep link scraper
 * @description Orchestrator untuk proses scraping channel dengan interaksi bot otomatis
 */
class RunDeepLinkScraperUseCase {
  /**
   * Membuat instance RunDeepLinkScraperUseCase
   * @param {IScrapingService} scrapingService - Service untuk scraping channel
   * @param {IBotInteractionService} botInteractionService - Service untuk interaksi bot
   * @param {IUI} ui - Interface untuk interaksi user
   */
  constructor (scrapingService, botInteractionService, ui) {
    this.scrapingService = scrapingService;
    this.botInteractionService = botInteractionService;
    this.ui = ui;
  }

  /**
   * Menjalankan proses deep link scraping untuk akun tertentu
   * @param {Account} _account - Akun Telegram yang akan digunakan untuk scraping
   * @returns {Promise<void>}
   */
  async execute (_account) {
    // Check and get channel cache
    const savedChannels = await this.scrapingService.getAvailableChannels();
    // Filter unique channels by normalized name (handle both string and numeric IDs)
    const uniqueChannels = savedChannels.filter((ch, index, arr) =>
      arr.findIndex(c => String(c.channelName).trim().toLowerCase() === String(ch.channelName).trim().toLowerCase()) === index,
    );
    const channelCache = await this.scrapingService.checkChannels(uniqueChannels);

    // Filter unique by normalized channelName after check (handle both string and numeric IDs)
    const finalChannelCache = channelCache.filter((ch, index, arr) =>
      arr.findIndex(c => String(c.channelName).trim().toLowerCase() === String(ch.channelName).trim().toLowerCase()) === index,
    );

    // Display table
    this.ui.displayChannelTable(finalChannelCache);

    console.log('');
    console.log('📋 Pilihan:');
    console.log('────────────────────────────────');
    console.log('  • Masukkan nomor channel (1-' + finalChannelCache.length + ') untuk scraping');
    console.log('  • Atau ketik username/ID channel baru langsung untuk menambahkannya');
    console.log('');

    const channelInput = this.ui.getChannelInput().trim();
    
    if (!channelInput) {
      console.log('❌ Input kosong dibatalkan.');
      return;
    }

    const num = parseInt(channelInput);
    // Bedakan antara nomor urut pilihan (1,2,3...) dan ID numeric channel asli (-100123456789)
    if (!isNaN(num) && num >= 1 && num <= finalChannelCache.length && String(num) === channelInput) {
      const selectedChannel = finalChannelCache[num - 1];
      const channel = selectedChannel.channelName;
      // Suggest last scraped +1 for start, last message ID for end
      const suggestedStart = (selectedChannel.lastScrapedId !== null && selectedChannel.lastScrapedId !== undefined ? selectedChannel.lastScrapedId + 1 : 1);
      const suggestedEnd = selectedChannel.lastMessageId || (suggestedStart + 100);
      // Get range from user with suggestions
      const startIdInput = this.ui.getStartId(suggestedStart);
      const endIdInput = this.ui.getEndId(suggestedEnd);
      const startId = parseInt(startIdInput) || suggestedStart;
      const endId = parseInt(endIdInput) || suggestedEnd;
      const results = await this.scrapingService.scrapeChannel(channel, startId, endId, this.botInteractionService);
      this.ui.displayResults(results);
    } else {
      // Cek apakah inputnya merupakan link pesan spesifik (baik public maupun private)
      const privateMsgUrlMatch = channelInput.match(/(?:https?:\/\/)?t\.me\/c\/(\d+)\/(\d+)/i);
      const publicMsgUrlMatch = channelInput.match(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]+)\/(\d+)/i);
      
      let targetChannelStr = null;
      let startId = null;

      if (privateMsgUrlMatch) {
         targetChannelStr = parseInt(`-100${privateMsgUrlMatch[1]}`, 10);
         startId = parseInt(privateMsgUrlMatch[2], 10);
      } else if (publicMsgUrlMatch && publicMsgUrlMatch[1].toLowerCase() !== 'c') {
         targetChannelStr = '@' + publicMsgUrlMatch[1];
         startId = parseInt(publicMsgUrlMatch[2], 10);
      }

      if (targetChannelStr) {
        console.log(`\n🔗 Tautan pesan terdeteksi!`);
        console.log(`📌 Mempersiapkan channel ${targetChannelStr} untuk ditarik...`);
        
        // Daftarkan channel jika belum ada
        await this.scrapingService.addChannel(targetChannelStr);
        
        // Dapatkan update ID terakhir pada channel tersebut
        console.log(`🌐 Mengambil informasi pesan terbaru dari ${targetChannelStr}...`);
        const checks = await this.scrapingService.checkChannels([{ channelName: targetChannelStr }]);
        const endId = (checks.length > 0 && checks[0].lastMessageId) ? checks[0].lastMessageId : startId + 100;
        
        console.log(`🚀 Memulai AUTO-SCRAPE untuk ${targetChannelStr}`);
        console.log(`📊 Memproses ID pesan ${startId} hingga ${endId}...`);
        
        // Langsung scrape tanpa pertanyaan
        const results = await this.scrapingService.scrapeChannel(targetChannelStr, startId, endId, this.botInteractionService);
        this.ui.displayResults(results);
        
        console.log('\n🔄 Mengembalikan ke menu utama...');
        return await this.execute(_account);
      } else {
        // Jika bukan nomor urut maupun tautan pesan langsung, anggap sebagai penambahan channel baru reguler
        console.log(`\n🔄 Mencoba memproses channel: ${channelInput}...`);
        const result = await this.scrapingService.addChannel(channelInput);
        this.ui.displayAddChannelResult(result);
        
        // Jika sukses menambah atau channel ternyata sudah ada di database, kita muat ulang.
        if (result.success || (result.message && result.message.includes('sudah ada'))) {
          console.log('\n🔄 Memuat ulang daftar channel...');
          return await this.execute(_account);
        }
      }
    }
  }
}

module.exports = RunDeepLinkScraperUseCase;
