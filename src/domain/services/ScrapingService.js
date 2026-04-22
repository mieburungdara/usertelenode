/**
 * @file Domain service untuk scraping channel Telegram
 * @description Interface dan implementasi untuk scraping channel dengan deep link extraction
 */

/**
 * Interface untuk scraping service
 * @interface IScrapingService
 */
class IScrapingService {
  /**
   * Melakukan scraping channel secara sequential
   * @param {string} _channel - Nama channel (@channelname)
   * @param {number} _startId - ID pesan awal untuk scraping
   * @param {number} _endId - ID pesan akhir untuk scraping
   * @param {IBotInteractionService} _botInteractionService - Service untuk interaksi bot
   * @returns {Promise<ScrapingResult>} Hasil scraping
   */
  async scrapeChannel (_channel, _startId, _endId, _botInteractionService) { throw new Error('Not implemented'); }
}

// Utility function
/**
 * Mem-parse input channel menjadi format standar
 * @param {string} input - Input channel (username, ID numeric, atau URL t.me)
 * @returns {string|number|null} Channel name (@username) atau ID numeric jika valid, null jika invalid
 */
function parseChannelInput (input) {
  if (!input) { return null; }
  let cleaned = String(input).trim();
  if (!cleaned) { return null; }

  // Handle numeric channel ID (dengan atau tanpa prefix -100)
  if (/^-?\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10);
  }

  // Cek format URL private: t.me/c/123456789 (dikonversi ke -100123456789)
  const privateMatch = cleaned.match(/t\.me\/c\/(\d+)/i);
  if (privateMatch) {
    return parseInt(`-100${privateMatch[1]}`, 10);
  }

  // Handle t.me URL public
  const publicMatch = cleaned.match(/t\.me\/([a-zA-Z0-9_]+)/i);
  if (publicMatch && publicMatch[1].toLowerCase() !== 'c') {
    cleaned = publicMatch[1];
  }

  // Handle username dengan atau tanpa @, abaikan jika sudah berupa angka
  if (!/^-?\d+$/.test(cleaned) && !cleaned.startsWith('@')) {
    cleaned = '@' + cleaned;
  }

  return /^-?\d+$/.test(cleaned) ? parseInt(cleaned, 10) : cleaned;
}

/**
 * Implementasi service untuk scraping channel Telegram
 * @implements {IScrapingService}
 */
class ScrapingService {
  /**
   * Membuat instance ScrapingService
   * @param {ITelegramClient} telegramClient - Client Telegram untuk akses API
   * @param {IScrapingHistoryRepository} historyRepo - Repository untuk menyimpan history scraping
   */
  constructor (telegramClient, historyRepo) {
    this.telegramClient = telegramClient;
    this.historyRepo = historyRepo;
  }

  /**
   * Melakukan scraping channel secara sequential dari startId ke endId
   * @param {string} channel - Nama channel (@channelname)
   * @param {number} startId - ID pesan awal untuk scraping
   * @param {number} endId - ID pesan akhir untuk scraping
   * @param {IBotInteractionService} botInteractionService - Service untuk interaksi bot
   */
  async scrapeChannel (channel, startId, endId, botInteractionService) {
    let processedMessages = 0;
    let messagesWithLink = 0;
    let messagesWithoutLink = 0;
    let deletedMessages = 0;
    let totalInteractions = 0;
    let totalMedia = 0;
    let responseWithoutMedia = 0;

    let lastFetchedId = startId - 1;
    let errorOccurred = null;
    let aborted = false;

    const sessionStartTime = new Date();
    const scrapingDetails = [];

    const totalToProcess = Math.max(0, (endId - startId) + 1);
    console.log(`\n📊 Estimasi jumlah ID pesan yang akan diperiksa: ${totalToProcess}`);
    console.log('🔄 Mode: Sequential with Media Detection');

    const BATCH_SIZE = 20; // Smaller batch for sequential processing

    try {
      for (let batchStart = startId; batchStart <= endId && !aborted; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, endId);
        const idsToFetch = [];
        for (let i = batchStart; i <= batchEnd; i++) {
          idsToFetch.push(i);
        }

        const messages = await this.telegramClient.getMessages(channel, { /**
         *
         */
          ids: idsToFetch,
        });
        const validMsgs = messages.filter(m => m && m.className !== 'MessageEmpty');
        deletedMessages += (idsToFetch.length - validMsgs.length);
        validMsgs.sort((a, b) => a.id - b.id);

        for (const msg of validMsgs) {
          if (aborted) { break; }

          const currentId = msg.id;
          processedMessages++;
          lastFetchedId = currentId;

          if (msg.text) {
            const { /**
             *
             */
              extractDeepLinks,
            } = require('../../../utils/linkParser');
            const deepLinks = extractDeepLinks(msg.text);

            if (deepLinks.length > 0) {
              messagesWithLink++;
              console.log(`\x1b[36m🔗 Pesan ${currentId}: Ditemukan ${deepLinks.length} tautan.\x1b[0m`);

              for (const link of deepLinks) {
                console.log(`\x1b[35m🎯 Interacting with @${link.botUsername}...\x1b[0m`);
                const interaction = await botInteractionService.interactWithBot(link.botUsername, link.startData);

                  if (interaction.success) {
                  totalInteractions++;
                  const response = interaction.response;
                  
                  // Robust media check
                  const hasMedia = response && response.media && (
                    response.media.photo || 
                    response.media.video || 
                    response.media.document ||
                    response.media.webPage // Sometimes links have previews
                  );

                  if (hasMedia) {
                    totalMedia++;
                    console.log('\x1b[32m✅ Response has media. Continuing...\x1b[0m');
                  } else {
                    responseWithoutMedia++;
                    console.log('\x1b[31m⚠️ Response HAS NO MEDIA (Text Only).\x1b[0m');
                    if (response && response.message) {
                      console.log(`\x1b[33m💬 Bot message: ${response.message.substring(0, 50)}...\x1b[0m`);
                    }
                    console.log('\x1b[31m\x1b[1m🛑 ABORTING: Original logic requires media to continue.\x1b[0m');
                    aborted = true;
                  }

                  scrapingDetails.push({
                    /**
                     *
                     */
                    url: link.fullUrl,
                    /**
                     *
                     */
                    bot: `@${link.botUsername}`,
                    /**
                     *
                     */
                    startData: link.startData,
                    /**
                     *
                     */
                    hasMedia: !!hasMedia,
                  });

                  if (aborted) { break; }
                } else {
                  console.log(`\x1b[31m❌ Interaction failed: ${interaction.error}\x1b[0m`);
                  aborted = true;
                  errorOccurred = interaction.error;
                  break;
                }

                // Human-like delay between interactions
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 2000));
              }
            } else {
              messagesWithoutLink++;
            }
          } else {
            messagesWithoutLink++;
          }
        }

        if (!aborted && batchEnd < endId) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      console.log(`\n🛑 SCRAPING DIHENTIKAN DARURAT: ${e.message}`);
      errorOccurred = e.message;
    }

    const savedEndId = Math.max(startId, lastFetchedId);
    await this.historyRepo.saveHistory(channel, startId, savedEndId);

    const stats = {
      /**
       *
       */
      messages: processedMessages,
      /**
       *
       */
      interactions: totalInteractions,
      /**
       *
       */
      messagesWithLink,
      /**
       *
       */
      messagesWithoutLink,
      /**
       *
       */
      deletedMessages,
      /**
       *
       */
      totalMedia,
      /**
       *
       */
      responseWithoutMedia,
      /**
       *
       */
      stoppedAt: savedEndId,
      /**
       *
       */
      error: errorOccurred,
      /**
       *
       */
      aborted,
    };

    // Update history with true successful point
    if (typeof this.historyRepo.addScrapingSession === 'function') {
      await this.historyRepo.addScrapingSession(channel, {
        /**
         *
         */
        date: sessionStartTime.toISOString(),
        /**
         *
         */
        startId,
        /**
         *
         */
        endId: savedEndId,
        /**
         *
         */
        processed: processedMessages,
        /**
         *
         */
        linksFound: messagesWithLink,
        /**
         *
         */
        noLinks: messagesWithoutLink,
        /**
         *
         */
        deleted: deletedMessages,
        /**
         *
         */
        interactions: totalInteractions,
        /**
         *
         */
        error: errorOccurred || (aborted ? 'Aborted by logic' : null),
      });
    }

    // GENERATE report.md (Actual Functionality)
    await this.generateReportFile(channel, startId, savedEndId, stats, scrapingDetails);

    // Send report to admin via Telegram
    await this.sendReportToAdmin(channel, startId, savedEndId, stats);

    return stats;
  }

  /**
   * Mengirim laporan scraping ke admin via Telegram
   * @param {string} channel - Nama channel
   * @param {number} startId - ID awal
   * @param {number} endId - ID akhir
   * @param {Object} stats - Statistik scraping
   */
  async sendReportToAdmin (channel, startId, endId, stats) {
    const ADMIN_ID = 7602143247; // @fernathan

    try {
      let statusEmoji = '✅';
      let statusText = 'SELESAI';
      if (stats.error) {
        statusEmoji = '❌';
        statusText = 'ERROR';
      } else if (stats.aborted) {
        statusEmoji = '🛑';
        statusText = 'DIHENTIKAN';
      }

      const now = new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      const message = [
        `${statusEmoji} <b>LAPORAN SCRAPING</b>`,
        ``,
        `📌 <b>Channel:</b> ${channel}`,
        `📊 <b>Range:</b> ID ${startId} → ${endId}`,
        `🕐 <b>Waktu:</b> ${now} WIB`,
        ``,
        `━━━━━ STATISTIK ━━━━━`,
        `✅ Pesan Diproses: <b>${stats.messages}</b>`,
        `🗑️ Terhapus/Kosong: <b>${stats.deletedMessages || 0}</b>`,
        `🔗 Mengandung Link: <b>${stats.messagesWithLink || 0}</b>`,
        `📝 Tanpa Link: <b>${stats.messagesWithoutLink || 0}</b>`,
        `🤖 Interaksi Bot: <b>${stats.interactions}</b>`,
        `🖼️ Dengan Media: <b>${stats.totalMedia || 0}</b>`,
        `📄 Tanpa Media: <b>${stats.responseWithoutMedia || 0}</b>`,
        ``,
        `📋 <b>Status:</b> ${statusText}`,
        stats.error ? `⚠️ <b>Error:</b> ${stats.error}` : '',
        ``,
        `<i>— UserTeleNode Bot</i>`,
      ].filter(Boolean).join('\n');

      await this.telegramClient.sendMessage(ADMIN_ID, {
        message,
        parseMode: 'html',
      });

      console.log('\x1b[32m📨 Laporan berhasil dikirim ke admin @fernathan\x1b[0m');
    } catch (e) {
      console.warn(`\x1b[33m⚠️ Gagal mengirim laporan ke admin: ${e.message}\x1b[0m`);
    }
  }

  /**
   * Menghasilkan file report.md sesuai spesifikasi
   * @param {string} channel
   * @param {number} startId
   * @param {number} endId
   * @param {Object} stats
   * @param {Array} details
   */
  async generateReportFile (channel, startId, endId, stats, details) {
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.resolve(process.cwd(), 'report.md');

    let content = '# Laporan Deep Link Scraping\n\n---\n\n';
    content += '## Informasi Scraping\n';
    content += `- **Channel:** ${channel}\n`;
    content += `- **Range Pesan:** ID ${startId} - ID ${endId}\n`;
    content += `- **Tanggal:** ${new Date().toLocaleString('id-ID')}\n\n---\n\n`;

    content += '## Statistik\n\n';
    content += '| Metrik | Jumlah |\n';
    content += '|--------|--------|\n';
    content += `| Total Pesan Discrape | ${stats.messages} |\n`;
    content += `| Total Link Ditemukan | ${stats.interactions} |\n`;
    content += `| Total Media (Foto/Video) | ${stats.totalMedia} |\n`;
    content += `| Pesan yang Mengandung Deep Link | ${stats.messagesWithLink} |\n`;
    content += `| Response tanpa Media | ${stats.responseWithoutMedia} |\n\n---\n\n`;

    content += '## Detail Link\n\n';
    details.forEach((item, idx) => {
      content += `### ${idx + 1}. Link\n`;
      content += `- **URL:** \`${item.url}\`\n`;
      content += `- **Bot:** ${item.bot}\n`;
      content += `- **Start Data:** \`${item.startData}\`\n`;
      content += `- **Response:** ${item.hasMedia ? '✅ Ada Media' : '❌ Tidak Ada Media'}\n\n`;
    });

    content += '---\n\n';
    content += '## Status\n\n';
    if (stats.error) {
      content += `❌ **ERROR** - ${stats.error}\n`;
    } else if (stats.aborted) {
      content += '🛑 **ABORTED** - Berhenti karena response bot tidak mengandung media\n';
    } else {
      content += '✅ **SELESAI** - Semua pesan berhasil discrape\n';
    }

    content += '\n---\n\n*Report generated by UserTeleNode Bot*';

    try {
      fs.writeFileSync(reportPath, content);
      console.log(`\n📝 Laporan berhasil disimpan ke: ${reportPath}`);
    } catch (e) {
      console.warn(`⚠️ Gagal menulis file report.md: ${e.message}`);
    }
  }

  /**
   * Mengambil semua channel yang tersedia dari history
   * @returns {Promise<ChannelInfo[]>} Daftar channel yang pernah di-scrape
   */
  async getAvailableChannels () {
    return await this.historyRepo.getAllChannels();
  }

  /**
   * Menambahkan channel baru ke dalam daftar
   * @param {string|number} channel - Nama channel (@channelname) atau ID numeric
   * @returns {Promise<{success: boolean, message: string}>} Hasil penambahan
   */
  async addChannel (channel) {
    try {
      // Validate dan parse input
      const parsedChannel = parseChannelInput(channel);

      if (!parsedChannel) {
        return {
          /**
           *
           */
          success: false,
          /**
           *
           */
          message: 'Format channel tidak valid. Gunakan @username atau ID numeric (-1001234567890)',
        };
      }

      // Test koneksi ke channel untuk validasi
      const entity = await this.telegramClient.getEntity(parsedChannel);
      const title = entity.title || String(parsedChannel);

      // Tambahkan ke repository
      const added = await this.historyRepo.addChannel(parsedChannel, title);

      if (added) {
        return {
          /**
           *
           */
          success: true,
          /**
           *
           */
          message: `Channel ${parsedChannel} (${title}) berhasil ditambahkan`,
        };
      } else {
        return {
          /**
           *
           */
          success: false,
          /**
           *
           */
          message: `Channel ${parsedChannel} sudah ada dalam daftar`,
        };
      }
    } catch (error) {
      return {
        /**
         *
         */
        success: false,
        /**
         *
         */
        message: `Gagal menambahkan channel: ${error.message}`,
      };
    }
  }

  /**
   * Memeriksa status terbaru dari semua channel tersimpan
   * @param {ChannelInfo[]} savedChannels - Channel yang tersimpan dari history
   * @returns {Promise<ChannelInfo[]>} Channel dengan informasi terbaru
   */
  async checkChannels (savedChannels) {
    const channelCache = [];
    const now = new Date();
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour
    const totalChannels = savedChannels.length;

    console.log(`🔄 Checking latest message IDs for ${totalChannels} channels...`);

    for (const [index, ch] of savedChannels.entries()) {
      console.log(`\n📡 Checking channel ${index + 1}/${totalChannels}: ${ch.channelName}...`);
      const checkedTimestamp = ch.lastCheckedAt ? new Date(ch.lastCheckedAt) : null;
      const isCacheValid = checkedTimestamp && (now - checkedTimestamp) < CACHE_TTL;

      if (isCacheValid) {
        console.log(`📦 Using cached data for ${ch.channelTitle || ch.channelName}`);
        channelCache.push({
          /**
           *
           */
          channelId: null,
          /**
           *
           */
          channelName: ch.channelName,
          /**
           *
           */
          channelTitle: ch.channelTitle || ch.channelName,
          /**
           *
           */
          lastMessageId: ch.lastMessageId || null,
          /**
           *
           */
          lastScrapedId: ch.lastScrapedId,
          /**
           *
           */
          lastMessageTimestamp: ch.lastMessageTimestamp || null,
          /**
           *
           */
          lastCheckedAt: ch.lastCheckedAt || null,
          /**
           *
           */
          status: ch.lastMessageId ? 'Punya pesan (Cached)' : 'Kosong (Cached)',
        });
      } else {
        try {
          console.log(`🌐 Fetching latest message from ${ch.channelName}...`);
          const entity = await this.telegramClient.getEntity(parseChannelInput(ch.channelName));
          const messages = await this.telegramClient.getMessages(entity, {
            /**
             *
             */
            limit: 1,
          });
          const msg = messages.length > 0 ? messages[0] : null;
          const messageId = msg ? msg.id : null;
          const messageTimestamp = msg ? msg.date : null;
          const title = entity.title || ch.channelTitle || ch.channelName;

          // Update cache first
          const timestampISO = messageTimestamp ? new Date(messageTimestamp * 1000).toISOString() : null;
          await this.historyRepo.updateLastMessageId(ch.channelName, messageId, timestampISO, title);

          console.log(`✅ Got latest message ID ${messageId} for ${title || ch.channelName}`);

          channelCache.push({
            /**
             *
             */
            channelId: entity.id,
            /**
             *
             */
            channelName: ch.channelName,
            /**
             *
             */
            channelTitle: title,
            /**
             *
             */
            lastMessageId: messageId,
            /**
             *
             */
            lastScrapedId: ch.lastScrapedId,
            /**
             *
             */
            lastMessageTimestamp: timestampISO,
            /**
             *
             */
            lastCheckedAt: new Date().toISOString(),
            /**
             *
             */
            status: msg ? 'Punya pesan' : 'Kosong',
          });

          // Rate limit delay - only if we actually hit the network
          if (index < totalChannels - 1) {
            console.log('⏳ Waiting 1s before next channel to avoid rate limit...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (e) {
          let status = 'Tidak dapat diakses';
          if (e.message && e.message.includes('TIMEOUT')) {
            status = 'Timeout';
          }

          console.log(`❌ Failed to check ${ch.channelTitle || ch.channelName}: ${status} (${e.message})`);

          // Fallback: Gunakan data yang sudah ada jika ada, jangan null
          channelCache.push({
            /**
             *
             */
            channelId: null,
            /**
             *
             */
            channelName: ch.channelName,
            /**
             *
             */
            channelTitle: ch.channelTitle || ch.channelName,
            /**
             *
             */
            lastMessageId: ch.lastMessageId || null,
            /**
             *
             */
            lastScrapedId: ch.lastScrapedId,
            /**
             *
             */
            lastMessageTimestamp: ch.lastMessageTimestamp || null,
            /**
             *
             */
            lastCheckedAt: ch.lastCheckedAt || null,
            /**
             *
             */
            status: `${status} (using cached)`,
          });
        }
      }
    }

    // Filter unique by normalized channelName (handle both string and numeric IDs)
    const uniqueCache = channelCache.filter((ch, index, arr) =>
      arr.findIndex(c => String(c.channelName).trim().toLowerCase() === String(ch.channelName).trim().toLowerCase()) === index,
    );

    // Sort cache by lastMessageTimestamp descending (nulls last)
    uniqueCache.sort((a, b) => {
      if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
        return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
      }
      if (a.lastMessageTimestamp) { return -1; }
      if (b.lastMessageTimestamp) { return 1; }
      return 0;
    });

    console.log(`\n✅ Channel check complete! ${uniqueCache.length} channels ready.`);
    console.log('═══════════════════════════════════════════════════════\n');

    return uniqueCache;
  }
}

module.exports = {
  /**
   *
   */
  ScrapingService,
  /**
   *
   */
  IScrapingService,
  /**
   *
   */
  parseChannelInput,
};
