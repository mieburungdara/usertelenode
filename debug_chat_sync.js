// Comprehensive debugging test for ChatSyncService
const ChatSyncService = require('./src/domain/services/ChatSyncService');
const ChatSync = require('./src/domain/entities/ChatSync');

// Mock telegram API with comprehensive methods
const mockTelegramApi = {
  getEntity: async (chatId) => {
    console.log(`Mock API: getEntity called with ${chatId}`);
    return { id: chatId === '@test_group' ? 123 : 456 };
  },
  getMessages: async (entity, options) => {
    console.log(`Mock API: getMessages called with entity ${entity.id}, options:`, options);
    // In real Telegram API, peerId might be the chat entity or ID
    const sourceChatId = entity.id; // Use entity ID as peerId for simplicity
    return [
      { id: 1, message: 'Test message 1', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
      { id: 2, message: 'Test message 2', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
      { id: 3, media: { photo: { id: 'photo123' } }, message: 'Test photo', date: Math.floor(Date.now() / 1000), peerId: sourceChatId }
    ];
  },
  sendMessage: async (chatId, message) => {
    console.log(`Mock API: sendMessage called with ${chatId}, message: ${message}`);
    // Simulate occasional failures for testing
    if (message.includes('fail')) {
      throw new Error('Simulated send failure');
    }
    return { id: 100 };
  },
  sendPhoto: async (chatId, photo, options) => {
    console.log(`Mock API: sendPhoto called with ${chatId}, photo: ${photo.id}, caption: ${options?.caption}`);
    // Simulate failure for testing
    if (photo.id === 'fail_photo') {
      throw new Error('Simulated photo send failure');
    }
    return { id: 101 };
  },
  forwardMessage: async (chatId, messageId, fromChatId) => {
    console.log(`Mock API: forwardMessage called with ${chatId}, messageId: ${messageId}, from: ${fromChatId}`);
    // Simulate failure for message ID 2
    if (messageId === 2) {
      throw new Error('Simulated forward failure');
    }
    return { id: 102 };
  },
  downloadMedia: async (media) => {
    console.log(`Mock API: downloadMedia called with media type: ${media.photo ? 'photo' : 'unknown'}`);
    return { downloaded: true };
  }
};

// Mock repositories
const mockHistoryRepo = {
  saveSyncHistory: async (source, target, data) => {
    console.log(`Mock History: saveSyncHistory called for ${source} -> ${target}`);
  },
  getLastSyncTimestamp: async (source, target) => {
    console.log(`Mock History: getLastSyncTimestamp called for ${source} -> ${target}`);
    return null;
  }
};

const mockSourceRepo = {
  saveSource: async (source) => {
    console.log('Mock Source: saveSource called with:', source);
  },
  getAllSources: async () => []
};

// Mock logger
const mockLogger = {
  info: (msg) => console.log(`INFO: ${msg}`),
  warn: (msg) => console.log(`WARN: ${msg}`),
  error: (msg) => console.log(`ERROR: ${msg}`),
  debug: (msg) => console.log(`DEBUG: ${msg}`)
};

async function runComprehensiveTests() {
  console.log('🧪 Starting Comprehensive ChatSyncService Debugging Tests\n');

  const tests = [
    {
      name: 'Basic text message sync',
      config: {
        enabled: true,
        sourceChatType: 'group',
        targetChatType: 'channel',
        batchSize: 10,
        includeMedia: false
      }
    },
    {
      name: 'Media sync with protection handling',
      config: {
        enabled: true,
        sourceChatType: 'group',
        targetChatType: 'channel',
        batchSize: 10,
        includeMedia: true
      }
    },
    {
      name: 'Partial failure handling (some messages fail)',
      config: {
        enabled: true,
        sourceChatType: 'group',
        targetChatType: 'channel',
        batchSize: 10,
        includeMedia: false
      },
      simulatePartialFailure: true
    },
    {
      name: 'Error handling test',
      config: {
        enabled: true,
        sourceChatType: 'group',
        targetChatType: 'channel',
        batchSize: 10,
        includeMedia: false
      },
      forceError: true
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n📋 Test ${i + 1}: ${test.name}`);

    try {
      // Create service instance
      const service = new ChatSyncService(mockTelegramApi, mockHistoryRepo, mockLogger, mockSourceRepo);

      // Create chat sync entity
      const chatSync = new ChatSync('@test_group', '@test_channel', test.config);

      // Reset API behavior
      mockTelegramApi.getEntity = async (chatId) => {
        return { id: chatId === '@test_group' ? 123 : 456 };
      };

      // If testing error, force an error condition
      if (test.forceError) {
        mockTelegramApi.getEntity = async () => {
          throw new Error('Forced test error');
        };
      }

      // For partial failure test, modify messages to include one that will fail
      if (test.simulatePartialFailure) {
        mockTelegramApi.getMessages = async (entity, options) => {
          const sourceChatId = entity.id;
          return [
            { id: 1, message: 'Test message 1', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
            { id: 2, message: 'Test message 2 (will fail)', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
            { id: 3, message: 'Test message 3', date: Math.floor(Date.now() / 1000), peerId: sourceChatId }
          ];
        };
      } else {
        // Reset to normal messages
        mockTelegramApi.getMessages = async (entity, options) => {
          const sourceChatId = entity.id;
          return [
            { id: 1, message: 'Test message 1', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
            { id: 2, message: 'Test message 2', date: Math.floor(Date.now() / 1000), peerId: sourceChatId },
            { id: 3, media: { photo: { id: 'photo123' } }, message: 'Test photo', date: Math.floor(Date.now() / 1000), peerId: sourceChatId }
          ];
        };
      }

      const result = await service.synchronizeChats(chatSync);

      console.log(`✅ Test ${i + 1} PASSED:`, result);

    } catch (error) {
      console.log(`❌ Test ${i + 1} FAILED: ${error.message}`);
      console.log('Stack trace:', error.stack);
    }
  }

  console.log('\n🎉 Comprehensive testing completed!');
}

// Run tests
runComprehensiveTests().catch(console.error);