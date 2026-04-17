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
  }

  /**
   * Mengirim perintah /start ke bot dengan parameter tertentu
   * @param {string} botUsername - Username bot (@botname)
   * @param {string} startParam - Parameter untuk /start command
   * @returns {Promise<BotInteractionResult>} Hasil interaksi
   */
  async interactWithBot (botUsername, startParam) {
    try {
      const chat = await this.telegramClient.getEntity(`@${botUsername}`);
      
      // Kirim pesan tanpa await (fire-and-forget) dan tangkap error agar tidak crash
      this.telegramClient.sendMessage(chat, { message: `/start ${startParam}` })
        .then(() => console.log(`✅ Sent /start ${startParam} to @${botUsername}`))
        .catch(err => {
          if (err?.message?.includes('TIMEOUT')) {
             console.log(`⏱️ Timeout pengiriman link @${botUsername} (diabaikan)`);
          } else {
             console.log(`❌ Error Background pengiriman ke @${botUsername}: ${err.message}`);
          }
        });

      // Kembalikan sukses seketika karena kita tidak menunggu balasan

      return {
        /**
         *
         */
        success: true,
        /**
         *
         */
        botUsername,
        /**
         *
         */
        startParam,
      };
    } catch (error) {
      console.log(`❌ Failed to interact with @${botUsername}: ${error.message}`);
      return {
        /**
         *
         */
        success: false,
        /**
         *
         */
        botUsername,
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
