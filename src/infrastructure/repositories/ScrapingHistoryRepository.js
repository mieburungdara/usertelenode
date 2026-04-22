// src/infrastructure/repositories/ScrapingHistoryRepository.js
// Interface: IScrapingHistoryRepository
/**
 *
 */
class IScrapingHistoryRepository {
  /**
   *
   * @param channel
   * @param startId
   * @param endId
   */
  async saveHistory (channel, startId, endId) { throw new Error('Not implemented'); }
  /**
   *
   * @param channel
   */
  async getLastScrapedId (channel) { throw new Error('Not implemented'); }
}

const prisma = require('../adapters/PrismaClientAdapter');

/**
 * Repository for managing scraping history with SQLite (Prisma)
 */
class ScrapingHistoryRepository {
  /**
   * Generate normalized, case-insensitive key for channel
   * @param {string|number} channel - Channel name or ID
   * @returns {string} Normalized key
   * @private
   */
  _getChannelKey (channel) {
    if (typeof channel === 'number') {
      return String(channel);
    }
    return channel.replace('@', '').trim();
  }

  /**
   * Save last scraped ID for a channel
   */
  async saveHistory (channel, startId, endId) {
    const channelName = String(channel);
    await prisma.channel.upsert({
      where: { channelName },
      update: {
        lastScrapedId: endId,
        lastScrapedAt: new Date(),
      },
      create: {
        channelName,
        lastScrapedId: endId,
        lastScrapedAt: new Date(),
      }
    });
  }

  /**
   * Get last scraped message ID for a channel
   */
  async getLastScrapedId (channel) {
    const ch = await prisma.channel.findUnique({
      where: { channelName: String(channel) }
    });
    return ch?.lastScrapedId || null;
  }

  /**
   * Get all registered channels
   */
  async getAllChannels () {
    return await prisma.channel.findMany();
  }

  /**
   * Update cache for latest message info
   */
  async updateLastMessageId (channelName, lastMessageId, lastMessageTimestamp, channelTitle) {
    const name = String(channelName);
    await prisma.channel.upsert({
      where: { channelName: name },
      update: {
        channelTitle,
        lastMessageId,
        lastMessageTimestamp: lastMessageTimestamp ? new Date(lastMessageTimestamp) : null,
        lastCheckedAt: new Date(),
      },
      create: {
        channelName: name,
        channelTitle,
        lastMessageId,
        lastMessageTimestamp: lastMessageTimestamp ? new Date(lastMessageTimestamp) : null,
        lastCheckedAt: new Date(),
      }
    });
  }

  /**
   * Add a new channel to track
   */
  async addChannel (channel, title) {
    const channelName = String(channel);
    const existing = await prisma.channel.findUnique({
      where: { channelName }
    });

    if (existing) {
      if (title && !existing.channelTitle) {
        await prisma.channel.update({
          where: { channelName },
          data: { channelTitle: title }
        });
      }
      return false;
    }

    await prisma.channel.create({
      data: {
        channelName,
        channelTitle: title || channelName,
      }
    });
    return true;
  }

  /**
   * Add a scraping session log
   */
  async addScrapingSession (channelName, sessionData) {
    const name = String(channelName);
    const ch = await prisma.channel.findUnique({
      where: { channelName: name }
    });

    if (!ch) return;

    await prisma.scrapingSession.create({
      data: {
        date: sessionData.date ? new Date(sessionData.date) : new Date(),
        startId: sessionData.startId,
        endId: sessionData.endId,
        processed: sessionData.processed || 0,
        linksFound: sessionData.linksFound || 0,
        noLinks: sessionData.noLinks || 0,
        deleted: sessionData.deleted || 0,
        interactions: sessionData.interactions || 0,
        error: sessionData.error,
        channelId: ch.id
      }
    });

    // Update totals
    await prisma.channel.update({
      where: { id: ch.id },
      data: {
        totalLinksFound: { increment: sessionData.linksFound || 0 },
        totalMessagesScraped: { increment: sessionData.processed || 0 },
      }
    });
  }
}

module.exports = { /**
 *
 */
  ScrapingHistoryRepository, /**
 *
 */
  IScrapingHistoryRepository,
};
