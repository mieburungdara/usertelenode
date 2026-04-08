const { NewMessage } = require('telegram/events');
const config = require('../config');

// Guard to prevent duplicate handler registration
let _handlerAdded = false;

/**
 * Handler untuk auto reply
 * Mendengarkan pesan dari bot tertentu dan membalas otomatis
 * 
 * @param {TelegramClient} client - Instance Telegram client
 * @param {object} config - Konfigurasi
 */
async function setupAutoReply(client, onReady) {
  if (_handlerAdded) {
    console.warn('⚠️  Handler sudah terdaftar. Tidak menambah duplikat.');
    if (onReady) onReady();
    return;
  }

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
  
  client.addEventHandler(handler, new NewMessage({ incoming: true, edited: false }));
  _handlerAdded = true;

  console.log('⏳ Menunggu pesan masuk...\n');

  if (onReady) onReady();
}

module.exports = setupAutoReply;