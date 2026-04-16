// src/domain/services/ScrapingService.js
// Interface: IScrapingService
class IScrapingService {
  async scrapeChannel(channel, startId, endId) { throw new Error('Not implemented'); }
}

// Utility function
function parseChannelInput(input) {
  if (!input) return null;
  let cleaned = String(input).trim();
  if (!cleaned) return null;
  if (cleaned.includes('t.me/')) {
    const match = cleaned.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (match) cleaned = match[1];
  }
  if (!cleaned.startsWith('@')) cleaned = '@' + cleaned;
  return cleaned;
}

class ScrapingService {
  constructor(telegramClient, historyRepo) {
    this.telegramClient = telegramClient;
    this.historyRepo = historyRepo;
  }

  async scrapeChannel(channel, startId, endId = null) {
    // Core scraping logic
    let offsetId = startId;
    let allMessages = [];
    let deepLinks = [];

    while (true) {
      const messages = await this.telegramClient.getMessages(channel, { limit: 100, offsetId });
      if (messages.length === 0) break;

      allMessages.push(...messages);
      for (const msg of messages) {
        if (msg.text) {
          const links = msg.text.match(/t\.me\/[^\s]+/g);
          if (links) {
            deepLinks.push(...links.map(link => ({
              link,
              messageId: msg.id,
              timestamp: msg.date
            })));
          }
        }
      }

      // Stop if reached endId or no more messages
      const lastId = messages[messages.length - 1].id;
      if (endId && lastId <= endId) break;

      offsetId = lastId - 1; // Continue from previous
      if (allMessages.length >= 1000) break; // Safety limit
    }

    const endScrapedId = allMessages[allMessages.length - 1]?.id || startId;
    // Update history
    await this.historyRepo.saveHistory(channel, startId, endScrapedId);
    return { messages: allMessages.length, deepLinks };
  }

  async getAvailableChannels() {
    return await this.historyRepo.getAllChannels();
  }

  async checkChannels(savedChannels) {
    const channelCache = [];
    const now = new Date();
    const CACHE_TTL = 60 * 60 * 1000; // 1 hour

    for (const ch of savedChannels) {
      const cachedTimestamp = ch.lastMessageTimestamp ? new Date(ch.lastMessageTimestamp) : null;
      const isCacheValid = cachedTimestamp && (now - cachedTimestamp) < CACHE_TTL;

      if (isCacheValid) {
        channelCache.push({
          channelId: null,
          channelName: ch.channelName,
          lastMessageId: ch.lastMessageId,
          lastScrapedId: ch.lastScrapedId,
          lastMessageTimestamp: ch.lastMessageTimestamp,
          status: ch.lastMessageId ? 'Punya pesan (cache)' : 'Kosong (cache)'
        });
      } else {
        try {
          const entity = await this.telegramClient.getEntity(parseChannelInput(ch.channelName));
          const messages = await this.telegramClient.getMessages(entity, { limit: 1 });
          const msg = messages.length > 0 ? messages[0] : null;
          const messageId = msg ? msg.id : null;
          const messageTimestamp = msg ? msg.date : null;

          channelCache.push({
            channelId: entity.id,
            channelName: ch.channelName,
            lastMessageId: messageId,
            lastScrapedId: ch.lastScrapedId,
            lastMessageTimestamp: messageTimestamp,
            status: msg ? 'Punya pesan' : 'Kosong'
          });

          // Update cache
          await this.historyRepo.updateLastMessageId(ch.channelName, messageId, messageTimestamp ? new Date(messageTimestamp * 1000).toISOString() : null);
        } catch (e) {
          let status = 'Tidak dapat diakses';
          if (e.message && e.message.includes('TIMEOUT')) {
            status = 'Timeout';
          }
          channelCache.push({
            channelId: null,
            channelName: ch.channelName,
            lastMessageId: null,
            lastScrapedId: ch.lastScrapedId,
            lastMessageTimestamp: null,
            status: status
          });
        }
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Filter unique by normalized channelName
    const uniqueCache = channelCache.filter((ch, index, arr) =>
      arr.findIndex(c => c.channelName.trim().toLowerCase() === ch.channelName.trim().toLowerCase()) === index
    );

    // Sort cache by lastMessageTimestamp descending (nulls last)
    uniqueCache.sort((a, b) => {
      if (a.lastMessageTimestamp && b.lastMessageTimestamp) {
        return new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp);
      }
      if (a.lastMessageTimestamp) return -1;
      if (b.lastMessageTimestamp) return 1;
      return 0;
    });

    return uniqueCache;
  }
}

module.exports = { ScrapingService, IScrapingService };