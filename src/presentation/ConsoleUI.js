// src/presentation/ConsoleUI.js
/**
 *
 */
class ConsoleUI {
  /**
   *
   * @param rl
   */
  constructor (rl) {
    this.rl = rl;
    this.colors = {
      /**
       *
       */
      reset: '\x1b[0m',
      /**
       *
       */
      bright: '\x1b[1m',
      /**
       *
       */
      dim: '\x1b[2m',
      /**
       *
       */
      underscore: '\x1b[4m',
      /**
       *
       */
      blink: '\x1b[5m',
      /**
       *
       */
      reverse: '\x1b[7m',
      /**
       *
       */
      hidden: '\x1b[8m',

      /**
       *
       */
      fg: {
        /**
         *
         */
        black: '\x1b[30m',
        /**
         *
         */
        red: '\x1b[31m',
        /**
         *
         */
        green: '\x1b[32m',
        /**
         *
         */
        yellow: '\x1b[33m',
        /**
         *
         */
        blue: '\x1b[34m',
        /**
         *
         */
        magenta: '\x1b[35m',
        /**
         *
         */
        cyan: '\x1b[36m',
        /**
         *
         */
        white: '\x1b[37m',
        /**
         *
         */
        crimson: '\x1b[38m',
      },
      /**
       *
       */
      bg: {
        /**
         *
         */
        black: '\x1b[40m',
        /**
         *
         */
        red: '\x1b[41m',
        /**
         *
         */
        green: '\x1b[42m',
        /**
         *
         */
        yellow: '\x1b[43m',
        /**
         *
         */
        blue: '\x1b[44m',
        /**
         *
         */
        magenta: '\x1b[45m',
        /**
         *
         */
        cyan: '\x1b[46m',
        /**
         *
         */
        white: '\x1b[47m',
        /**
         *
         */
        crimson: '\x1b[48m',
      },
    };
  }

  /**
   * Meminta input channel dari user
   * @returns {string} Input channel dari user
   */
  getChannelInput () {
    return this.rl.question('Masukkan channel (contoh: @channelname, -1001234567890): ');
  }

  /**
   * Meminta input channel baru untuk ditambahkan
   * @returns {string} Input channel baru
   */
  getNewChannelInput () {
    console.log('');
    console.log('📝 Tambah Channel Baru');
    console.log('────────────────────────────────');
    console.log('Format yang didukung:');
    console.log('  • Username: @channelname');
    console.log('  • Channel ID: -1001234567890');
    console.log('  • URL: https://t.me/channelname');
    console.log('');
    return this.rl.question('Masukkan channel: ');
  }

  /**
   * Menampilkan hasil penambahan channel
   * @param {Object} result - Hasil penambahan channel
   */
  displayAddChannelResult (result) {
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.log(`❌ ${result.message}`);
    }
  }

  /**
   *
   * @param defaultValue
   */
  getStartId (defaultValue = '') {
    const prompt = defaultValue ? `Start ID (default: ${defaultValue}): ` : 'Start ID: ';
    const input = this.rl.question(prompt);
    return input.trim() || defaultValue;
  }

  /**
   *
   * @param defaultValue
   */
  getEndId (defaultValue = '') {
    const prompt = defaultValue ? `End ID (default: ${defaultValue}): ` : 'End ID: ';
    const input = this.rl.question(prompt);
    return input.trim() || defaultValue;
  }

  /**
   *
   * @param channels
   */
  displayChannels (channels) {
    if (channels.length === 0) {
      console.log('Tidak ada channel tersimpan.');
      return;
    }
    console.log('\n📋 Daftar channel tersimpan:');
    channels.forEach((ch, idx) => {
      console.log(`  ${idx + 1}. ${String(ch.channelTitle || ch.channelName)} | Last Scraped ID: ${ch.lastScrapedId || 'N/A'}`);
    });
    console.log('');
  }

  /**
   *
   * @param channelCache
   */
  displayChannelTable (channelCache) {
    if (channelCache.length === 0) {
      console.log('Tidak ada channel yang dapat dicek.');
      return;
    }

    // Helper function to pad string
    /**
     *
     * @param str
     * @param width
     * @param align
     */
    function pad (str, width, align = 'left') {
      str = String(str);
      if (str.length > width) {
        str = str.substring(0, width);
      }
      if (align === 'right') {
        return str.padStart(width);
      } else if (align === 'center') {
        const totalPad = width - str.length;
        const leftPad = Math.floor(totalPad / 2);
        const rightPad = totalPad - leftPad;
        return ' '.repeat(leftPad) + str + ' '.repeat(rightPad);
      } else {
        return str.padEnd(width);
      }
    }

    // Function to format relative time
    /**
     *
     * @param date
     */
    function formatRelativeTime (date) {
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);

      if (diffSec < 60) { return 'baru saja'; }
      if (diffMin < 60) { return `${diffMin} menit yang lalu`; }
      if (diffHour < 24) { return `${diffHour} jam yang lalu`; }
      if (diffDay < 7) { return `${diffDay} hari yang lalu`; }
      if (diffDay < 30) { return `${Math.floor(diffDay / 7)} minggu yang lalu`; }
      if (diffDay < 365) { return `${Math.floor(diffDay / 30)} bulan yang lalu`; }
      return `${Math.floor(diffDay / 365)} tahun yang lalu`;
    }

    // Calculate column widths
    const noWidth = Math.max(2, String(channelCache.length).length);
    const nameWidth = Math.max(7, channelCache.length > 0 ? Math.max(...channelCache.map(ch => String(ch.channelTitle || ch.channelName).length || 0)) : 7);
    const idWidth = Math.max(15, channelCache.length > 0 ? Math.max(...channelCache.map(ch => ch.lastMessageId ? String(ch.lastMessageId).length : 3)) : 15); // "N/A" is 3
    const scrapedIdWidth = Math.max(15, channelCache.length > 0 ? Math.max(...channelCache.map(ch => ch.lastScrapedId ? String(ch.lastScrapedId).length : 3)) : 15);
    const timeWidth = 40; // For formatted time + relative
    const statusWidth = Math.max(6, channelCache.length > 0 ? Math.max(...channelCache.map(ch => ch.status.length)) : 6);

    // Table header
    const separator = '+' + '-'.repeat(noWidth + 2) + '+' + '-'.repeat(nameWidth + 2) + '+' + '-'.repeat(scrapedIdWidth + 2) + '+' + '-'.repeat(idWidth + 2) + '+' + '-'.repeat(timeWidth + 2) + '+' + '-'.repeat(statusWidth + 2) + '+';
    const header = '| ' + pad('No', noWidth, 'center') + ' | ' + pad('Channel', nameWidth, 'center') + ' | ' + pad('Last Scraped ID', scrapedIdWidth, 'center') + ' | ' + pad('Last Message ID', idWidth, 'center') + ' | ' + pad('Last Message Time', timeWidth, 'center') + ' | ' + pad('Status', statusWidth, 'center') + ' |';

    console.log('\n📋 Daftar channel yang tersedia:');
    console.log(separator);
    console.log(header);
    console.log(separator);

    // Table rows
    channelCache.forEach((ch, idx) => {
      let timeStr;
      if (ch.lastMessageTimestamp) {
        const date = new Date(ch.lastMessageTimestamp);
        if (isNaN(date.getTime())) {
          timeStr = 'N/A';
        } else {
          const dateTimeStr = date.toLocaleString('id-ID', {
            /**
             *
             */
            year: 'numeric',
            /**
             *
             */
            month: '2-digit',
            /**
             *
             */
            day: '2-digit',
            /**
             *
             */
            hour: '2-digit',
            /**
             *
             */
            minute: '2-digit',
          });
          const relative = formatRelativeTime(date);
          timeStr = `${dateTimeStr} (${relative})`;
        }
      } else {
        timeStr = 'N/A';
      }
      const idStr = ch.lastMessageId !== null ? String(ch.lastMessageId) : 'N/A';
      const scrapedIdStr = ch.lastScrapedId !== null && ch.lastScrapedId !== undefined ? String(ch.lastScrapedId) : 'N/A';
      const row = '| ' + pad(idx + 1, noWidth, 'center') + ' | ' + pad(String(ch.channelTitle || ch.channelName), nameWidth) + ' | ' + pad(scrapedIdStr, scrapedIdWidth, 'right') + ' | ' + pad(idStr, idWidth, 'right') + ' | ' + pad(timeStr, timeWidth) + ' | ' + pad(ch.status, statusWidth, 'center') + ' |';
      console.log(row);
    });

    console.log(separator);
    console.log('\n💡 Masukkan nomor dari daftar, atau langsung ketik nama/ID channel baru');
  }

  /**
   *
   * @param results
   */
  displayResults (results) {
    const { /**
     *
     */
      fg, /**
     *
     */
      bright, /**
     *
     */
      reset,
    } = this.colors;

    if (results.error) {
      console.log(`\n${fg.red}${bright}❌ PROSES TERHENTI KARENA ERROR FATAL: ${results.error}${reset}`);
    } else if (results.aborted) {
      console.log(`\n${fg.yellow}${bright}🛑 PROSES TERHENTI OTOMATIS: Response bot tidak mengandung media.${reset}`);
    }

    console.log(`\n${fg.cyan}📝 Laporan detail telah disimpan ke file: ${bright}report.md${reset}`);
    console.log(`${fg.yellow}⚠️ Hasil di bawah ini merupakan status aman terakhir yang tercatat di ID ${results.stoppedAt}.${reset}`);

    console.log(`\n${fg.green}${bright}📊 HASIL AKHIR PROSES SCRAPING${reset}`);
    console.log(`${fg.green}─────────────────────────────────────────${reset}`);
    console.log(`${fg.white}✅ Total Pesan Terbaca / Diproses   : ${bright}${results.messages}${reset}`);
    console.log(`${fg.dim}🗑️ Pesan Kosong / Terhapus / Tiada  : ${results.deletedMessages || 0}${reset}`);
    console.log(`${fg.cyan}🔗 Pesan Mengandung Tautan Sasaran  : ${bright}${results.messagesWithLink || 0}${reset}`);
    console.log(`${fg.white}📝 Pesan Tanpa Tautan (Teks/Media)  : ${results.messagesWithoutLink || 0}${reset}`);
    console.log(`${fg.magenta}🤖 Interaksi Deep Link (Link Send)  : ${bright}${results.interactions}${reset}`);
    console.log(`${fg.green}🖼️ Response dengan Media            : ${bright}${results.totalMedia || 0}${reset}`);
    console.log(`${fg.red}📄 Response TANPA Media             : ${results.responseWithoutMedia || 0}${reset}`);
    console.log(`${fg.green}─────────────────────────────────────────${reset}\n`);
  }

  /**
   * Menampilkan menu sinkronisasi chat
   */
  showChatSyncMenu () {
    console.log('\n🔄 CHAT SYNCHRONIZATION');
    console.log('═══════════════════════════════════════');
    console.log('1. 🚀 Mulai Sinkronisasi');
    console.log('2. ⏹️ Hentikan Sinkronisasi');
    console.log('3. 📊 Lihat Status Sinkronisasi');
    console.log('4. ⚙️ Konfigurasi Sinkronisasi');
    console.log('5. 📈 Lihat Riwayat Sinkronisasi');
    console.log('6. 📋 Lihat Statistik Sinkronisasi');
    console.log('0. ↩️ Kembali ke Menu Utama');
    console.log('═══════════════════════════════════════');
  }

  /**
   * Menampilkan hasil sinkronisasi chat
   * @param {Object} result - Hasil sinkronisasi
   */
  displayChatSyncResult (result) {
    console.log('\n📊 HASIL SINKRONISASI CHAT');
    console.log('─────────────────────────────────────');
    if (result.success) {
      console.log('✅ Status              : Berhasil');
      console.log(`📝 Pesan Diproses      : ${result.processedCount}`);
      console.log(`🔄 Pesan Disinkronkan  : ${result.syncedCount}`);
      console.log(`❌ Error                : ${result.errors}`);
      console.log(`⏱️ Durasi               : ${result.duration ? Math.round(result.duration / 1000) + ' detik' : 'N/A'}`);
    } else {
      console.log('❌ Status              : Gagal');
      console.log(`💬 Pesan Error        : ${result.error || 'Unknown error'}`);
    }
    console.log('─────────────────────────────────────\n');
  }

  /**
   * Menampilkan status sinkronisasi chat
   * @param {Array} syncPairs - Array pasangan chat sinkronisasi
   */
  displayChatSyncStatus (syncPairs) {
    console.log('\n📊 STATUS SINKRONISASI CHAT');
    console.log('══════════════════════════════════════════════════════════════');

    if (!syncPairs || syncPairs.length === 0) {
      console.log('❌ Tidak ada pasangan chat sinkronisasi yang terdaftar');
      console.log('💡 Gunakan menu konfigurasi untuk menambahkan pasangan chat');
      return;
    }

    // Header
    console.log('┌─────┬─────────────────────┬─────────────────────┬────────────┬────────────┐');
    console.log('│ No  │ Source Chat         │ Target Chat         │ Last Sync  │ Status     │');
    console.log('├─────┼─────────────────────┼─────────────────────┼────────────┼────────────┤');

    syncPairs.forEach((pair, index) => {
      const source = String(pair.sourceChat || '').substring(0, 19);
      const target = String(pair.targetChat || '').substring(0, 19);
      const lastSync = pair.lastSyncedAt ? new Date(pair.lastSyncedAt).toLocaleDateString('id-ID') : 'Never';
      const status = String(pair.status || 'unknown').toUpperCase();

      console.log(`│ ${String(index + 1).padStart(3)} │ ${source.padEnd(19)} │ ${target.padEnd(19)} │ ${lastSync.padEnd(10)} │ ${status.padEnd(10)} │`);
    });

    console.log('└─────┴─────────────────────┴─────────────────────┴────────────┴────────────┘');
    console.log('');
  }

  /**
   * Menampilkan riwayat sinkronisasi chat
   * @param {Object} statistics - Statistik sinkronisasi
   */
  displayChatSyncHistory (statistics) {
    console.log('\n📈 RIWAYAT SINKRONISASI CHAT');
    console.log('─────────────────────────────────────────────');
    console.log(`🔄 Total Sesi Sinkronisasi : ${statistics.totalSessions}`);
    console.log(`📨 Total Pesan Disinkronkan : ${statistics.totalMessages}`);
    console.log(`📅 Sinkronisasi Terakhir    : ${statistics.lastSync ? new Date(statistics.lastSync).toLocaleString('id-ID') : 'Belum pernah'}`);
    console.log(`📊 Rata-rata per Sesi       : ${statistics.averageMessagesPerSession} pesan`);
    console.log('─────────────────────────────────────────────');

    if (statistics.recentSessions && statistics.recentSessions.length > 0) {
      console.log('\n📋 SESI TERAKHIR:');
      console.log('┌─────────────┬──────────────┬──────────────┬──────────┬─────────────┐');
      console.log('│ Tanggal     │ Diproses     │ Disinkronkan │ Error    │ Durasi (ms) │');
      console.log('├─────────────┼──────────────┼──────────────┼──────────┼─────────────┤');

      statistics.recentSessions.forEach(session => {
        const date = new Date(session.syncedAt).toLocaleDateString('id-ID');
        const processed = String(session.messagesProcessed || 0).padStart(12);
        const synced = String(session.messagesSynced || 0).padStart(12);
        const errors = String(session.errors || 0).padStart(8);
        const duration = String(session.duration || 0).padStart(11);

        console.log(`│ ${date.padEnd(11)} │ ${processed} │ ${synced} │ ${errors} │ ${duration} │`);
      });

      console.log('└─────────────┴──────────────┴──────────────┴──────────┴─────────────┘');
    }
    console.log('');
  }

  /**
   * Meminta input untuk konfigurasi sinkronisasi chat dengan dukungan daftar source tersimpan
   * @param {Object} sourceRepository - Repository untuk daftar source tersimpan
   */
  async getChatSyncConfigInput (sourceRepository = null) {
    console.log('\n⚙️ KONFIGURASI SINKRONISASI CHAT');
    console.log('─────────────────────────────────────');
    console.log('Fitur ini memungkinkan sinkronisasi dari berbagai sumber ke channel target');

    // Tampilkan daftar source tersimpan jika repository tersedia
    let selectedSource = null;
    if (sourceRepository) {
      selectedSource = await this.selectFromSavedSources(sourceRepository);
    }

    let sourceChat, sourceChatType;

    if (selectedSource) {
      sourceChat = selectedSource.id;
      sourceChatType = selectedSource.type;
      console.log(`✅ Source dipilih: ${selectedSource.title} (${selectedSource.type})`);
    } else {
      // Input manual jika tidak ada source tersimpan atau user memilih input manual
      sourceChat = this.rl.question('Chat sumber (contoh: @sourcechat, chat_id, bot_username): ');

      console.log('\nTipe chat yang didukung:');
      console.log('1. channel - untuk kanal Telegram');
      console.log('2. group - untuk grup/supergroup Telegram');
      console.log('3. bot - untuk bot Telegram');

      const sourceTypeInput = this.rl.question('Tipe chat sumber (1-3, default: 2 untuk group): ') || '2';
      const typeMap = { /**
       *
       */
        1: 'channel', /**
       *
       */
        2: 'group', /**
       *
       */
        3: 'bot',
      };
      const typeInput = parseInt(sourceTypeInput.trim());
      sourceChatType = (typeInput >= 1 && typeInput <= 3) ? typeMap[sourceTypeInput] : 'group';
    }

    const targetChat = this.rl.question('Channel target (contoh: @broadcast_channel): ');
    const targetChatType = 'channel'; // Target is typically a channel

    const batchSize = parseInt(this.rl.question('Ukuran batch (default: 10): ') || '10');
    const rateLimitDelay = parseInt(this.rl.question('Delay rate limit (ms, default: 1000): ') || '1000');
    const includeMedia = this.rl.question('Sertakan media? (y/n, default: y): ').toLowerCase() !== 'n';

    const config = {
      /**
       *
       */
      sourceChatId: sourceChat,
      /**
       *
       */
      targetChatId: targetChat,
      /**
       *
       */
      sourceChatType,
      /**
       *
       */
      targetChatType,
      /**
       *
       */
      batchSize,
      /**
       *
       */
      rateLimitDelayMs: rateLimitDelay,
      /**
       *
       */
      includeMedia,
      /**
       *
       */
      enabled: true,
    };

    // Simpan source ke daftar tersimpan jika repository tersedia
    if (sourceRepository && sourceChat) {
      try {
        await sourceRepository.saveSource({
          /**
           *
           */
          id: sourceChat,
          /**
           *
           */
          type: sourceChatType,
          /**
           *
           */
          title: sourceChat, // Akan diupdate dengan title sebenarnya saat pertama kali digunakan
        });
        console.log('💾 Source disimpan ke daftar tersimpan untuk penggunaan selanjutnya.');
      } catch (error) {
        console.warn('⚠️ Gagal menyimpan source ke daftar tersimpan:', error.message);
      }
    }

    return config;
  }

  /**
   * Menampilkan dan memungkinkan pemilihan source dari daftar tersimpan
   * @param {Object} sourceRepository - Repository untuk daftar source tersimpan
   * @returns {Object|null} Source yang dipilih atau null jika input manual
   */
  async selectFromSavedSources (sourceRepository) {
    try {
      const savedSources = await sourceRepository.getAllSources();

      if (savedSources.length === 0) {
        console.log('\n📝 Tidak ada source tersimpan. Anda akan diminta untuk input manual.');
        return null;
      }

      console.log('\n📋 DAFTAR SOURCE TERSIMPAN:');
      console.log('─────────────────────────────────────');
      console.log('0. Input manual (baru)');
      savedSources.forEach((source, index) => {
        const usageCount = source.usageCount || 0;
        const usageInfo = usageCount > 1 ? ` (${usageCount}x digunakan)` : '';
        const lastUsed = source.lastUsed ? new Date(source.lastUsed).toLocaleDateString('id-ID') : '';
        const progressInfo = (source.lastMessageId !== null && source.lastMessageId !== undefined)
          ? ` | Last Msg: ${source.lastMessageId}${source.lastCopyId !== null && source.lastCopyId !== undefined ? ` (Copied: ${source.lastCopyId})` : ''}`
          : '';
        const title = source.title || source.id || 'Unknown';
        const type = source.type || 'unknown';
        console.log(`${index + 1}. ${title} (${type}) - ${lastUsed}${usageInfo}${progressInfo}`);
      });
      console.log('');

      const choiceInput = this.rl.question('Pilih source (0 untuk input manual, 1-' + (savedSources ? savedSources.length : 0) + '): ');

      if (!choiceInput || choiceInput.trim() === '0') {
        return null; // Input manual
      }

      const choice = parseInt(choiceInput.trim());
      if (choice >= 1 && choice <= savedSources.length) {
        return savedSources[choice - 1];
      } else {
        console.log('❌ Pilihan tidak valid, akan menggunakan input manual.');
        return null;
      }
    } catch (error) {
      console.warn('⚠️ Gagal memuat daftar source tersimpan:', error.message);
      return null;
    }
  }
}

module.exports = ConsoleUI;
