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
          success: false,
          botUsername: normalizedBotUsername,
          startParam,
          error: 'Rate limited'
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

      // Wait for bot response (Actual Functionality)
      console.log(`⏳ Waiting for response from @${normalizedBotUsername}...`);
      const responseMsg = await this.telegramClient.waitForNextMessage(chat, { 
        afterTime: sendTime,
        timeout: 10000 // 10s timeout
      });

      if (responseMsg) {
        console.log(`📩 Received response from @${normalizedBotUsername}`);
        return {
          success: true,
          botUsername: normalizedBotUsername,
          startParam,
          response: responseMsg
        };
      } else {
        console.log(`⚠️ No response from @${normalizedBotUsername} within timeout`);
        return {
          success: false,
          botUsername: normalizedBotUsername,
          startParam,
          error: 'Timeout waiting for response'
        };
      }
    } catch (error) {
      const normalizedBotUsername = botUsername?.replace?.(/^@+/, '') || botUsername;
      console.log(`❌ Failed to interact with @${normalizedBotUsername}: ${error.message}`);
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
