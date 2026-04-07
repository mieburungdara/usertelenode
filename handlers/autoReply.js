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
      if (sender && sender.id && String(sender.id) === String(config.TARGET_BOT_ID)) {
        // Cek apakah isi pesan match dengan trigger (skip if trigger is empty)
        if (config.TRIGGER_MESSAGE && message.text && message.text.trim() === config.TRIGGER_MESSAGE) {
          console.log(`✅ Trigger terdeteksi dari bot ID ${config.TARGET_BOT_ID}`);
          console.log(`   Pesan: ${message.text}`);
          
          // Kirim balasan
          await client.sendMessage(message.peerId || message.chatId, {
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
  
  client.addEventHandler(handler, new NewMessage({}));
  _handlerAdded = true;

  console.log('⏳ Menunggu pesan masuk...\n');

  if (onReady) onReady();
}

module.exports = setupAutoReply;