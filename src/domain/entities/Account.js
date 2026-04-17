/**
 * @file Domain entity untuk Account
 * @description Representasi akun Telegram dalam domain layer
 */
class Account {
  /**
   * Membuat instance Account baru
   * @param {string} id - ID unik akun
   * @param {string|null} username - Username Telegram (@username)
   * @param {string} phone - Nomor telepon
   */
  constructor (id, username, phone) {
    this.id = id;
    this.username = username;
    this.phone = phone;
  }
}

module.exports = Account;
