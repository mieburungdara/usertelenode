/**
 * @file Application interfaces untuk UserTeleNode
 * @description Kontrak interface untuk application layer
 */

/**
 * @typedef {Object} IRunDeepLinkScraperUseCase
 * @description Use case untuk menjalankan deep link scraper
 * @property {function(Account): Promise<void>} execute
 *   - Jalankan proses scraping deep link untuk akun tertentu
 *   - @param {Account} account - Akun Telegram yang akan digunakan
 */

/**
 * @typedef {Object} IAutoReplyUseCase
 * @description Use case untuk auto reply
 * @property {function(Account): Promise<void>} execute
 *   - Jalankan auto reply untuk akun tertentu
 *   - @param {Account} account - Akun Telegram yang akan digunakan
 */
