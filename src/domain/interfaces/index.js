/**
 * @file Domain interfaces untuk UserTeleNode
 * @description Kontrak interface untuk domain layer yang harus diimplementasikan
 */

/**
 * @typedef {Object} IScrapingService
 * @description Interface untuk layanan scraping channel Telegram
 * @property {function(string, number, number, IBotInteractionService): Promise<ScrapingResult>} scrapeChannel
 *   - Scrape channel secara sequential dari startId ke endId
 *   - Lakukan interaksi bot untuk setiap deep link yang ditemukan
 *   - @param {string} channel - Nama channel (@channelname)
 *   - @param {number} startId - ID pesan awal
 *   - @param {number} endId - ID pesan akhir
 *   - @param {IBotInteractionService} botInteractionService - Service untuk interaksi bot
 *   - @returns {Promise<ScrapingResult>} Hasil scraping
 * @property {function(): Promise<ChannelInfo[]>} getAvailableChannels
 *   - Ambil semua channel yang tersimpan
 *   - @returns {Promise<ChannelInfo[]>} Daftar channel
 * @property {function(ChannelInfo[]): Promise<ChannelInfo[]>} checkChannels
 *   - Periksa status terbaru semua channel
 *   - @param {ChannelInfo[]} savedChannels - Channel yang tersimpan
 *   - @returns {Promise<ChannelInfo[]>} Channel dengan status terbaru
 */

/**
 * @typedef {Object} IBotInteractionService
 * @description Interface untuk layanan interaksi bot Telegram
 * @property {function(string, string): Promise<BotInteractionResult>} interactWithBot
 *   - Kirim perintah /start ke bot dengan parameter tertentu
 *   - @param {string} botUsername - Username bot (@botname)
 *   - @param {string} startParam - Parameter untuk /start
 *   - @returns {Promise<BotInteractionResult>} Hasil interaksi
 */

/**
 * @typedef {Object} IScrapingHistoryRepository
 * @description Interface untuk repository riwayat scraping
 * @property {function(string, number, number): Promise<void>} saveHistory
 *   - Simpan riwayat scraping untuk channel
 *   - @param {string} channel - Nama channel
 *   - @param {number} startId - ID awal yang di-scrape
 *   @param {number} endId - ID akhir yang di-scrape
 * @property {function(string): Promise<number|null>} getLastScrapedId
 *   - Ambil ID terakhir yang di-scrape untuk channel
 *   - @param {string} channel - Nama channel
 *   - @returns {Promise<number|null>} ID terakhir atau null
 * @property {function(): Promise<ChannelInfo[]>} getAllChannels
 *   - Ambil semua channel yang pernah di-scrape
 *   - @returns {Promise<ChannelInfo[]>} Daftar channel
 * @property {function(string, number|null, string|null): Promise<void>} updateLastMessageId
 *   - Update informasi pesan terakhir untuk channel
 *   - @param {string} channelName - Nama channel
 *   - @param {number|null} lastMessageId - ID pesan terakhir
 *   - @param {string|null} lastMessageTimestamp - Timestamp pesan terakhir
 */
