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

const prisma = require('../adapters/PrismaClientAdapter');

/**
 * Repository for managing saved chat synchronization sources with SQLite (Prisma)
 */
class ChatSyncSourceRepository {
  /**
   * Save a source to the saved sources list
   */
  async saveSource(source) {
    const id = String(source.id);
    await prisma.syncSource.upsert({
      where: { id },
      update: {
        title: source.title,
        lastUsed: new Date(),
        usageCount: { increment: 1 },
        lastCopyId: source.lastCopyId,
        lastMessageId: source.lastMessageId
      },
      create: {
        id,
        type: source.type || 'channel',
        title: source.title || id,
        lastUsed: new Date(),
        usageCount: 1,
        addedAt: new Date(),
        lastCopyId: source.lastCopyId,
        lastMessageId: source.lastMessageId
      }
    });
  }

  /**
   * Get all saved sources sorted by last used
   */
  async getAllSources() {
    return await prisma.syncSource.findMany({
      orderBy: { lastUsed: 'desc' }
    });
  }

  /**
   * Remove a source from saved sources
   */
  async removeSource(sourceId) {
    try {
      await prisma.syncSource.delete({
        where: { id: String(sourceId) }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Update source information
   */
  async updateSource(sourceId, updates) {
    try {
      await prisma.syncSource.update({
        where: { id: String(sourceId) },
        data: {
          ...updates,
          lastUsed: new Date()
        }
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get sources by type
   */
  async getSourcesByType(type) {
    return await prisma.syncSource.findMany({
      where: { type },
      orderBy: { lastUsed: 'desc' }
    });
  }

  /**
   * Get most used sources
   */
  async getMostUsedSources(limit = 10) {
    return await prisma.syncSource.findMany({
      take: limit,
      orderBy: { usageCount: 'desc' }
    });
  }

  /**
   * Search sources by title or ID
   */
  async searchSources(query) {
    const q = query.toLowerCase();
    return await prisma.syncSource.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { id: { contains: q } }
        ]
      },
      orderBy: { lastUsed: 'desc' }
    });
  }
}

module.exports = {
  ChatSyncSourceRepository,
  IChatSyncSourceRepository,
};