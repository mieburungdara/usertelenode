/**
 * @file Infrastructure interfaces untuk UserTeleNode
 * @description Kontrak interface untuk infrastructure layer
 */

/**
 * @typedef {Object} ITelegramClient
 * @description Interface untuk client Telegram (abstraksi dari GramJS)
 * @property {function(string): Promise<Object>} getEntity
 *   - Ambil informasi entity (channel/user/bot) berdasarkan username
 *   - @param {string} channel - Username atau nama channel
 *   - @returns {Promise<Object>} Entity object dari Telegram
 * @property {function(Object, Object): Promise<Object[]>} getMessages
 *   - Ambil pesan dari channel dengan opsi tertentu
 *   - @param {Object} channel - Channel entity
 *   - @param {Object} options - Opsi query (ids, limit, offsetId, dll)
 *   - @returns {Promise<Object[]>} Array pesan
 * @property {function(Object, Object): Promise<Object>} sendMessage
 *   - Kirim pesan ke chat tertentu
 *   - @param {Object} chatId - Chat entity atau ID
 *   - @param {Object} message - Object pesan dengan property message
 *   - @returns {Promise<Object>} Hasil pengiriman
 */

/**
 * @typedef {Object} IStorage
 * @description Interface untuk penyimpanan data (file system abstraction)
 * @property {function(string): Promise<Object>} load
 *   - Load data dari file
 *   - @param {string} key - Nama file/key
 *   - @returns {Promise<Object>} Data yang diload
 * @property {function(string, Object): Promise<void>} save
 *   - Save data ke file
 *   - @param {string} key - Nama file/key
 *   - @param {Object} data - Data yang akan disimpan
 */

/**
 * @typedef {Object} IAccountRepository
 * @description Interface untuk repository akun Telegram
 * @property {function(): Promise<Account[]>} getAllAccounts
 *   - Ambil semua akun yang tersimpan
 *   - @returns {Promise<Account[]>} Daftar akun
 * @property {function(Account): Promise<void>} saveAccount
 *   - Simpan akun baru
 *   - @param {Account} account - Data akun
 * @property {function(string): Promise<Account|null>} getAccount
 *   - Ambil akun berdasarkan identifier
 *   - @param {string} identifier - Phone atau username
 *   - @returns {Promise<Account|null>} Akun atau null
 * @property {function(string): Promise<void>} deleteAccount
 *   - Hapus akun berdasarkan identifier
 *   - @param {string} identifier - Phone atau username
 */
