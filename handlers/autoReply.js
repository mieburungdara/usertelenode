const { NewMessage } = require('telegram/events');
const config = require('../config');

/**
 * Handler untuk auto reply
 * Mendengarkan pesan dari bot tertentu dan membalas otomatis
 * 
 * @param {TelegramClient} client - Instance Telegram client
 * @param {object} config - Konfigurasi
 * @returns {Function} Function to remove the event handler
 */
function setupAutoReply(client) {
  console.log('\n🤖 Mode Auto Reply aktif...');
  console.log(`   Target Bot ID: ${config.TARGET_BOT_ID}`);
  console.log(`   Trigger: "${config.TRIGGER_MESSAGE}"`);
  console.log(`   Reply: "${config.AUTO_REPLY_MESSAGE}"`);
  console.log('   Tekan Ctrl+C untuk berhenti.\n');

  // Handler untuk pesan baru
  const handler = async (event) => {
    try {
      const message = event.message;
      const sender = await message.getSender();

      // Cek apakah pesan berasal dari target bot ID
      // sender.id bisa BigInt, gunakan String() untuk comparison yang reliable
      if (sender && sender.id && config.TARGET_BOT_ID && String(sender.id) === String(config.TARGET_BOT_ID)) {
        // Cek apakah isi pesan match dengan trigger (skip if trigger is empty, trim both sides)
        if (config.TRIGGER_MESSAGE && typeof message.text === 'string' && message.text.trim() === config.TRIGGER_MESSAGE.trim()) {
          console.log(`✅ Trigger terdeteksi dari bot ID ${config.TARGET_BOT_ID}`);
          console.log(`   Pesan: ${message.text}`);
          
          // Kirim balasan
          // Use chatId for group/channel, peerId for private chat
          const chatId = message.chatId || message.peerId;
          if (!chatId) {
            console.warn('⚠️  Tidak dapat menentukan chat ID untuk balasan');
            return;
          }
          await client.sendMessage(chatId, {
            message: config.AUTO_REPLY_MESSAGE,
            replyTo: message.id
          });
          
          console.log(`   ↳ Balasan terkirim: "${config.AUTO_REPLY_MESSAGE}"`);
        }
      }
    } catch (error) {
      console.error('❌ Error di autoReply handler:', error.message);
    }
  };
  
  // Add event handler
  client.addEventHandler(handler, new NewMessage({ incoming: true, edited: false }));
  
  console.log('⏳ Menunggu pesan masuk...\n');

  // Return cleanup function
  return () => {
    // Note: GramJS doesn't provide a direct removeEventHandler, but we can track it
    // For now, the handler will be cleaned when client disconnects
    console.log('🧹 Auto reply handler cleanup requested');
  };
}

module.exports = setupAutoReply;