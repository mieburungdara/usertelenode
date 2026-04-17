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
    
    let lastFetchedId = startId - 1; // ID tercapai di loop fetcher
    let errorOccurred = null;

    const totalToProcess = Math.max(0, (endId - startId) + 1);
    console.log(`\n📊 Estimasi jumlah ID pesan yang akan diperiksa: ${totalToProcess}`);

    // --- PAUSE & DECOUPLED QUEUE SYSTEM ---
    let isPaused = false;
    let isFetchingFinished = false;
    const interactionQueue = [];

    const stdInHandler = (data) => {
      const char = data.toString();
      if (char === ' ') {
        isPaused = !isPaused;
        if (isPaused) {
          console.log('\n⏸️ STATUS: PENGIRIMAN DIJEDA... (Membaca pesan tetap berjalan) Tekan SPASI untuk lanjut.\n');
        } else {
          console.log('\n▶️ STATUS: PENGIRIMAN DILANJUTKAN.\n');
        }
      } else if (char === '\x03') {
        process.emit('SIGINT');
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', stdInHandler);
    }

    const workerPromise = (async () => {
      while (!isFetchingFinished || interactionQueue.length > 0) {
        if (isPaused || interactionQueue.length === 0) {
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const task = interactionQueue.shift();
        try {
          console.log(`🎯 Executing [Sisa Antrean: ${interactionQueue.length}]: @${task.botUsername}?start=${task.startParam}`);
          const result = await botInteractionService.interactWithBot(task.botUsername, task.startParam);
          if (result.success) {
            totalInteractions++;
          }
        } catch (e) {
          console.log(`⚠️ Gagal interaksi @${task.botUsername}: ${e.message}`);
        }
        
        // Delay 3 detik demi limit Telegram hanya ketika mengeksekusi
        await new Promise(r => setTimeout(r, 3000));
      }
    })();
    // --- END SYSTEM ---

    const BATCH_SIZE = 50;

    try {
      for (let batchStart = startId; batchStart <= endId; batchStart += BATCH_SIZE) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE - 1, endId);
        const idsToFetch = [];
        for (let i = batchStart; i <= batchEnd; i++) {
          idsToFetch.push(i);
        }

        let messages = [];
        let success = false;
        let retries = 0;

        while (retries < 3 && !success) {
          try {
            messages = await this.telegramClient.getMessages(channel, {
              ids: idsToFetch,
            });
            success = true;
          } catch (error) {
            retries++;
            if (error.message && error.message.includes('TIMEOUT')) {
              console.log(`⏱️ Timeout fetch batch ${batchStart}-${batchEnd}, mencoba ulang (${retries}/3)...`);
            } else {
              console.log(`⚠️ Error fetch batch ${batchStart}-${batchEnd}: ${error.message}, mencoba ulang (${retries}/3)...`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000 * retries));
          }
        }

        if (!success) {
          throw new Error(`Gagal mengambil API batch pesan dari ID ${batchStart} s/d ${batchEnd} setelah 3x percobaan mutlak. Koneksi terputus.`);
        }

        const validMsgs = messages.filter(m => m && m.className !== 'MessageEmpty');
        const emptyCount = idsToFetch.length - validMsgs.length;
        
        if (emptyCount > 0) {
          deletedMessages += emptyCount;
        }

        validMsgs.sort((a, b) => a.id - b.id);

        for (const msg of validMsgs) {
          const currentId = msg.id;
          processedMessages++;

          if (msg.text) {
            const startLinks = msg.text.match(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]+)\?start=([^\s]+)/g);
            if (startLinks && startLinks.length > 0) {
              messagesWithLink++;
              console.log(`🔗 Pesan ${currentId} terbaca: Ditemukan ${startLinks.length} tautan (Dimasukkan ke Antrean).`);
              for (const fullLink of startLinks) {
                const match = fullLink.match(/(?:https?:\/\/)?t\.me\/([a-zA-Z0-9_]+)\?start=([^\s]+)/);
                if (match) {
                  interactionQueue.push({
                    botUsername: match[1],
                    startParam: match[2],
                    msgId: currentId
                  });
                }
              }
            } else {
              messagesWithoutLink++;
            }
          } else {
            messagesWithoutLink++;
          }
        }

        lastFetchedId = batchEnd;

        // Delay antar fetch diperkecil krn eksekusi dilakukan terpisah
        if (batchEnd < endId) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } catch (e) {
      console.log(`\n🛑 SCRAPING DIHENTIKAN DARURAT: ${e.message}`);
      errorOccurred = e.message;
    }

    // Tunggu antrean habis (Hanya jika tidak ada error fatal)
    isFetchingFinished = true;
    if (!errorOccurred && interactionQueue.length > 0) {
       console.log(`\n✅ Pengambilan pesan selesai! Menunggu ${interactionQueue.length} interaksi dari dalam antrean dikirim...`);
    }
    
    // Tunggu Worker Selesai atau putus jika error, minimal beri sedikit waktu.
    try {
      if (!errorOccurred) {
        await workerPromise;
      }
    } catch(err) {
      console.log('Worker Error:', err);
    }

    // MATIKAN RAW MODE STDIN (wajib agar CLI tidak bertingkah aneh ke depan)
    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', stdInHandler);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    }

    // --- SAFE STATE CALCULATION ---
    // Titik aman terakhir = jika error mendadak, cek apakaha ada antrean yg batal dieksekusi?
    let finalEndId = lastFetchedId;
    if (interactionQueue.length > 0) {
       // Titik belum selesai = ID pertama di antrian kurangi 1
       finalEndId = interactionQueue[0].msgId - 1;
    }
    
    const savedEndId = Math.max(startId, finalEndId);

    // Update history with true successful point
    await this.historyRepo.saveHistory(channel, startId, savedEndId);

    // Simpan rincian sesi scraping ke database
    if (typeof this.historyRepo.addScrapingSession === 'function') {
      await this.historyRepo.addScrapingSession(channel, {
        date: new Date().toISOString(),
        startId,
        endId: savedEndId,
        processed: processedMessages,
        linksFound: messagesWithLink,
        noLinks: messagesWithoutLink,
        deleted: deletedMessages,
        interactions: totalInteractions,
        error: errorOccurred
      });
    }

    const resultPayload = {
      messages: processedMessages,
      interactions: totalInteractions,
      messagesWithLink,
      messagesWithoutLink,
      deletedMessages,
      stoppedAt: savedEndId,
      error: errorOccurred
    };

    if (errorOccurred) {
      try {
        const reportText = `🚨 **Laporan Error BotAnon Scraper** 🚨\n\n📌 **Channel:** ${channel}\n📊 **Rentang ID Awal:** ${startId} - ${endId}\n🛑 **Terhenti di ID:** ${savedEndId}\n\n**Statistik Terkumpul Sebraknya:**\n✅ Diproses: ${processedMessages}\n🔗 Dgn Target (Link): ${messagesWithLink}\n📝 Tanpa Link: ${messagesWithoutLink}\n🗑️ Kosong/Dihapus: ${deletedMessages}\n\n**Penyebab Kegagalan Aborting:**\n❌ \`${errorOccurred}\``;
        console.log(`\n📨 Mengirim laporan darurat ke akun log @fernathan...`);
        await this.telegramClient.sendMessage('@fernathan', { message: reportText });
        console.log(`✅ Laporan kegagalan berhasil dikirim ke @fernathan.`);
      } catch (dmErr) {
        console.log(`⚠️ Gagal mengirim Telegram DM ke @fernathan: ${dmErr.message}`);
      }
    }

    return resultPayload;
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

      // Rate limit delay - always delay between channels (even cached) to avoid Telegram rate limits
      if (index < totalChannels - 1) {
        console.log('⏳ Waiting 1s before next channel...');
        await new Promise(resolve => setTimeout(resolve, 1000));
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
