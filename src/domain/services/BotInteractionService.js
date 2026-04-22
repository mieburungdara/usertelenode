/**
 * @file Domain service untuk interaksi bot Telegram
 * @description Mengelola interaksi dengan bot melalui deep link, termasuk chaining deeplink
 */
const { extractDeepLinks } = require('../../../utils/linkParser');

class BotInteractionService {
  /**
   * Membuat instance BotInteractionService
   * @param {ITelegramClient} telegramClient - Client Telegram untuk interaksi
   */
  constructor (telegramClient) {
    this.telegramClient = telegramClient;
    this.lastInteractionTimestamps = new Map();
    this.MIN_INTERACTION_DELAY_MS = 2500; // Minimal 2.5 detik antar bot
    this.MAX_CHAIN_DEPTH = 5; // Maksimal kedalaman chaining deeplink
  }

  /**
   * Mengirim perintah /start ke bot dan mengikuti deeplink chain hingga mendapatkan media
   * @param {string} botUsername - Username bot (@botname)
   * @param {string} startParam - Parameter untuk /start command
   * @param {number} depth - Kedalaman chain saat ini (internal)
   * @returns {Promise<BotInteractionResult>} Hasil interaksi
   */
  async interactWithBot (botUsername, startParam, depth = 0) {
    try {
      // Normalize bot username (hindari double @)
      const normalizedBotUsername = botUsername.replace(/^@+/, '');

      // Safety: cegah infinite loop
      if (depth > this.MAX_CHAIN_DEPTH) {
        console.log(`\x1b[33m⚠️ Max chain depth (${this.MAX_CHAIN_DEPTH}) reached. Stopping.\x1b[0m`);
        return {
          success: false,
          botUsername: normalizedBotUsername,
          startParam,
          error: `Max deeplink chain depth (${this.MAX_CHAIN_DEPTH}) reached`,
        };
      }

      // Rate limiting per bot
      const now = Date.now();
      const lastInteraction = this.lastInteractionTimestamps.get(normalizedBotUsername) || 0;

      if (now - lastInteraction < this.MIN_INTERACTION_DELAY_MS) {
        console.log(`⏳ Rate limit aktif untuk @${normalizedBotUsername}, menunggu...`);
        await new Promise(r => setTimeout(r, this.MIN_INTERACTION_DELAY_MS));
      }

      this.lastInteractionTimestamps.set(normalizedBotUsername, Date.now());

      // Bersihkan timestamp yang sudah tua setiap 100 entri
      if (this.lastInteractionTimestamps.size > 100) {
        const oneMinuteAgo = Date.now() - 60000;
        for (const [key, timestamp] of this.lastInteractionTimestamps.entries()) {
          if (timestamp < oneMinuteAgo) {
            this.lastInteractionTimestamps.delete(key);
          }
        }
      }

      const chat = await this.telegramClient.getEntity(`@${normalizedBotUsername}`);
      const sendTime = Math.floor(Date.now() / 1000);

      await this.telegramClient.sendMessage(chat, `/start ${startParam}`);
      const depthLabel = depth > 0 ? ` [chain depth: ${depth}]` : '';
      console.log(`\x1b[32m✅ Sent /start ${startParam} to @${normalizedBotUsername}${depthLabel}\x1b[0m`);

      // Wait for bot response with multiple message support
      console.log(`⏳ Waiting for response from @${normalizedBotUsername}...`);

      let finalResponse = null;
      const collectedDeepLinks = []; // Kumpulkan semua deeplink dari semua pesan
      const startTime = Date.now();
      const timeout = 20000; // 20s for slow bots
      let lastSeenId = 0;

      while (Date.now() - startTime < timeout) {
        const responseMsg = await this.telegramClient.waitForNextMessage(chat, {
          afterTime: sendTime,
          afterId: lastSeenId,
          timeout: 5000,
        });

        if (responseMsg) {
          console.log(`📩 Received message from @${normalizedBotUsername}`);
          finalResponse = responseMsg;
          lastSeenId = responseMsg.id;

          // Robust media check
          const hasMedia = responseMsg.media && (
            responseMsg.media.photo ||
            responseMsg.media.video ||
            responseMsg.media.document ||
            responseMsg.media.webPage
          );

          if (hasMedia) {
            console.log(`\x1b[32m✅ Media detected in response!\x1b[0m`);
            return {
              success: true,
              botUsername: normalizedBotUsername,
              startParam,
              response: finalResponse,
            };
          }

          // Cek apakah pesan mengandung deeplink
          const msgText = responseMsg.message || '';
          const foundLinks = extractDeepLinks(msgText);

          if (foundLinks.length > 0) {
            console.log(`\x1b[36m🔗 Bot merespons dengan ${foundLinks.length} deeplink, akan diikuti...${depthLabel}\x1b[0m`);
            for (const link of foundLinks) {
              collectedDeepLinks.push(link);
            }
          } else {
            console.log(`ℹ️ Message is text-only: "${msgText.substring(0, 50) || '(empty)'}". Waiting for more...`);
          }
        } else {
          // No new message found in this poll cycle
          if (finalResponse) break;
        }
      }

      // Jika ada deeplink yang terkumpul, ikuti semuanya secara berurutan
      if (collectedDeepLinks.length > 0) {
        console.log(`\x1b[35m🔄 Following ${collectedDeepLinks.length} chained deeplink(s)...\x1b[0m`);

        for (const link of collectedDeepLinks) {
          console.log(`\x1b[35m🎯 Chain → @${link.botUsername}?start=${link.startData}\x1b[0m`);

          // Human-like delay sebelum mengikuti chain
          await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));

          const chainResult = await this.interactWithBot(link.botUsername, link.startData, depth + 1);

          if (chainResult.success) {
            // Cek apakah response chain memiliki media
            const chainHasMedia = chainResult.response && chainResult.response.media && (
              chainResult.response.media.photo ||
              chainResult.response.media.video ||
              chainResult.response.media.document ||
              chainResult.response.media.webPage
            );

            if (chainHasMedia) {
              console.log(`\x1b[32m✅ Media found via deeplink chain!\x1b[0m`);
              return chainResult;
            }
          }
        }

        // Semua chain dicoba tapi tidak ada media
        console.log(`\x1b[31m⚠️ All chained deeplinks exhausted, no media found.\x1b[0m`);
        return {
          success: true,
          botUsername: normalizedBotUsername,
          startParam,
          response: finalResponse,
        };
      }

      // Tidak ada deeplink dan tidak ada media
      if (finalResponse) {
        return {
          success: true,
          botUsername: normalizedBotUsername,
          startParam,
          response: finalResponse,
        };
      } else {
        console.log(`⚠️ No response from @${normalizedBotUsername} within timeout`);
        return {
          success: false,
          botUsername: normalizedBotUsername,
          startParam,
          error: 'Timeout waiting for response',
        };
      }
    } catch (error) {
      const normalizedBotUsername = botUsername?.replace?.(/^@+/, '') || botUsername;
      console.log(`\x1b[31m❌ Failed to interact with @${normalizedBotUsername}: ${error.message}\x1b[0m`);
      return {
        success: false,
        botUsername: normalizedBotUsername,
        startParam,
        error: error.message,
      };
    }
  }
}

module.exports = BotInteractionService;
