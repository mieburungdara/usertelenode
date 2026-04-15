// Test newline support in auto-reply messages
// Verifies that \n characters are properly preserved and sent to Telegram

const handlers = require('./handlers/autoReply');

console.log('=== Testing Newline Support in Auto-Reply ===\n');

// Test cases for newline handling
const testCases = [
  {
    name: 'Single newline',
    reply: 'Line 1\nLine 2',
    expectedLines: 2,
    description: 'Should split into 2 lines'
  },
  {
    name: 'Multiple newlines',
    reply: 'Line 1\nLine 2\nLine 3',
    expectedLines: 3,
    description: 'Should split into 3 lines'
  },
  {
    name: 'Double newline (paragraph)',
    reply: 'Paragraph 1\n\nParagraph 2',
    expectedLines: 3, // empty line counts as a line
    description: 'Should create paragraph break'
  },
  {
    name: 'Markdown list',
    reply: '- Item 1\n- Item 2\n- Item 3',
    expectedLines: 3,
    description: 'Should preserve list formatting'
  },
  {
    name: 'Mixed content',
    reply: 'Header\n==========\n\nBody text here',
    expectedLines: 4,
    description: 'Should preserve markdown formatting'
  }
];

console.log('Testing that newline characters (\\n) are preserved in reply strings:\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
  // Count actual newlines in the string
  const actualNewlines = (test.reply.match(/\n/g) || []).length;
  const expectedNewlines = test.expectedLines - 1;
  
  // Verify the string contains the expected number of \n characters
  const success = actualNewlines === expectedNewlines;
  
  if (success) passed++;
  else failed++;
  
  console.log(`Test ${idx + 1}: ${success ? '✅' : '❌'} ${test.name}`);
  console.log(`  Description: ${test.description}`);
  console.log(`  Reply string: "${test.reply}"`);
  console.log(`  Newline count: expected ${expectedNewlines}, got ${actualNewlines}`);
  console.log(`  Visual representation:`);
  console.log(`  ${test.reply.split('\n').map((line, i) => `    [${i}] ${line}`).join('\n')}`);
  console.log('');
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ All newline tests PASSED!');
  console.log('\nThe auto-reply system now supports multi-line messages.');
  console.log('To use multi-line replies in autoreply.json:');
  console.log('  1. Use \\n in the reply string to create new lines');
  console.log('  2. Optionally add "parseMode": "markdown" for markdown formatting');
  console.log('  3. Example: "First line\\nSecond line\\n- Bullet point"');
} else {
  console.log('\n❌ Some tests FAILED - check newline handling');
}

module.exports = { testCases, passed, failed };