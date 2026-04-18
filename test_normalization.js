// Test script to verify emoji normalization fix
// This tests that different Unicode representations of "😺" match

const config = require('./config');

console.log('=== Testing Emoji Normalization ===\n');

// Current trigger from config
const trigger = config.TRIGGER_MESSAGE.trim();
console.log(`Config trigger: "${trigger}"`);
console.log(`Trigger length: ${trigger.length} chars`);
console.log('Trigger code points:');
for (let i = 0; i < trigger.length; i++) {
  console.log(`  [${i}]: ${trigger.charCodeAt(i).toString(16)} (${trigger[i]})`);
}

// Test variations of the same emoji
const testCases = [
  'Partner found 😺', // Standard form
  'Partner found 😺', // May appear same but could be different Unicode
];

console.log('\n--- Testing message variations ---\n');

testCases.forEach((testMsg, idx) => {
  const normalizedMsg = testMsg.trim().normalize('NFC');
  const normalizedTrigger = trigger.normalize('NFC');

  console.log(`Test ${idx + 1}: "${testMsg}"`);
  console.log(`  Normalized: "${normalizedMsg}"`);
  console.log(`  Match: ${normalizedMsg === normalizedTrigger}`);
  console.log('');
});

console.log('=== Test complete ===');
console.log('\nIf all "Match" values are true, the normalization is working correctly.');
