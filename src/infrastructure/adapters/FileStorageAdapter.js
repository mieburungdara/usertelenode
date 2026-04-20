// src/infrastructure/adapters/FileStorageAdapter.js
// Interface: IStorage
/**
 *
 */
class IStorage {
  /**
   *
   * @param key
   * @param data
   */
  async save (key, data) { throw new Error('Not implemented'); }
  /**
   *
   * @param key
   */
  async load (key) { throw new Error('Not implemented'); }
}

/**
 *
 */
class FileStorageAdapter {
  /**
   *
   * @param fs
   * @param path
   */
  constructor (fs, path) {
    this.fs = fs;
    this.path = path;
  }

  /**
   *
   * @param key
   * @param data
   */
  async save (key, data) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', 'data', `${key}.json`);
    // Ensure data directory exists
    const dataDir = this.path.dirname(filePath);
    if (!this.fs.existsSync(dataDir)) {
      this.fs.mkdirSync(dataDir, { recursive: true });
    }
    this.fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   *
   * @param key
   */
  async load (key) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', 'data', `${key}.json`);
    if (!this.fs.existsSync(filePath)) { return null; }
    const data = this.fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  }
}

module.exports = { /**
 *
 */
  FileStorageAdapter, /**
 *
 */
  IStorage,
};
