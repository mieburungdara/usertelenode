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

const prisma = require('../adapters/PrismaClientAdapter');

/**
 * Repository for managing chat synchronization history with SQLite (Prisma)
 */
class ChatSyncHistoryRepository {
  /**
   * Save synchronization session history
   */
  async saveSyncHistory(sourceChannel, targetChannel, sessionData) {
    const source = String(sourceChannel);
    const target = String(targetChannel);

    const pair = await prisma.syncPair.upsert({
      where: {
        sourceChannel_targetChannel: {
          sourceChannel: source,
          targetChannel: target,
        }
      },
      update: {
        lastSyncedAt: sessionData.syncedAt ? new Date(sessionData.syncedAt) : new Date(),
        status: sessionData.errors ? 'error' : 'active',
      },
      create: {
        sourceChannel: source,
        targetChannel: target,
        lastSyncedAt: sessionData.syncedAt ? new Date(sessionData.syncedAt) : new Date(),
        status: sessionData.errors ? 'error' : 'active',
      }
    });

    await prisma.syncSession.create({
      data: {
        syncedAt: sessionData.syncedAt ? new Date(sessionData.syncedAt) : new Date(),
        messagesProcessed: sessionData.messagesProcessed || 0,
        messagesSynced: sessionData.messagesSynced || 0,
        duration: sessionData.duration,
        errors: sessionData.errors,
        pairId: pair.id
      }
    });

    // Update totals
    await prisma.syncPair.update({
      where: { id: pair.id },
      data: {
        totalMessagesSynced: { increment: sessionData.messagesSynced || 0 },
        totalSyncSessions: { increment: 1 },
      }
    });
  }

  /**
   * Get last sync timestamp for a channel pair
   */
  async getLastSyncTimestamp(sourceChannel, targetChannel) {
    const pair = await prisma.syncPair.findUnique({
      where: {
        sourceChannel_targetChannel: {
          sourceChannel: String(sourceChannel),
          targetChannel: String(targetChannel),
        }
      }
    });
    return pair?.lastSyncedAt || null;
  }

  /**
   * Get all synchronization pairs
   */
  async getAllSyncPairs() {
    return await prisma.syncPair.findMany();
  }

  /**
   * Add a new sync pair to history
   */
  async addSyncPair(sourceChannel, targetChannel, sourceTitle = '', targetTitle = '') {
    const source = String(sourceChannel);
    const target = String(targetChannel);

    const existing = await prisma.syncPair.findUnique({
      where: {
        sourceChannel_targetChannel: {
          sourceChannel: source,
          targetChannel: target,
        }
      }
    });

    if (existing) {
      if (sourceTitle && !existing.sourceTitle || targetTitle && !existing.targetTitle) {
        await prisma.syncPair.update({
          where: { id: existing.id },
          data: {
            sourceTitle: sourceTitle || existing.sourceTitle,
            targetTitle: targetTitle || existing.targetTitle,
          }
        });
      }
      return false;
    }

    await prisma.syncPair.create({
      data: {
        sourceChannel: source,
        targetChannel: target,
        sourceTitle: sourceTitle || source,
        targetTitle: targetTitle || target,
      }
    });
    return true;
  }

  /**
   * Get sync statistics for a channel pair
   */
  async getSyncStatistics(sourceChannel, targetChannel) {
    const pair = await prisma.syncPair.findUnique({
      where: {
        sourceChannel_targetChannel: {
          sourceChannel: String(sourceChannel),
          targetChannel: String(targetChannel),
        }
      },
      include: {
        sessions: {
          take: 5,
          orderBy: { syncedAt: 'desc' }
        }
      }
    });

    if (!pair) return null;

    return {
      totalSessions: pair.totalSyncSessions,
      totalMessages: pair.totalMessagesSynced,
      lastSync: pair.lastSyncedAt,
      status: pair.status,
      averageMessagesPerSession: pair.totalSyncSessions > 0 ?
        Math.round(pair.totalMessagesSynced / pair.totalSyncSessions) : 0,
      recentSessions: pair.sessions,
    };
  }

  /**
   * Clear sync history for a channel pair
   */
  async clearSyncHistory(sourceChannel, targetChannel) {
    const pair = await prisma.syncPair.findUnique({
      where: {
        sourceChannel_targetChannel: {
          sourceChannel: String(sourceChannel),
          targetChannel: String(targetChannel),
        }
      }
    });

    if (pair) {
      await prisma.syncSession.deleteMany({
        where: { pairId: pair.id }
      });

      await prisma.syncPair.update({
        where: { id: pair.id },
        data: {
          totalMessagesSynced: 0,
          totalSyncSessions: 0,
          lastSyncedAt: null,
          status: 'inactive'
        }
      });
    }
  }
}

module.exports = {
  ChatSyncHistoryRepository,
  IChatSyncHistoryRepository,
};