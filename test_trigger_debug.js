// Comprehensive test for trigger message matching
// This helps debug why the trigger might not be matching

const config = require('./config');

console.log('=== Trigger Debug Test ===\n');

// Show current config
console.log('Current config:');
console.log(`  TRIGGER_MESSAGE: "${config.TRIGGER_MESSAGE}"`);
console.log(`  Length: ${config.TRIGGER_MESSAGE.length}`);
console.log(`  TARGET_BOT_ID: "${config.TARGET_BOT_ID}"`);
console.log(`  AUTO_REPLY_MESSAGE: "${config.AUTO_REPLY_MESSAGE}"`);

// Detailed code point analysis of the trigger
console.log('\nTrigger code points (hex):');
const trigger = config.TRIGGER_MESSAGE;
for (let i = 0; i < trigger.length; i++) {
  const code = trigger.charCodeAt(i);
  const hex = code.toString(16).padStart(4, '0');
  console.log(`  [${i.toString().padStart(2, '0')}]: 0x${hex} (${trigger[i]})`);
}

// Test variations that might come from Telegram
const testVariations = [
  config.TRIGGER_MESSAGE,                    // Original
  config.TRIGGER_MESSAGE.trim(),             // Trimmed
  'Partner found 😺',                         // Plain copy
  'Partner found 😺',                        // Different source
  'Partner found \u{1F63A}',                 // Using Unicode escape
  `Partner found ${'😺'}`,                    // Template literal
];

console.log('\n--- Testing various representations ---\n');

testVariations.forEach((test, idx) => {
  const normalizedTest = test.trim().normalize('NFC');
  const normalizedTrigger = config.TRIGGER_MESSAGE.trim().normalize('NFC');
  const exactMatch = test === config.TRIGGER_MESSAGE;
  const normalizedMatch = normalizedTest === normalizedTrigger;
  
  console.log(`Variation ${idx + 1}: "${test}"`);
  console.log(`  Trimmed: "${test.trim()}"`);
  console.log(`  Length: ${test.length} (trimmed: ${test.trim().length})`);
  console.log(`  Exact match: ${exactMatch}`);
  console.log(`  Normalized match: ${normalizedMatch}`);
  if (!normalizedMatch) {
    // Show what differs
    const normTest = test.trim().normalize('NFC');
    const normTrig = config.TRIGGER_MESSAGE.trim().normalize('NFC');
    console.log(`  Normalized test: "${normTest}"`);
    console.log(`  Normalized trigger: "${normTrig}"`);
    for (let i = 0; i < Math.max(normTest.length, normTrig.length); i++) {
      const c1 = normTest[i] || '∅';
      const c2 = normTrig[i] || '∅';
      if (c1 !== c2) {
        console.log(`    First diff at position ${i}: test="${c1}" (0x${c1.charCodeAt(0).toString(16)}) vs trigger="${c2}" (0x${c2.charCodeAt(0).toString(16)})`);
        break;
      }
    }
  }
  console.log('');
});

// Check for common hidden characters
console.log('=== Checking for hidden characters ===');
const sampleInputs = [
  'Partner found 😺\n',
  'Partner found 😺\r',
  'Partner found 😺\r\n',
  'Partner found 😺 ',
  ' Partner found 😺',
  'Partner  found 😺',  // double space
];

sampleInputs.forEach((input, idx) => {
  const normalized = input.trim().normalize('NFC');
  const triggerNorm = config.TRIGGER_MESSAGE.trim().normalize('NFC');
  console.log(`"${input.replace(/\n/g, '\\n').replace(/\r/g, '\\r')}" -> trimmed normalized match: ${normalized === triggerNorm}`);
});

console.log('\n=== End of debug ===');