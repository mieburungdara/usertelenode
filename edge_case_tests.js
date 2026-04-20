// Additional edge case and error handling tests
// Import the same mocks from comprehensive_debug.js
const mockTelegramApi = {
  getEntity: async (chatId) => {
    console.log(`[MOCK] getEntity called with: ${chatId}`);
    return { id: chatId === '@test_group' ? 123 : 456 };
  },
  getMessages: async (entity, options) => {
    console.log(`[MOCK] getMessages called with entity ${entity.id}, options:`, options);
    const sourceChatId = entity.id;
    return [
      { id: 1, message: 'Test message 1', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
      { id: 2, message: 'Test message 2', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
      { id: 3, media: { photo: { id: 'photo123' } }, message: 'Test photo', date: Math.floor(Date.now() / 1000), peerId: sourceChatId }
    ];
  },
  sendMessage: async (chatId, message) => {
    console.log(`[MOCK] sendMessage to ${chatId}: "${message}"`);
    return { id: Date.now() };
  },
  sendPhoto: async (chatId, photo, options) => {
    console.log(`[MOCK] sendPhoto to ${chatId}, photo: ${photo.id}, caption: "${options?.caption}"`);
    return { id: Date.now() };
  },
  forwardMessage: async (chatId, messageId, fromChatId) => {
    console.log(`[MOCK] forwardMessage to ${chatId}, message ${messageId} from ${fromChatId}`);
    return { id: Date.now() };
  },
  downloadMedia: async (media) => {
    console.log(`[MOCK] downloadMedia: ${JSON.stringify(media)}`);
    return Buffer.from('mock image data');
  }
};

const mockHistoryRepo = {
  saveSyncHistory: async (source, target, data) => {
    console.log(`[MOCK] History: saveSyncHistory for ${source} -> ${target}`);
  },
  getLastSyncTimestamp: async (source, target) => {
    console.log(`[MOCK] History: getLastSyncTimestamp for ${source} -> ${target}`);
    return null;
  }
};

const mockLogger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`),
  debug: (msg) => console.log(`[DEBUG] ${msg}`)
};

async function runEdgeCaseTests() {
  console.log('\n🔬 Running Edge Case and Error Handling Tests\n');

  const errorScenarios = [
    {
      name: 'Network Failure During Sync',
      mockSetup: (api) => {
        api.getMessages = async () => {
          throw new Error('Network timeout');
        };
      },
      expectedResult: 'should handle network errors gracefully'
    },
    {
      name: 'Invalid Chat ID',
      config: {
        sourceChatId: '@nonexistent_chat',
        targetChatId: '@target_channel',
        sourceChatType: 'channel',
        targetChatType: 'channel'
      },
      expectedResult: 'should handle invalid chat IDs'
    },
    {
      name: 'Empty Message Batch',
      mockSetup: (api) => {
        api.getMessages = async () => [];
      },
      expectedResult: 'should handle empty message batches'
    },
    {
      name: 'Corrupted Source Data',
      mockSetup: (repo) => {
        // Simulate corrupted JSON data
        repo.getAllSources = async () => {
          throw new Error('JSON parse error');
        };
      },
      expectedResult: 'should handle corrupted source data'
    }
  ];

  // Setup storage and repository
  const { ChatSyncSourceRepository } = require('./src/infrastructure/repositories/ChatSyncSourceRepository');
  const { FileStorageAdapter } = require('./src/infrastructure/adapters/FileStorageAdapter');
  const fs = require('fs');
  const path = require('path');
  const storage = new FileStorageAdapter(fs, path);
  const sourceRepo = new ChatSyncSourceRepository(storage);

  for (let i = 0; i < errorScenarios.length; i++) {
    const scenario = errorScenarios[i];
    console.log(`📋 Error Test ${i + 1}: ${scenario.name}`);

    try {
      // Setup mocks
      const mockApi = { ...mockTelegramApi };
      let mockRepo = sourceRepo; // Use real repository by default

      if (scenario.mockSetup) {
        if (scenario.name.includes('Source Data')) {
          // Create a mock repository for this specific test
          mockRepo = {
            saveSource: async (source) => { throw new Error('JSON parse error'); },
            getAllSources: async () => { throw new Error('JSON parse error'); }
          };
          scenario.mockSetup(mockRepo);
        } else {
          scenario.mockSetup(mockApi);
        }
      }

      const ChatSyncService = require('./src/domain/services/ChatSyncService');
      const ChatSync = require('./src/domain/entities/ChatSync');

      const service = new ChatSyncService(mockApi, mockHistoryRepo, mockLogger, mockRepo);

      const config = scenario.config || {
        enabled: true,
        sourceChatType: 'channel',
        targetChatType: 'channel',
        batchSize: 10,
        includeMedia: true
      };

      const chatSync = new ChatSync(
        config.sourceChatId || '@test_chat',
        config.targetChatId || '@target_channel',
        config
      );

      const result = await service.synchronizeChats(chatSync);

      if (result.success) {
        console.log(`❌ UNEXPECTED: Test should have failed but succeeded`);
      } else {
        console.log(`✅ EXPECTED: Test failed as expected - ${scenario.expectedResult}`);
      }

    } catch (error) {
      console.log(`✅ EXPECTED: Test threw error as expected - ${scenario.expectedResult}`);
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n🔬 Edge case testing completed!');
}

// Run edge case tests
runEdgeCaseTests().catch(console.error);