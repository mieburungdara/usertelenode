// src/domain/services/BotInteractionService.js
class BotInteractionService {
  constructor(telegramClient) {
    this.telegramClient = telegramClient;
  }

  async interactWithBot(botUsername, startParam) {
    try {
      const chat = await this.telegramClient.getEntity(`@${botUsername}`);
      await this.telegramClient.sendMessage(chat, { message: `/start ${startParam}` });
      console.log(`✅ Sent /start ${startParam} to @${botUsername}`);

      // Wait for response (simple implementation)
      // Note: Real implementation may need event listeners for updates
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s for potential response
      return { success: true, botUsername, startParam };
    } catch (error) {
      console.log(`❌ Failed to interact with @${botUsername}: ${error.message}`);
      return { success: false, botUsername, startParam, error: error.message };
    }
  }
}

module.exports = BotInteractionService;