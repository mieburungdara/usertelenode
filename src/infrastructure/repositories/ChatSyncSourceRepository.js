// src/infrastructure/repositories/ChatSyncSourceRepository.js
// Interface: IChatSyncSourceRepository
/**
 * Interface for Chat Sync Source Repository
 */
class IChatSyncSourceRepository {
  /**
   * Save a source to the saved sources list
   * @param {Object} source - Source object with id, type, title, lastCopyId, lastMessageId
   */
  async saveSource(source) { throw new Error('Not implemented'); }

  /**
   * Get all saved sources
   * @returns {Array} Array of saved source objects
   */
  async getAllSources() { throw new Error('Not implemented'); }

  /**
   * Remove a source from saved sources
   * @param {string} sourceId - Source identifier
   */
  async removeSource(sourceId) { throw new Error('Not implemented'); }

  /**
   * Update source title/information
   * @param {string} sourceId - Source identifier
   * @param {Object} updates - Updates to apply
   */
  async updateSource(sourceId, updates) { throw new Error('Not implemented'); }
}

/**
 * Repository for managing saved chat synchronization sources
 */
class ChatSyncSourceRepository {
  /**
   * @param {Object} storage - Storage adapter for JSON persistence
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Generate unique key for source
   * @param {string} sourceId - Source identifier
   * @returns {string} Unique key
   */
  _getSourceKey(sourceId) {
    if (typeof sourceId === 'number') {
      return String(sourceId);
    }
    return String(sourceId || '').replace('@', '');
  }

  /**
   * Save a source to the saved sources list with atomic operations
   * @param {Object} source - Source object: { id, type, title, lastUsed, usageCount }
   */
  async saveSource(source) {
    const maxRetries = 5;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Read current data
        const sources = await this.getAllSourcesData();
        const sourceKey = this._getSourceKey(source.id);

        // Modify data
        if (!sources[sourceKey]) {
          sources[sourceKey] = {
            id: source.id,
            type: source.type || 'channel',
            title: source.title || source.id,
            lastUsed: new Date().toISOString(),
            usageCount: 1,
            addedAt: new Date().toISOString(),
            lastCopyId: source.lastCopyId || null,
            lastMessageId: source.lastMessageId || null
          };
        } else {
          // Atomic update of existing source
          const existing = sources[sourceKey];
          sources[sourceKey] = {
            ...existing,
            title: source.title || existing.title,
            lastUsed: new Date().toISOString(),
            usageCount: (existing.usageCount || 0) + 1,
            lastCopyId: source.lastCopyId !== undefined ? source.lastCopyId : existing.lastCopyId,
            lastMessageId: source.lastMessageId !== undefined ? source.lastMessageId : existing.lastMessageId
          };
        }

        // Use atomic save operation (implemented in storage adapter)
        await this.atomicSave('chat_sync_sources', sources);
        return; // Success

      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        // For concurrency issues, retry with backoff
        if (error.message.includes('concurrent') || error.code === 'EACCES') {
          const delay = Math.pow(2, attempt) * 10; // 20ms, 40ms, 80ms, 160ms
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        // For other errors, fail immediately
        break;
      }
    }

    console.error(`Failed to save source after ${maxRetries} attempts:`, lastError);
    throw lastError;
  }

  /**
   * Atomic save operation to prevent race conditions
   * @param {string} key - Storage key
   * @param {Object} data - Data to save
   */
  async atomicSave(key, data) {
    const fs = require('fs');
    const path = require('path');

    const filePath = path.resolve(__dirname, '..', '..', '..', 'data', `${key}.json`);
    const tempFilePath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Ensure data directory exists
      const dataDir = path.dirname(filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Write to temporary file first
      const jsonData = JSON.stringify(data, null, 2);
      fs.writeFileSync(tempFilePath, jsonData);

      // Atomic rename operation
      try {
        fs.renameSync(tempFilePath, filePath);
      } catch (renameError) {
        // If rename fails, try copy + delete as fallback
        fs.copyFileSync(tempFilePath, filePath);
        fs.unlinkSync(tempFilePath);
      }

    } catch (error) {
      // Cleanup temp file on error
      try {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Get all saved sources
   * @returns {Array} Array of saved source objects sorted by last used
   */
  async getAllSources() {
    const sources = await this.getAllSourcesData();

    return Object.values(sources)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .map(source => ({
        id: source.id,
        type: source.type,
        title: source.title,
        lastUsed: source.lastUsed,
        usageCount: source.usageCount || 0,
        lastCopyId: source.lastCopyId || null,
        lastMessageId: source.lastMessageId || null
      }));
  }

  /**
   * Get all sources data as object
   * @returns {Object} Sources data object
   */
  async getAllSourcesData() {
    try {
      return await this.storage.load('chat_sync_sources') || {};
    } catch (error) {
      console.warn('Warning: Could not load chat sync sources, returning empty');
      return {};
    }
  }

  /**
   * Remove a source from saved sources
   * @param {string} sourceId - Source identifier
   */
  async removeSource(sourceId) {
    const sources = await this.getAllSourcesData();
    const sourceKey = this._getSourceKey(sourceId);

    if (sources[sourceKey]) {
      delete sources[sourceKey];
      await this.storage.save('chat_sync_sources', sources);
      return true;
    }

    return false;
  }

  /**
   * Update source information
   * @param {string} sourceId - Source identifier
   * @param {Object} updates - Updates to apply
   */
  async updateSource(sourceId, updates) {
    const sources = await this.getAllSourcesData();
    const sourceKey = this._getSourceKey(sourceId);

    if (sources[sourceKey]) {
      sources[sourceKey] = {
        ...sources[sourceKey],
        ...updates,
        lastUsed: new Date().toISOString()
      };
      await this.storage.save('chat_sync_sources', sources);
      return true;
    }

    return false;
  }

  /**
   * Get sources by type
   * @param {string} type - Source type (channel, group, bot)
   * @returns {Array} Array of sources of specified type
   */
  async getSourcesByType(type) {
    const allSources = await this.getAllSources();
    return allSources.filter(source => source.type === type);
  }

  /**
   * Get most used sources
   * @param {number} limit - Maximum number of sources to return
   * @returns {Array} Array of most used sources
   */
  async getMostUsedSources(limit = 10) {
    const allSources = await this.getAllSources();
    return allSources
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  /**
   * Search sources by title or ID
   * @param {string} query - Search query
   * @returns {Array} Array of matching sources
   */
  async searchSources(query) {
    const allSources = await this.getAllSources();
    const lowerQuery = query.toLowerCase();

    return allSources.filter(source =>
      source.title.toLowerCase().includes(lowerQuery) ||
      source.id.toLowerCase().includes(lowerQuery)
    );
  }
}

module.exports = {
  ChatSyncSourceRepository,
  IChatSyncSourceRepository,
};