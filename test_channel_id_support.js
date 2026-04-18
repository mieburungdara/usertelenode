// Test for new channel ID functionality
console.log('=== Testing Channel ID Support ===\n');

const { /**
 *
 */
  parseChannelInput,
} = require('./src/domain/services/ScrapingService');

const testCases = [
  {
    /**
     *
     */
    input: '@username',
    /**
     *
     */
    expected: '@username',
    /**
     *
     */
    description: 'Username with @ prefix',
  },
  {
    /**
     *
     */
    input: 'username',
    /**
     *
     */
    expected: '@username',
    /**
     *
     */
    description: 'Username without @ prefix',
  },
  {
    /**
     *
     */
    input: 't.me/username',
    /**
     *
     */
    expected: '@username',
    /**
     *
     */
    description: 'Short t.me URL',
  },
  {
    /**
     *
     */
    input: 'https://t.me/username',
    /**
     *
     */
    expected: '@username',
    /**
     *
     */
    description: 'Full t.me URL',
  },
  {
    /**
     *
     */
    input: '-1001234567890',
    /**
     *
     */
    expected: -1001234567890,
    /**
     *
     */
    description: 'Channel ID with -100 prefix',
  },
  {
    /**
     *
     */
    input: '1234567890',
    /**
     *
     */
    expected: 1234567890,
    /**
     *
     */
    description: 'Numeric ID without prefix',
  },
  {
    /**
     *
     */
    input: '-123456789',
    /**
     *
     */
    expected: -123456789,
    /**
     *
     */
    description: 'Negative numeric ID',
  },
  {
    /**
     *
     */
    input: '',
    /**
     *
     */
    expected: null,
    /**
     *
     */
    description: 'Empty string',
  },
  {
    /**
     *
     */
    input: '   ',
    /**
     *
     */
    expected: null,
    /**
     *
     */
    description: 'Only whitespace',
  },
  {
    /**
     *
     */
    input: '  -1001234567890  ',
    /**
     *
     */
    expected: -1001234567890,
    /**
     *
     */
    description: 'Channel ID with surrounding spaces',
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = parseChannelInput(test.input);
  const success = result === test.expected;

  if (success) {
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Result: ${result} (${typeof result})`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`  Input: "${test.input}"`);
    console.log(`  Expected: ${test.expected} (${typeof test.expected})`);
    console.log(`  Got: ${result} (${typeof result})`);
    failed++;
  }
  console.log('');
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ All channel ID tests PASSED!');
  console.log('\nThe scraper now supports:');
  console.log('  - @username format (e.g., @channelname)');
  console.log('  - Numeric channel ID (e.g., -1001234567890)');
  console.log('  - t.me URLs (e.g., https://t.me/channelname)');
  console.log('\nTo add a new channel:');
  console.log('  1. Run the scraper');
  console.log('  2. Type "add" when prompted for channel');
  console.log('  3. Enter the channel ID or username');
} else {
  process.exit(1);
}
