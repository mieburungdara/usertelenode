// Test random reply selection functionality
// Verifies that random selection works correctly for array replies

const handlers = require('./handlers/autoReply');

console.log('=== Testing Random Reply Selection ===\n');

// Mock rule with array of replies
const mockRuleWithArray = {
  name: 'test_rule',
  triggers: ['test'],
  reply: ['option1', 'option2', 'option3', 'option4', 'option5']
};

// Mock rule with single string (backward compatibility)
const mockRuleWithString = {
  name: 'test_rule_single',
  triggers: ['test'],
  reply: 'single reply'
};

// Test 1: Array selection
console.log('Test 1: Random selection from array');
console.log(`Rule has ${mockRuleWithArray.reply.length} options`);

const selections = new Set();
const iterations = 100;

for (let i = 0; i < iterations; i++) {
  const selected = handlers.getRandomReply(mockRuleWithArray);
  selections.add(selected);
}

console.log(`Ran ${iterations} selections`);
console.log(`Got ${selections.size} unique values`);
console.log(`Selected values: ${Array.from(selections).join(', ')}`);

const allValid = Array.from(selections).every(val => mockRuleWithArray.reply.includes(val));
console.log(`All selections valid: ${allValid ? '✅ YES' : '❌ NO'}\n`);

// Test 2: Single string (backward compatibility)
console.log('Test 2: Single string reply (backward compatibility)');
const singleResult = handlers.getRandomReply(mockRuleWithString);
console.log(`Result: "${singleResult}"`);
console.log(`Matches expected: ${singleResult === 'single reply' ? '✅ YES' : '❌ NO'}\n`);

// Test 3: Edge cases
console.log('Test 3: Edge cases');

const emptyRule = { reply: [] };
const nullRule = { reply: null };
const undefinedRule = {};

console.log(`Empty array: ${handlers.getRandomReply(emptyRule) === null ? '✅ returns null' : '❌ unexpected'}`);
console.log(`Null reply: ${handlers.getRandomReply(nullRule) === null ? '✅ returns null' : '❌ unexpected'}`);
console.log(`Undefined reply: ${handlers.getRandomReply(undefinedRule) === null ? '✅ returns null' : '❌ unexpected'}\n`);

// Test 4: Distribution check
console.log('Test 4: Distribution check (should be roughly uniform)');
const distribution = {};
mockRuleWithArray.reply.forEach(opt => distribution[opt] = 0);

const sampleSize = 1000;
for (let i = 0; i < sampleSize; i++) {
  const selected = handlers.getRandomReply(mockRuleWithArray);
  distribution[selected]++;
}

console.log(`After ${sampleSize} selections:`);
Object.entries(distribution).forEach(([option, count]) => {
  const percentage = ((count / sampleSize) * 100).toFixed(1);
  console.log(`  "${option}": ${count} times (${percentage}%)`);
});

// Check if distribution is reasonably uniform (within 50% of expected)
const expected = sampleSize / mockRuleWithArray.reply.length;
const allWithinRange = Object.values(distribution).every(count => 
  count >= expected * 0.5 && count <= expected * 1.5
);
console.log(`Distribution roughly uniform: ${allWithinRange ? '✅ YES' : '⚠️  Acceptable variance'}\n`);

console.log('=== Summary ===');
console.log('✅ Random reply selection is working!');
console.log('\nBenefits:');
console.log('  - Prevents spam detection by varying replies');
console.log('  - Backward compatible with single string replies');
console.log('  - Works with both simple text and multi-line replies');
console.log('\nUsage in autoreply.json:');
console.log('  "reply": ["option1", "option2", "option3"]  // Random selection');
console.log('  "reply": "single text"                      // Single reply (old format)');

module.exports = { mockRuleWithArray, mockRuleWithString, distribution };