// Test with the ACTUAL bot message from debug output
// Message: "__Partner found__ 😺"

const config = require('./config');

console.log('=== Testing with Actual Bot Message ===\n');

const actualBotMessage = `__Partner found__ 😺

/next — __find a new partner__
/stop — __stop this chat__

\`https://t.me/chatbot\``;

console.log('Actual bot message:');
console.log(actualBotMessage);
console.log('');

console.log('Config trigger:', config.TRIGGER_MESSAGE);
console.log('');

// Test the matching logic
/**
 *
 * @param messageText
 */
function testTriggerMatch (messageText) {
  if (config.TRIGGER_MESSAGE && typeof messageText === 'string') {
    const normalizedMessage = messageText.trim().normalize('NFC');
    const normalizedTrigger = config.TRIGGER_MESSAGE.trim().normalize('NFC');

    console.log('Normalized message (first 50 chars):', normalizedMessage.substring(0, 50));
    console.log('Normalized trigger:', normalizedTrigger);
    console.log('');

    // Strategy 1: Exact match
    let triggerDetected = normalizedMessage === normalizedTrigger;
    let strategy = 'none';
    console.log('Strategy 1 (exact):', triggerDetected);

    // Strategy 2: Substring match
    if (!triggerDetected) {
      triggerDetected = normalizedMessage.includes(normalizedTrigger);
      if (triggerDetected) { strategy = 'substring-match'; }
      console.log('Strategy 2 (substring):', triggerDetected);
    }

    // Strategy 3: Emoji-agnostic substring
    if (!triggerDetected) {
      const baseTrigger = normalizedTrigger.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
      const messageWithoutEmoji = normalizedMessage.replace(/[\u{10000}-\u{10FFFF}]/gu, '').trim();
      console.log('Message without emoji (first 50):', messageWithoutEmoji.substring(0, 50));
      console.log('Base trigger:', baseTrigger);
      triggerDetected = messageWithoutEmoji.includes(baseTrigger);
      if (triggerDetected) { strategy = 'substring-no-emoji'; }
      console.log('Strategy 3 (substring no-emoji):', triggerDetected);
    }

    // Strategy 4: Core keyword
    if (!triggerDetected) {
      const messageAlpha = normalizedMessage.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase().trim();
      const triggerAlpha = normalizedTrigger.replace(/[^\p{L}\p{N}\s]/gu, '').toLowerCase().trim();
      console.log('Message alpha-only:', messageAlpha.substring(0, 50));
      console.log('Trigger alpha-only:', triggerAlpha);
      triggerDetected = messageAlpha.includes(triggerAlpha);
      if (triggerDetected) { strategy = 'keyword-only'; }
      console.log('Strategy 4 (keyword-only):', triggerDetected);
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

const result = testTriggerMatch(actualBotMessage);
console.log('\n=== RESULT ===');
console.log('Match:', result.matched ? '✅ YES' : '❌ NO');
if (result.matched) {
  console.log('Strategy:', result.strategy);
} else {
  console.log('No matching strategy succeeded - need to adjust matching logic');
}
