// Test channel input parsing for Deep Link Scraper
// Verifies that numeric channel IDs and usernames are handled correctly

const deepLinkScraper = require('./handlers/deepLinkScraper');

console.log('=== Testing Channel Input Parsing ===\n');

// Test cases for parseChannelInput
const testCases = [
  // Username formats
  { input: 'contohchannel', expected: '@contohchannel', note: 'Plain username' },
  { input: '@contohchannel', expected: '@contohchannel', note: 'Username with @' },
  { input: '  contohchannel  ', expected: '@contohchannel', note: 'Username with spaces (trimmed)' },
  
  // Numeric channel ID formats
  { input: '-1002558528880', expected: -1002558528880, note: 'Numeric channel ID with -100 prefix' },
  { input: '2558528880', expected: 2558528880, note: 'Numeric ID without prefix' },
  { input: '-123456789', expected: -123456789, note: 'Negative numeric ID' },
  
  // URL formats
  { input: 'https://t.me/contohchannel', expected: '@contohchannel', note: 'Full t.me URL' },
  { input: 't.me/contohchannel', expected: '@contohchannel', note: 'Short t.me URL' },
  { input: 'http://t.me/contohchannel', expected: '@contohchannel', note: 'HTTP t.me URL' },
  
  // Edge cases
  { input: '', expected: null, note: 'Empty string' },
  { input: '   ', expected: null, note: 'Only whitespace' },
  { input: '@', expected: '@', note: 'Only @ symbol' },
];

console.log('Testing parseChannelInput function:\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
  const result = deepLinkScraper.parseChannelInput(test.input);
  
  // For numeric comparison, use strict equality
  const success = result === test.expected;
  
  if (success) passed++;
  else failed++;
  
  console.log(`Test ${idx + 1}: ${success ? '✅' : '❌'} ${test.note}`);
  console.log(`  Input: "${test.input}"`);
  console.log(`  Expected: ${JSON.stringify(test.expected)}`);
  console.log(`  Got: ${JSON.stringify(result)}`);
  console.log('');
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ All channel parsing tests PASSED!');
  console.log('\nThe Deep Link Scraper now supports:');
  console.log('  - @username format (e.g., @contohchannel)');
  console.log('  - Numeric channel ID (e.g., -1002558528880)');
  console.log('  - t.me URLs (e.g., https://t.me/contohchannel)');
  console.log('\nNumeric IDs are passed as numbers to getEntity(),');
  console.log('while usernames are passed as strings with @ prefix.');
} else {
  console.log('\n❌ Some tests FAILED - review parsing logic');
}

module.exports = { testCases, passed, failed };