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
    if (results.error) {
      console.log(`\n❌ PROSES TERHENTI KARENA ERROR FATAL: ${results.error}`);
      console.log(`⚠️ Hasil di bawah ini merupakan status aman terakhir yang tercatat di ID ${results.stoppedAt}.`);
    }
    console.log('\n📊 HASIL AKHIR PROSES SCRAPING');
    console.log('─────────────────────────────────────────');
    console.log(`✅ Total Pesan Terbaca / Diproses   : ${results.messages}`);
    console.log(`🗑️ Pesan Kosong / Terhapus / Tiada  : ${results.deletedMessages || 0}`);
    console.log(`🔗 Pesan Mengandung Tautan Sasaran  : ${results.messagesWithLink || 0}`);
    console.log(`📝 Pesan Tanpa Tautan (Teks/Media)  : ${results.messagesWithoutLink || 0}`);
    console.log(`🤖 Interaksi Deep Link Berhasil     : ${results.interactions}`);
    console.log('─────────────────────────────────────────\n');
  }
}

module.exports = ConsoleUI;
