const { updateHistory } = require('./utils/scrapingHistory');

// Test the history functionality
console.log('Testing history module...');

const testChannel = 'testchannel';
const startId = 1;
const endId = 10;
const linksFound = 2;

const success = updateHistory(testChannel, startId, endId, linksFound, false);

if (success) {
  console.log('✅ History updated successfully');
} else {
  console.log('❌ Failed to update history');
}