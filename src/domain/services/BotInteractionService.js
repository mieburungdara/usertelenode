/**
 * @file Domain service untuk interaksi bot Telegram
 * @description Mengelola interaksi dengan bot melalui deep link
 */
class BotInteractionService {
  /**
   * Membuat instance BotInteractionService
   * @param {ITelegramClient} telegramClient - Client Telegram untuk interaksi
   */
  constructor (telegramClient) {
    this.telegramClient = telegramClient;
    this.lastInteractionTimestamps = new Map();
    this.MIN_INTERACTION_DELAY_MS = 2500; // Minimal 2.5 detik antar bot
  }

  /**
   * Mengirim perintah /start ke bot dengan parameter tertentu
   * @param {string} botUsername - Username bot (@botname)
   * @param {string} startParam - Parameter untuk /start command
   * @returns {Promise<BotInteractionResult>} Hasil interaksi
   */
  async interactWithBot (botUsername, startParam) {
    try {
      // Normalize bot username (hindari double @)
      const normalizedBotUsername = botUsername.replace(/^@+/, '');

      // Rate limiting per bot
      const now = Date.now();
      const lastInteraction = this.lastInteractionTimestamps.get(normalizedBotUsername) || 0;

      if (now - lastInteraction < this.MIN_INTERACTION_DELAY_MS) {
        console.log(`⏳ Rate limit aktif untuk @${normalizedBotUsername}, lewati interaksi`);
        return {
          /**
           *
           */
          success: false,
          /**
           *
           */
          botUsername: normalizedBotUsername,
          /**
           *
           */
          startParam,
          /**
           *
           */
          error: 'Rate limited',
        };
      }

      this.lastInteractionTimestamps.set(normalizedBotUsername, now);

      // Bersihkan timestamp yang sudah tua setiap 100 entri
      if (this.lastInteractionTimestamps.size > 100) {
        const oneMinuteAgo = now - 60000;
        for (const [key, timestamp] of this.lastInteractionTimestamps.entries()) {
          if (timestamp < oneMinuteAgo) {
            this.lastInteractionTimestamps.delete(key);
          }
        }
      }

      const chat = await this.telegramClient.getEntity(`@${normalizedBotUsername}`);
      const sendTime = Math.floor(Date.now() / 1000);

      await this.telegramClient.sendMessage(chat, `/start ${startParam}`);
      console.log(`✅ Sent /start ${startParam} to @${normalizedBotUsername}`);

      // Wait for bot response with multiple message support (Actual Functionality)
      console.log(`⏳ Waiting for response from @${normalizedBotUsername}...`);
      
      let finalResponse = null;
      const startTime = Date.now();
      const timeout = 20000; // 20s for slow bots
      let lastCheckedTime = sendTime;
      let lastSeenId = 0;

      while (Date.now() - startTime < timeout) {
        const responseMsg = await this.telegramClient.waitForNextMessage(chat, {
          afterTime: lastCheckedTime,
          afterId: lastSeenId,
          timeout: 5000,
        });

        if (responseMsg) {
          console.log(`📩 Received message from @${normalizedBotUsername}`);
          finalResponse = responseMsg;
          lastSeenId = responseMsg.id; // Track this message ID so we skip it next time
          
          // Robust media check on the received message
          const hasMedia = responseMsg.media && (
            responseMsg.media.photo || 
            responseMsg.media.video || 
            responseMsg.media.document ||
            responseMsg.media.webPage
          );

          if (hasMedia) {
            console.log(`✅ Media detected in response!`);
            break; // Found media, we can stop waiting
          } else {
            console.log(`ℹ️ Message is text-only: "${responseMsg.message?.substring(0, 50) || '(empty)'}". Waiting for media...`);
            // Keep lastCheckedTime the same, but afterId ensures we skip this message
          }
        } else {
          // No new message found in this poll cycle
          if (finalResponse) break; // We already have at least one response, stop waiting
        }
      }

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
      console.log(`❌ Failed to interact with @${normalizedBotUsername}: ${error.message}`);
      return {
        /**
         *
         */
        success: false,
        /**
         *
         */
        botUsername: normalizedBotUsername,
        /**
         *
         */
        startParam,
        /**
         *
         */
        error: error.message,
      };
    }
  }
}

module.exports = BotInteractionService;
