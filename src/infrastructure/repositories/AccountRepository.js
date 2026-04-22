// src/infrastructure/repositories/AccountRepository.js
// Interface: IAccountRepository
/**
 *
 */
class IAccountRepository {
  /**
   *
   */
  async findAll () { throw new Error('Not implemented'); }
  /**
   *
   * @param account
   */
  async save (account) { throw new Error('Not implemented'); }
}

const prisma = require('../adapters/PrismaClientAdapter');

/**
 * Repository for managing Telegram accounts
 */
class AccountRepository {
  /**
   * Find all saved accounts
   * @returns {Promise<Array>}
   */
  async findAll () {
    const rawAccounts = await prisma.account.findMany();
    // Return in the format expected by the legacy code
    return rawAccounts.map(acc => ({
      phoneNumber: acc.phoneNumber,
      username: acc.username,
      id: acc.telegramId ? parseInt(acc.telegramId) : null,
      sessionString: acc.sessionString
    }));
  }

  /**
   * Save a new account
   * @param {Object} account - Account object
   */
  async save (account) {
    await prisma.account.upsert({
      where: { phoneNumber: account.phoneNumber },
      update: {
        username: account.username,
        telegramId: account.id ? String(account.id) : null,
        sessionString: account.sessionString || '',
      },
      create: {
        phoneNumber: account.phoneNumber,
        username: account.username,
        telegramId: account.id ? String(account.id) : null,
        sessionString: account.sessionString || '',
      },
    });
  }

  /**
   * Delete an account by phone number
   * @param {string} phoneNumber 
   */
  async delete (phoneNumber) {
    await prisma.account.delete({
      where: { phoneNumber }
    });
  }
}

module.exports = { /**
 *
 */
  AccountRepository, /**
 *
 */
  IAccountRepository,
};
