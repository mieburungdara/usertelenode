// src/infrastructure/repositories/AccountRepository.js
// Interface: IAccountRepository
class IAccountRepository {
  async findAll() { throw new Error('Not implemented'); }
  async save(account) { throw new Error('Not implemented'); }
}

class AccountRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async findAll() {
    return await this.storage.load('accounts') || [];
  }

  async save(account) {
    const accounts = await this.findAll();
    accounts.push(account);
    await this.storage.save('accounts', accounts);
  }
}

module.exports = { AccountRepository, IAccountRepository };