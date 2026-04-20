// src/infrastructure/repositories/ChatSyncHistoryRepository.js
// Interface: IChatSyncHistoryRepository
/**
 * Interface for Chat Sync History Repository
 */
class IChatSyncHistoryRepository {
  /**
   * Save sync history for a chat pair
   * @param {string} sourceChat - Source chat identifier
   * @param {string} targetChat - Target chat identifier
   * @param {Object} sessionData - Session data object
   */
  async saveSyncHistory(sourceChat, targetChat, sessionData) { throw new Error('Not implemented'); }

  /**
   * Get last sync timestamp for a chat pair
   * @param {string} sourceChat - Source chat identifier
   * @param {string} targetChat - Target chat identifier
   */
  async getLastSyncTimestamp(sourceChat, targetChat) { throw new Error('Not implemented'); }

  /**
   * Get all sync pairs
   */
  async getAllSyncPairs() { throw new Error('Not implemented'); }

  /**
   * Add a new sync pair
   * @param {string} sourceChat - Source chat identifier
   * @param {string} targetChat - Target chat identifier
   */
  async addSyncPair(sourceChat, targetChat, sourceTitle, targetTitle) { throw new Error('Not implemented'); }
}

/**
 * Repository for managing chat synchronization history
 */
class ChatSyncHistoryRepository {
  /**
   * @param {Object} storage - Storage adapter for JSON persistence
   */
  constructor(storage) {
    this.storage = storage;
  }

  /**
   * Generate unique key for chat pair
   * @param {string} sourceChat - Source chat
   * @param {string} targetChat - Target chat
   * @returns {string} Unique key
   */
  _getPairKey(sourceChat, targetChat) {
    const sourceKey = typeof sourceChat === 'number' 
      ? String(sourceChat) 
      : sourceChat.replace('@', '').toLowerCase();
    const targetKey = typeof targetChat === 'number' 
      ? String(targetChat) 
      : targetChat.replace('@', '').toLowerCase();
    return `${sourceKey}_to_${targetKey}`;
  }

  /**
   * Save synchronization session history
   * @param {string} sourceChannel - Source channel identifier
   * @param {string} targetChannel - Target channel identifier
   * @param {Object} sessionData - Session data: { syncedAt, messagesProcessed, messagesSynced, errors, duration }
   */
  async saveSyncHistory(sourceChannel, targetChannel, sessionData) {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    const pairKey = this._getPairKey(sourceChannel, targetChannel);

    if (!history.syncPairs[pairKey]) {
      history.syncPairs[pairKey] = {
        sourceChannel: sourceChannel,
        targetChannel: targetChannel,
        lastSyncedAt: sessionData.syncedAt,
        totalMessagesSynced: sessionData.messagesSynced || 0,
        totalSyncSessions: 1,
        syncSessions: [sessionData],
        status: 'active',
      };
    } else {
      history.syncPairs[pairKey].lastSyncedAt = sessionData.syncedAt;
      history.syncPairs[pairKey].totalMessagesSynced += (sessionData.messagesSynced || 0);
      history.syncPairs[pairKey].totalSyncSessions += 1;
      history.syncPairs[pairKey].syncSessions.push(sessionData);
      
      // Prevent memory leak: keep only last 50 sessions
      if (history.syncPairs[pairKey].syncSessions.length > 50) {
        history.syncPairs[pairKey].syncSessions = 
          history.syncPairs[pairKey].syncSessions.slice(-50);
      }
      
      history.syncPairs[pairKey].status = sessionData.errors ? 'error' : 'active';
    }

    await this.storage.save('channel_sync_history', history);
  }

  /**
   * Get last sync timestamp for a channel pair
   * @param {string} sourceChannel - Source channel identifier
   * @param {string} targetChannel - Target channel identifier
   * @returns {string|null} ISO timestamp or null
   */
  async getLastSyncTimestamp(sourceChannel, targetChannel) {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    const pairKey = this._getPairKey(sourceChannel, targetChannel);
    return history.syncPairs[pairKey]?.lastSyncedAt || null;
  }

  /**
   * Get all synchronization pairs
   * @returns {Array} Array of sync pair objects
   */
  async getAllSyncPairs() {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    return Object.values(history.syncPairs).filter(pair =>
      pair && pair.sourceChannel && pair.targetChannel
    );
  }

  /**
   * Add a new sync pair to history
   * @param {string} sourceChannel - Source channel identifier
   * @param {string} targetChannel - Target channel identifier
   * @param {string} sourceTitle - Source channel title
   * @param {string} targetTitle - Target channel title
   * @returns {boolean} True if added, false if already exists
   */
  async addSyncPair(sourceChannel, targetChannel, sourceTitle = '', targetTitle = '') {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    const pairKey = this._getPairKey(sourceChannel, targetChannel);

    if (history.syncPairs[pairKey]) {
      // Update titles if provided and missing
      if (sourceTitle && !history.syncPairs[pairKey].sourceTitle) {
        history.syncPairs[pairKey].sourceTitle = sourceTitle;
      }
      if (targetTitle && !history.syncPairs[pairKey].targetTitle) {
        history.syncPairs[pairKey].targetTitle = targetTitle;
      }
      await this.storage.save('channel_sync_history', history);
      return false; // Already exists
    }

    history.syncPairs[pairKey] = {
      sourceChannel: sourceChannel,
      targetChannel: targetChannel,
      sourceTitle: sourceTitle || sourceChannel,
      targetTitle: targetTitle || targetChannel,
      lastSyncedAt: null,
      totalMessagesSynced: 0,
      totalSyncSessions: 0,
      syncSessions: [],
      status: 'inactive',
    };

    await this.storage.save('channel_sync_history', history);
    return true; // Successfully added
  }

  /**
   * Get sync statistics for a channel pair
   * @param {string} sourceChannel - Source channel identifier
   * @param {string} targetChannel - Target channel identifier
   * @returns {Object|null} Statistics object or null
   */
  async getSyncStatistics(sourceChannel, targetChannel) {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    const pairKey = this._getPairKey(sourceChannel, targetChannel);
    const pair = history.syncPairs[pairKey];

    if (!pair) return null;

    return {
      totalSessions: pair.totalSyncSessions,
      totalMessages: pair.totalMessagesSynced,
      lastSync: pair.lastSyncedAt,
      status: pair.status,
      averageMessagesPerSession: pair.totalSyncSessions > 0 ?
        Math.round(pair.totalMessagesSynced / pair.totalSyncSessions) : 0,
      recentSessions: pair.syncSessions.slice(-5), // Last 5 sessions
    };
  }

  /**
   * Clear sync history for a channel pair
   * @param {string} sourceChannel - Source channel identifier
   * @param {string} targetChannel - Target channel identifier
   */
  async clearSyncHistory(sourceChannel, targetChannel) {
    const history = await this.storage.load('channel_sync_history') || {
      syncPairs: {},
    };

    const pairKey = this._getPairKey(sourceChannel, targetChannel);

    if (history.syncPairs[pairKey]) {
      history.syncPairs[pairKey].syncSessions = [];
      history.syncPairs[pairKey].totalMessagesSynced = 0;
      history.syncPairs[pairKey].totalSyncSessions = 0;
      history.syncPairs[pairKey].lastSyncedAt = null;
      history.syncPairs[pairKey].status = 'inactive';

      await this.storage.save('channel_sync_history', history);
    }
  }
}

module.exports = {
  ChatSyncHistoryRepository,
  IChatSyncHistoryRepository,
};