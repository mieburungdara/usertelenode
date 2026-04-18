// Test various trigger message possibilities
// Helps identify what the bot actually sends

const config = require('./config');

console.log('=== Testing Trigger Variations ===\n');

const testVariations = [
  // With emoji variations
  'Partner found 😺',
  'Partner found 😺',
  'Partner found 🐱',
  'Partner found 🐈',

  // Without emoji
  'Partner found',
  'partner found',
  'Partner found ',
  ' partner found ',

  // Punctuation variations
  'Partner found!',
  'Partner found.',
  'Partner found',

  // Spacing variations
  'Partner  found',
  'Partner   found',
  'Partner\tfound',

  // Different capitalizations
  'PARTNER FOUND',
  'Partner Found',
  'pArTnEr fOuNd',

  // Unicode space variations
  'Partner\u00A0found', // non-breaking space
  'Partner\u200Bfound', // zero-width space
];

const normalizedTrigger = config.TRIGGER_MESSAGE.trim().normalize('NFC');

console.log(`Expected trigger: "${config.TRIGGER_MESSAGE}"`);
console.log(`Normalized trigger: "${normalizedTrigger}"`);
console.log('');

let matchCount = 0;

testVariations.forEach((test, idx) => {
  const normalizedTest = test.trim().normalize('NFC');
  const strictMatch = test === config.TRIGGER_MESSAGE;
  const normalizedMatch = normalizedTest === normalizedTrigger;

  if (normalizedMatch) { matchCount++; }

  console.log(`Test ${idx + 1}: "${test}"`);
  console.log(`  Normalized: "${normalizedTest}"`);
  console.log(`  Strict match: ${strictMatch}`);
  console.log(`  Normalized match: ${normalizedMatch}`);
  console.log('');
});

console.log(`=== Summary: ${matchCount}/${testVariations.length} variations matched ===`);

// Test case-insensitive matching as an alternative approach
console.log('\n=== Case-insensitive matching test ===');
const caseInsensitiveTrigger = normalizedTrigger.toLowerCase();
testVariations.forEach((test, idx) => {
  const normalizedTest = test.trim().normalize('NFC').toLowerCase();
  const ciMatch = normalizedTest === caseInsensitiveTrigger;
  if (ciMatch) {
    console.log(`  "${test}" MATCHES case-insensitive`);
  }
});

console.log('\n=== Recommendations ===');
if (matchCount === 0) {
  console.log('No variations matched! The trigger in config.js may not match what the bot actually sends.');
  console.log('Consider checking:');
  console.log('1. What exact text does the bot send?');
  console.log('2. Does it include the emoji or not?');
  console.log('3. Are there hidden/zero-width characters?');
}
