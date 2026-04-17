/**
 * @file Presentation interfaces untuk UserTeleNode
 * @description Kontrak interface untuk presentation layer
 */

/**
 * @typedef {Object} IUI
 * @description Interface untuk User Interface (Console/Web)
 * @property {function(): string} getChannelInput
 *   - Ambil input channel dari user
 *   - @returns {string} Input channel
 * @property {function(number): string} getStartId
 *   - Ambil input start ID dengan default value
 *   - @param {number} defaultValue - Nilai default
 *   - @returns {string} Input start ID
 * @property {function(number): string} getEndId
 *   - Ambil input end ID dengan default value
 *   - @param {number} defaultValue - Nilai default
 *   - @returns {string} Input end ID
 * @property {function(ChannelInfo[]): void} displayChannelTable
 *   - Tampilkan tabel channel dalam format yang readable
 *   - @param {ChannelInfo[]} channelCache - Data channel yang akan ditampilkan
 * @property {function(ScrapingResult): void} displayResults
 *   - Tampilkan hasil scraping
 *   - @param {ScrapingResult} results - Hasil proses scraping
 */

/**
 * @typedef {Object} IAccountManager
 * @description Interface untuk manajemen akun
 * @property {function(): Promise<Account>} addAccount
 *   - Tambah akun baru melalui proses autentikasi
 *   - @returns {Promise<Account>} Akun yang berhasil ditambah
 * @property {function(): Account[]} listAccounts
 *   - List semua akun yang tersimpan
 *   - @returns {Account[]} Daftar akun
 * @property {function(Object): Account|null} selectAccount
 *   - Pilih akun dari daftar untuk digunakan
 *   - @param {Object} rl - Readline interface
 *   - @returns {Account|null} Akun yang dipilih atau null
 * @property {function(Object): void} deleteAccount
 *   - Hapus akun dari penyimpanan
 *   - @param {Object} rl - Readline interface
 */
