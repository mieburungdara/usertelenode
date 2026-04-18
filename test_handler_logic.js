// Test the actual handler logic with various message inputs
// Simulates what the bot might send

const config = require('./config');

console.log('=== Testing Handler Logic ===\n');

// The three matching strategies from autoReply.js
/**
 *
 * @param messageText
 */
function testTriggerMatch (messageText) {
  if (config.TRIGGER_MESSAGE && typeof messageText === 'string') {
    const normalizedMessage = messageText.trim().normalize('NFC');
    const normalizedTrigger = config.TRIGGER_MESSAGE.trim().normalize('NFC');

    // Strategy 1: Exact normalized match
    let triggerDetected = normalizedMessage === normalizedTrigger;
    let strategy = 'none';

    // Strategy 2: Emoji-agnostic matching
    if (!triggerDetected) {
      const baseTrigger = normalizedTrigger.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
      const messageBase = normalizedMessage.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
      triggerDetected = messageBase === baseTrigger;
      strategy = 'emoji-agnostic';
    }

    // Strategy 3: Case-insensitive and emoji-insensitive
    if (!triggerDetected) {
      const messageLower = normalizedMessage.toLowerCase();
      const triggerLower = normalizedTrigger.toLowerCase();
      const messageAlpha = messageLower.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
      const triggerAlpha = triggerLower.replace(/[^\p{L}\p{N}\s]/gu, '').trim();
      triggerDetected = messageAlpha === triggerAlpha;
      strategy = 'case+emoji-insensitive';
    }

    return { /**
     *
     */
      matched: triggerDetected, /**
     *
     */
      strategy,
    };
  }
  return { /**
   *
   */
    matched: false, /**
   *
   */
    strategy: 'none',
  };
}

// Test cases that the bot might actually send
const testCases = [
  'Partner found 😺', // With emoji (original)
  'Partner found', // Without emoji - most likely
  'partner found', // lowercase
  'Partner found!', // With punctuation
  'Partner found.', // With period
  'Partner found', // Clean text
];

console.log(`Config trigger: "${config.TRIGGER_MESSAGE}"`);
console.log(`Bot ID: ${config.TARGET_BOT_ID}`);
console.log(`Auto-reply: "${config.AUTO_REPLY_MESSAGE}"`);
console.log('');

testCases.forEach((testMsg, idx) => {
  const result = testTriggerMatch(testMsg);
  console.log(`Test ${idx + 1}: "${testMsg}"`);
  console.log(`  Match: ${result.matched ? '✅ YES' : '❌ NO'}`);
  if (result.matched) {
    console.log(`  Strategy: ${result.strategy}`);
  }
  console.log('');
});

console.log('=== Expected Behavior ===');
console.log('If "Partner found" (without emoji) shows ✅, then the fix is working!');
console.log('The bot appears to send "Partner found" without the emoji 😺');
