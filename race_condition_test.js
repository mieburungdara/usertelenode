// Test for potential race conditions in concurrent sync operations
const ChatSyncService = require('./src/domain/services/ChatSyncService');
const { ChatSyncSourceRepository } = require('./src/infrastructure/repositories/ChatSyncSourceRepository');
const { ChatSyncHistoryRepository } = require('./src/infrastructure/repositories/ChatSyncHistoryRepository');
const { FileStorageAdapter } = require('./src/infrastructure/adapters/FileStorageAdapter');
const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Concurrent Operations & Race Conditions\n');

// Mock API with controlled delays to test race conditions
const mockTelegramApi = {
  getEntity: async (chatId) => {
    // Simulate variable delay to test race conditions
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    return { id: chatId === '@test' ? 123 : 456 };
  },

  getMessages: async (entity, options) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 30));
    return [
      { id: 1, message: `Message from ${entity.id}`, date: Math.floor(Date.now() / 1000), peerId: entity.id }
    ];
  },

  sendMessage: async (chatId, message) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 20));
    return { id: Date.now(), message: 'Message sent' };
  },

  downloadMediaToFile: async (media, filePath) => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 40));
    fs.writeFileSync(filePath, `mock content ${Date.now()}`);
    return filePath;
  }
};

const mockLogger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`)
};

async function testConcurrentOperations() {
  console.log('Testing concurrent sync operations...\n');

  // Setup repositories
  const storage = new FileStorageAdapter(fs, path);
  const sourceRepo = new ChatSyncSourceRepository(storage);
  const historyRepo = new ChatSyncHistoryRepository(storage);

  const service = new ChatSyncService(mockTelegramApi, historyRepo, mockLogger, sourceRepo);

  // Create multiple sync operations
  const operations = [];
  const sources = ['@group1', '@group2', '@bot1', '@channel1', '@group3'];

  for (let i = 0; i < sources.length; i++) {
    const operation = async () => {
      try {
        const chatSync = new (require('./src/domain/entities/ChatSync'))(
          sources[i],
          '@target_channel',
          {
            enabled: true,
            sourceChatType: sources[i].includes('group') ? 'group' : sources[i].includes('bot') ? 'bot' : 'channel',
            targetChatType: 'channel',
            batchSize: 5,
            includeMedia: false
          }
        );

        const result = await service.synchronizeChats(chatSync);
        return { source: sources[i], success: result.success, synced: result.syncedCount };
      } catch (error) {
        return { source: sources[i], success: false, error: error.message };
      }
    };

    operations.push(operation());
  }

  // Execute all operations concurrently
  console.log(`Starting ${operations.length} concurrent sync operations...`);
  const startTime = Date.now();

  const results = await Promise.allSettled(operations);

  const duration = Date.now() - startTime;
  console.log(`\nAll operations completed in ${duration}ms\n`);

  // Analyze results
  let successCount = 0;
  let failureCount = 0;
  const successfulSources = [];
  const failedSources = [];

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const data = result.value;
      if (data.success) {
        successCount++;
        successfulSources.push(data.source);
        console.log(`✅ ${data.source}: ${data.synced} messages synced`);
      } else {
        failureCount++;
        failedSources.push(data.source);
        console.log(`❌ ${data.source}: Failed - ${data.error}`);
      }
    } else {
      failureCount++;
      failedSources.push(`Operation ${index}`);
      console.log(`❌ Operation ${index}: Rejected - ${result.reason}`);
    }
  });

  console.log(`\n📊 Results Summary:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`⏱️  Total Duration: ${duration}ms`);
  console.log(`📈 Success Rate: ${((successCount / operations.length) * 100).toFixed(1)}%`);

  // Check for race conditions in repository
  console.log('\n🔍 Checking Repository State After Concurrent Operations...');

  try {
    const allSources = await sourceRepo.getAllSources();
    console.log(`📁 Sources in repository: ${allSources.length}`);

    // Check for data consistency
    const sourceIds = allSources.map(s => s.id);
    const uniqueIds = [...new Set(sourceIds)];
    if (sourceIds.length !== uniqueIds.length) {
      console.log('⚠️  WARNING: Duplicate source IDs detected - possible race condition');
    } else {
      console.log('✅ Source IDs are unique - no duplication issues');
    }

    // Check usage counts are reasonable
    const highUsageSources = allSources.filter(s => (s.usageCount || 0) > 5);
    if (highUsageSources.length > 0) {
      console.log('⚠️  WARNING: Some sources have unusually high usage counts');
      highUsageSources.forEach(s => console.log(`   ${s.id}: ${s.usageCount} uses`));
    } else {
      console.log('✅ Usage counts are within expected ranges');
    }

  } catch (error) {
    console.log(`❌ Repository check failed: ${error.message}`);
  }

  // Cleanup test files
  try {
    const tempDir = require('os').tmpdir();
    const testFiles = fs.readdirSync(tempDir).filter(f => f.startsWith('protected_'));
    if (testFiles.length > 0) {
      console.log(`\n🧹 Cleaning up ${testFiles.length} test temp files...`);
      testFiles.forEach(file => {
        try {
          fs.unlinkSync(path.join(tempDir, file));
        } catch (e) {
          // Ignore cleanup errors
        }
      });
    }
  } catch (error) {
    // Ignore cleanup errors
  }

  return { successCount, failureCount, duration };
}

testConcurrentOperations().catch(console.error);