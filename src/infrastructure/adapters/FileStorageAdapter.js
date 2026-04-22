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
    this.writeLocks = new Map(); // Prevent concurrent writes to same file
  }

  /**
   *
   * @param key
   * @param data
   */
  async save (key, data) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', 'data', `${key}.json`);

    // Prevent concurrent writes to the same file
    if (this.writeLocks.has(filePath)) {
      await this.writeLocks.get(filePath);
    }

    let resolveLock;
    const lockPromise = new Promise(resolve => { resolveLock = resolve; });
    this.writeLocks.set(filePath, lockPromise);

    try {
      // Ensure data directory exists
      const dataDir = this.path.dirname(filePath);
      if (!this.fs.existsSync(dataDir)) {
        this.fs.mkdirSync(dataDir, { /**
         *
         */
          recursive: true,
        });
      }

      // Atomic write: write to temp file first, then rename
      const tempFilePath = `${filePath}.tmp`;
      const jsonData = JSON.stringify(data, null, 2);

      this.fs.writeFileSync(tempFilePath, jsonData, 'utf-8');

      // Ensure data is flushed to disk
      const fd = this.fs.openSync(tempFilePath, 'r');
      try {
        this.fs.fsyncSync(fd);
      } finally {
        this.fs.closeSync(fd);
      }

      // Atomic rename (works on all OS)
      try {
        this.fs.renameSync(tempFilePath, filePath);
      } catch (renameError) {
        // If rename fails (Windows EEXIST), try copy + delete
        if (renameError.code === 'EEXIST') {
          this.fs.copyFileSync(tempFilePath, filePath);
          this.fs.unlinkSync(tempFilePath);
        } else {
          throw renameError;
        }
      }
    } finally {
      // Release lock
      resolveLock();
      this.writeLocks.delete(filePath);
    }
  }

  /**
   *
   * @param key
   */
  async load (key) {
    const filePath = this.path.resolve(__dirname, '..', '..', '..', 'data', `${key}.json`);
    if (!this.fs.existsSync(filePath)) { return null; }

    try {
      // Read file with proper error handling
      const data = this.fs.readFileSync(filePath, 'utf-8');

      // Handle empty file
      if (!data || data.trim() === '') {
        console.warn(`Warning: Empty JSON file ${filePath}`);
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.warn(`Warning: Failed to parse JSON file ${filePath}: ${error.message}`);

      // Try to recover from temp file if exists
      const tempFilePath = `${filePath}.tmp`;
      if (this.fs.existsSync(tempFilePath)) {
        try {
          console.warn(`Attempting recovery from temp file: ${tempFilePath}`);
          const tempData = this.fs.readFileSync(tempFilePath, 'utf-8');
          return JSON.parse(tempData);
        } catch (tempError) {
          console.warn(`Recovery failed: ${tempError.message}`);
        }
      }

      // Return null to indicate corrupted file
      return null;
    }
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
