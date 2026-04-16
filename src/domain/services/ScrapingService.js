// src/domain/services/ScrapingService.js
// Interface: IScrapingService
class IScrapingService {
  async scrapeChannel(channel, startId) { throw new Error('Not implemented'); }
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

  async scrapeChannel(channel, startId) {
    // Core scraping logic
    const messages = await this.telegramClient.getMessages(channel, { limit: 100, offsetId: startId });
    const deepLinks = messages.filter(msg => msg.text && msg.text.includes('t.me/'));
    // Update history
    await this.historyRepo.saveHistory(channel, startId, messages[messages.length - 1]?.id || startId);
    return { messages: messages.length, deepLinks: deepLinks.length };
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