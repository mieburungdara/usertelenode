// Test the JSON-based auto-reply configuration
// Verifies that the new system works correctly

const autoreplyConfig = require('./autoreply.json');

console.log('=== Testing Auto-Reply JSON Config ===\n');

console.log('Config loaded:');
console.log(`  Target Bot ID: ${autoreplyConfig.target_bot_id}`);
console.log(`  Number of rules: ${autoreplyConfig.auto_replies.length}`);
console.log('');

autoreplyConfig.auto_replies.forEach((rule, idx) => {
  console.log(`Rule ${idx + 1}: ${rule.name}`);
  console.log(`  Description: ${rule.description}`);
  console.log(`  Triggers (${rule.triggers.length}):`);
  rule.triggers.forEach((t, i) => console.log(`    [${i}] "${t}"`));
  console.log(`  Reply: "${rule.reply}"`);
  console.log('');
});

// Test the matching functions
const handlers = require('./handlers/autoReply');

console.log('=== Testing Trigger Matching ===\n');

const testMatrix = [
  // Test rule 1: partner_found - uses flexible matching
  {
    /**
     *
     */
    message: '__Partner found__ 😺',
    /**
     *
     */
    trigger: 'Partner found 😺',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'partner_found: with markdown and emoji',
    /**
     *
     */
    useCoMatcher: false,
  },
  {
    /**
     *
     */
    message: 'Partner found',
    /**
     *
     */
    trigger: 'Partner found',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'partner_found: plain text',
    /**
     *
     */
    useCoMatcher: false,
  },
  {
    /**
     *
     */
    message: 'partner found',
    /**
     *
     */
    trigger: 'Partner found 😺',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'partner_found: case insensitive',
    /**
     *
     */
    useCoMatcher: false,
  },
  {
    /**
     *
     */
    message: 'something else',
    /**
     *
     */
    trigger: 'Partner found 😺',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'partner_found: no match',
    /**
     *
     */
    useCoMatcher: false,
  },

  // Test rule 2: co_trigger - EXACT MATCH only (no longer word-boundary)
  {
    /**
     *
     */
    message: 'co',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'co_trigger: exact "co"',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'Co',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'co_trigger: exact "Co" (capitalized)',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: ' co ',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: true,
    /**
     *
     */
    note: 'co_trigger: with surrounding spaces (trimmed)',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'co!',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: with punctuation → NOT exact',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'Co partner',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: part of longer message → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'hey co!',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: embedded with punctuation → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'coco',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: part of word → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'co-op',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: hyphenated → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'cooper',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: starts with co but continues → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'acorn',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: co inside word → NO',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'ce/co',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: slash-separated → NO (false positive fixed)',
    /**
     *
     */
    useCoMatcher: true,
  },
  {
    /**
     *
     */
    message: 'ceco',
    /**
     *
     */
    trigger: 'co',
    /**
     *
     */
    expected: false,
    /**
     *
     */
    note: 'co_trigger: embedded in ceco → NO (false positive fixed)',
    /**
     *
     */
    useCoMatcher: true,
  },
];

let passed = 0;
let failed = 0;

testMatrix.forEach((test, idx) => {
  let result;
  if (test.useCoMatcher) {
    result = handlers.matchesCoTrigger ? handlers.matchesCoTrigger(test.message) : false;
  } else {
    result = handlers.matchesTrigger(test.message, test.trigger);
  }

  const success = result === test.expected;

  if (success) { passed++; } else { failed++; }

  console.log(`Test ${idx + 1}: ${success ? '✅' : '❌'} ${test.note}`);
  console.log(`  Message: "${test.message}"`);
  console.log(`  Trigger: "${test.trigger}"`);
  console.log(`  Expected: ${test.expected}, Got: ${result}`);
  console.log('');
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${testMatrix.length}`);
console.log(`Failed: ${failed}/${testMatrix.length}`);

if (failed === 0) {
  console.log('\n✅ All matching tests PASSED!');
  console.log('\nThe JSON configuration system is ready to use.');
  console.log('You can now edit autoreply.json to customize triggers and replies.');
  console.log('\nNote: The "co" trigger now uses EXACT MATCH (after trim, case-insensitive).');
  console.log('  This prevents false positives from messages like "ce/co" or "ceco".');
  console.log('  Only messages that are exactly "co" (ignoring case/whitespace) will trigger.');
} else {
  console.log('\n❌ Some tests FAILED - review matching logic');
}

module.exports = {};
