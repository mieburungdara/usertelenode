// Test the "co" trigger functionality
// This verifies the secondary trigger that responds with "/next"

const config = require('./config');

console.log('=== Testing "co" Trigger ===\n');

// Simulate checkCoTrigger function with UPDATED pattern
/**
 *
 * @param messageText
 */
function checkCoTrigger (messageText) {
  if (typeof messageText !== 'string') { return false; }

  const normalizedMessage = messageText.trim().normalize('NFC');
  const messageLower = normalizedMessage.toLowerCase();

  // Check if message contains standalone "co" (case-insensitive)
  // Excludes hyphenated words like "co-op" using negative lookaround
  const coPattern = /(?<![a-zA-Z0-9-])co(?![a-zA-Z0-9-])/;

  return coPattern.test(messageLower);
}

// Test cases
const testCases = [
  { /**
   *
   */
    msg: 'co', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'simple "co"',
  },
  { /**
   *
   */
    msg: 'Co', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'capital C',
  },
  { /**
   *
   */
    msg: 'CO', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'all caps',
  },
  { /**
   *
   */
    msg: 'cO', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'mixed case',
  },
  { /**
   *
   */
    msg: 'co partner', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'at start',
  },
  { /**
   *
   */
    msg: 'find co', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'in middle',
  },
  { /**
   *
   */
    msg: 'hey co!', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'with punctuation',
  },
  { /**
   *
   */
    msg: 'co\n', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'with newline',
  },
  { /**
   *
   */
    msg: ' co ', /**
   *
   */
    shouldMatch: true, /**
   *
   */
    reason: 'with spaces',
  },
  { /**
   *
   */
    msg: 'co-op',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'hyphenated (should NOT match)',
  },
  { /**
   *
   */
    msg: 'coco',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'part of word',
  },
  { /**
   *
   */
    msg: 'acomb',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'embedded',
  },
  { /**
   *
   */
    msg: 'Partner found',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'no "co" present',
  },
  { /**
   *
   */
    msg: '__Partner found__ 😺',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'original message',
  },
  { /**
   *
   */
    msg: 'cooper',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'starts with "co" but continues',
  },
  { /**
   *
   */
    msg: 'acorn',
    /**
 *
 */
    shouldMatch: false, /**
   *
   */
    reason: 'contains "co" inside',
  },
];

console.log('Testing which messages trigger "/next" reply:\n');

let passed = 0;
let failed = 0;

testCases.forEach((test, idx) => {
  const matches = checkCoTrigger(test.msg);
  const expected = test.shouldMatch;
  const status = matches === expected ? '✅ PASS' : '❌ FAIL';

  if (matches === expected) { passed++; } else { failed++; }

  console.log(`Test ${idx + 1}: "${test.msg.replace(/\n/g, '\\n')}"`);
  console.log(`  Expected: ${expected ? 'MATCH' : 'NO MATCH'} | Got: ${matches ? 'MATCH' : 'NO MATCH'}`);
  console.log(`  Reason: ${test.reason}`);
  console.log(`  Status: ${status}`);
  console.log('');
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

if (failed === 0) {
  console.log('\n✅ All tests PASSED! The "co" trigger is working correctly.');
} else {
  console.log('\n❌ Some tests FAILED. Need to adjust pattern.');
}
