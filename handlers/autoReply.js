const { NewMessage } = require('telegram/events');
const config = require('../config');
const autoreplyConfig = require('../autoreply.json');

/**
 * Handler untuk auto reply
 * Mendengarkan pesan dari bot tertentu dan membalas otomatis
 * 
 * @param {TelegramClient} client - Instance Telegram client
 * @param {object} config - Konfigurasi
 * @returns {Function} Function to remove the event handler
 */
function setupAutoReply(client) {
  // Use target_bot_id from autoreply.json, fallback to .env
  const targetBotId = autoreplyConfig.target_bot_id || config.TARGET_BOT_ID;
  const debugMode = autoreplyConfig.debug || false;
  
  console.log('\n🤖 Mode Auto Reply aktif...');
  console.log(`   Target Bot ID: ${targetBotId}`);
  console.log(`   Auto-reply rules loaded: ${autoreplyConfig.auto_replies.length}`);
  if (debugMode) {
    console.log('   🐛 Debug mode: ON');
  }
  autoreplyConfig.auto_replies.forEach((rule, idx) => {
    const replyPreview = Array.isArray(rule.reply) 
      ? `[${rule.reply.length} variations]` 
      : `"${rule.reply}"`;
    console.log(`   [${idx + 1}] ${rule.name}: "${rule.triggers[0]}" → ${replyPreview}`);
  });
  console.log('   Tekan Ctrl+C untuk berhenti.\n');

  // Handler untuk pesan baru
  const handler = async (event) => {
    try {
      const message = event.message;
      const sender = await message.getSender();

      // Cek apakah pesan originates from target bot ID
      // sender.id bisa BigInt, gunakan String() untuk comparison yang reliable
      if (sender && sender.id && targetBotId && String(sender.id) === String(targetBotId)) {
        // Log all incoming raw messages when debug mode is ON
        if (debugMode && typeof message.text === 'string') {
          console.log(`📨 [Pesan masuk] ${message.text}`);
        }
        // Cek apakah isi pesan match dengan trigger mana pun
        if (typeof message.text === 'string') {
          await checkAllTriggers(client, message, autoreplyConfig.auto_replies);
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

/**
 * Check all trigger rules and send appropriate reply
 * @param {TelegramClient} client
 * @param {Object} message - Telegram message
 * @param {Array} rules - Array of auto-reply rules from JSON config
 */
async function checkAllTriggers(client, message, rules) {
  const debugMode = autoreplyConfig.debug || false;
  
  for (const rule of rules) {
    if (!rule.triggers || !rule.reply) continue;
    
    // Get reply text (support both single string and array of strings for random selection)
    const replyText = getRandomReply(rule);
    if (!replyText) continue;
    
    for (const trigger of rule.triggers) {
      let isMatch = false;
      
      // Gunakan matching yang tepat sesuai tipe trigger
      if (rule.name === 'co_trigger' || trigger.toLowerCase() === 'co') {
        isMatch = matchesCoTrigger(message.text);
      } else {
        isMatch = matchesTrigger(message.text, trigger);
      }

      if (isMatch) {
        console.log(`✅ [${rule.name}] Trigger terdeteksi: "${trigger}"`);
          
        const chatId = message.chatId || message.peerId;
        if (!chatId) {
          console.warn('⚠️  Tidak dapat menentukan chat ID untuk balasan');
          return;
        }
          
        const sendOptions = { message: replyText };
        if (rule.parseMode) {
          sendOptions.parseMode = rule.parseMode;
        }
          
        await client.sendMessage(chatId, sendOptions);
          
        console.log(`   ↳ Balasan terkirim: "${replyText}"`);
        if (rule.parseMode && debugMode) {
          console.log(`   ↳ Parse mode: ${rule.parseMode}`);
        }
        return;
      }
    }
  }
}

/**
 * Get random reply from rule (supports both single string and array)
 * @param {Object} rule - Auto-reply rule
 * @returns {string|null} Selected reply text or null if invalid
 */
function getRandomReply(rule) {
  if (!rule.reply) return null;
  
  // Support both string (backward compatibility) and array
  if (typeof rule.reply === 'string') {
    return rule.reply;
  }
  
  if (Array.isArray(rule.reply) && rule.reply.length > 0) {
    const randomIndex = Math.floor(Math.random() * rule.reply.length);
    return rule.reply[randomIndex];
  }
  
  return null;
}

/**
 * Check if message matches a trigger using flexible matching
 * @param {string} messageText - The incoming message text
 * @param {string} trigger - The trigger text to match
 * @returns {boolean} True if trigger matches
 */
function matchesTrigger(messageText, trigger) {
  if (!messageText || !trigger) return false;
  
  const normalizedMessage = messageText.trim().normalize('NFC');
  const normalizedTrigger = trigger.trim().normalize('NFC');
  
  // Strategy 1: Exact normalized match
  if (normalizedMessage === normalizedTrigger) return true;
  
  // Strategy 2: Substring match (handles extra formatting)
  if (normalizedMessage.includes(normalizedTrigger)) return true;
  
  // Strategy 3: Emoji-agnostic matching
  const baseTrigger = normalizedTrigger.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
  const messageWithoutEmoji = normalizedMessage.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
  if (messageWithoutEmoji.includes(baseTrigger)) return true;
  
  // Strategy 4: Case-insensitive matching
  if (normalizedMessage.toLowerCase().includes(normalizedTrigger.toLowerCase())) return true;
  
  // Strategy 5: Core keyword only (ignore all non-alphanumeric)
  const messageAlpha = normalizedMessage.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase().trim();
  const triggerAlpha = normalizedTrigger.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase().trim();
  if (messageAlpha.includes(triggerAlpha)) return true;
  
  return false;
}

/**
 * Check for exact "co" trigger
 * Matches only when the entire message (after trim) is exactly "co" (case-insensitive)
 * This prevents false positives from messages like "ce/co" or "ceco"
 * @param {string} messageText - The incoming message text
 * @returns {boolean} True if message is exactly "co"
 */
function matchesCoTrigger(messageText) {
  if (!messageText || typeof messageText !== 'string') return false;
  
  const normalized = messageText.trim().normalize('NFC').toLowerCase();
  
  return normalized === 'co';
}

/**
 * Check for standalone "co" trigger (kept for backward compatibility)
 * This is now handled via checkAllTriggers()
 * @deprecated Use autoreply.json instead
 */
async function checkCoTrigger(client, message) {
  // Deprecated
}

// Export both setupAutoReply and matching functions for testing
module.exports = setupAutoReply;
module.exports.matchesTrigger = matchesTrigger;
module.exports.matchesCoTrigger = matchesCoTrigger;
module.exports.getRandomReply = getRandomReply;