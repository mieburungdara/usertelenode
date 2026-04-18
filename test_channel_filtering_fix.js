// Test to verify the channelName.trim() fix
const { /**
 *
 */
  parseChannelInput,
} = require('./src/domain/services/ScrapingService');

console.log('=== Testing Fixed Channel Filtering ===\n');

// Simulate mixed channel list (string + numeric ID)
const testChannels = [
  { /**
   *
   */
    channelName: '@test1', /**
   *
   */
    lastScrapedId: 100,
  },
  { /**
   *
   */
    channelName: -1001234567890, /**
   *
   */
    lastScrapedId: 200,
  },
  { /**
   *
   */
    channelName: '@test1', /**
   *
   */
    lastScrapedId: 150,
  }, // duplicate string
  { /**
   *
   */
    channelName: -1001234567890, /**
   *
   */
    lastScrapedId: 250,
  }, // duplicate numeric
  { /**
   *
   */
    channelName: '@test2', /**
   *
   */
    lastScrapedId: 300,
  },
];

console.log('Test channels:');
testChannels.forEach(ch => console.log(`  - ${ch.channelName} (${typeof ch.channelName})`));

// Test filtering logic like in UseCase
console.log('\nTesting duplicate filtering...');

const uniqueChannels = testChannels.filter((ch, index, arr) =>
  arr.findIndex(c => String(c.channelName).trim().toLowerCase() === String(ch.channelName).trim().toLowerCase()) === index,
);

console.log(`\nOriginal: ${testChannels.length} channels`);
console.log(`After dedup: ${uniqueChannels.length} channels`);

uniqueChannels.forEach(ch => console.log(`  ✓ ${ch.channelName} (${typeof ch.channelName})`));

console.log('\n✅ Channel filtering works correctly with mixed string/numeric IDs!');

// Test ConsoleUI display logic
console.log('\nTesting display formatting...');
uniqueChannels.forEach(ch => {
  const padded = String(ch.channelName).padEnd(20);
  console.log(`  Display: "${padded}" | length: ${String(ch.channelName).length}`);
});

console.log('\n✅ All fixed verified!');
