/**
 * @file Global type definitions untuk UserTeleNode
 * @description Definisi typedef umum yang digunakan di seluruh aplikasi
 */

/**
 * @typedef {Object} ChannelInfo
 * @property {string} channelName - Nama channel (format @channelname)
 * @property {number|null} lastMessageId - ID pesan terakhir
 * @property {number|null} lastScrapedId - ID pesan terakhir yang di-scrape
 * @property {string|null} lastMessageTimestamp - Timestamp pesan terakhir (ISO string)
 * @property {string} status - Status channel (Punya pesan, Kosong, Tidak dapat diakses, Timeout)
 */

/**
 * @typedef {Object} ScrapingResult
 * @property {number} messages - Jumlah pesan yang diproses
 * @property {number} interactions - Jumlah interaksi bot yang dilakukan
 */

/**
 * @typedef {Object} BotInteractionResult
 * @property {boolean} success - Status keberhasilan interaksi
 * @property {string} botUsername - Username bot yang diinteraksikan
 * @property {string} startParam - Parameter start yang dikirim
 * @property {string|null} error - Pesan error jika gagal
 */

/**
 * @typedef {Object} Account
 * @property {string} phone - Nomor telepon
 * @property {string|null} username - Username akun
 * @property {string|null} firstName - Nama depan
 * @property {string|null} lastName - Nama belakang
 * @property {string} sessionPath - Path ke file session
 */
