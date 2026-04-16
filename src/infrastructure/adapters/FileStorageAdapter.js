// src/infrastructure/adapters/FileStorageAdapter.js
// Interface: IStorage
class IStorage {
  async save(key, data) { throw new Error('Not implemented'); }
  async load(key) { throw new Error('Not implemented'); }
}

class FileStorageAdapter {
  constructor(fs, path) {
    this.fs = fs;
    this.path = path;
  }

  async save(key, data) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', `${key}.json`);
    this.fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  async load(key) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', `${key}.json`);
    if (!this.fs.existsSync(filePath)) return null;
    const data = this.fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
}

module.exports = { FileStorageAdapter, IStorage };