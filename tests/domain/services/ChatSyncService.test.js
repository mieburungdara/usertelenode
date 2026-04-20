// tests/domain/services/ChatSyncService.test.js
const ChatSyncService = require('../../../src/domain/services/ChatSyncService');
const ChatSync = require('../../../src/domain/entities/ChatSync');

// Mock dependencies
const mockTelegramApi = {
  getEntity: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
  sendPhoto: jest.fn(),
  sendVideo: jest.fn(),
  forwardMessage: jest.fn()
};

const mockHistoryRepository = {
  saveSyncHistory: jest.fn(),
  getLastSyncTimestamp: jest.fn(),
  addSyncPair: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

describe('ChatSyncService', () => {
  let service;

  beforeEach(() => {
    service = new ChatSyncService(mockTelegramApi, mockHistoryRepository, mockLogger);
    jest.clearAllMocks();
  });

  describe('synchronizeChats', () => {
    it('should sync text messages successfully', async () => {
      // Arrange
      const chatSync = new ChatSync('@source', '@target', {
        enabled: true,
        batchSize: 10,
        includeMedia: true
      });

      const mockMessages = [
        {
          id: 1,
          message: 'Hello World',
          date: Date.now() / 1000
        }
      ];

      mockTelegramApi.getEntity.mockResolvedValue({ id: 123 });
      mockTelegramApi.getMessages.mockResolvedValue(mockMessages);
      mockHistoryRepository.getLastSyncTimestamp.mockResolvedValue(null);
      mockTelegramApi.sendMessage.mockResolvedValue({ id: 2 });

      // Act
      const result = await service.synchronizeChats(chatSync);

      // Assert
      expect(result.success).toBe(true);
      expect(result.processedCount).toBe(1);
      expect(result.syncedCount).toBe(1);
      expect(mockTelegramApi.sendMessage).toHaveBeenCalledWith('@target', 'Hello World');
      expect(mockHistoryRepository.saveSyncHistory).toHaveBeenCalled();
    });

    it('should sync photo messages with captions', async () => {
      // Arrange
      const chatSync = new ChatSync('@source', '@target', {
        enabled: true,
        includeMedia: true
      });

      const mockMessages = [
        {
          id: 2,
          media: {
            photo: { id: 'photo123' }
          },
          message: 'Beautiful sunset',
          date: Date.now() / 1000
        }
      ];

      mockTelegramApi.getEntity.mockResolvedValue({ id: 123 });
      mockTelegramApi.getMessages.mockResolvedValue(mockMessages);
      mockHistoryRepository.getLastSyncTimestamp.mockResolvedValue(null);
      mockTelegramApi.sendPhoto.mockResolvedValue({ id: 3 });

      // Act
      const result = await service.synchronizeChats(chatSync);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTelegramApi.sendPhoto).toHaveBeenCalledWith('@target', { id: 'photo123' }, {
        caption: 'Beautiful sunset'
      });
    });

    it('should handle sync failures gracefully', async () => {
      // Arrange
      const chatSync = new ChatSync('@source', '@target', {
        enabled: true
      });

      mockTelegramApi.getEntity.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(service.synchronizeChats(chatSync)).rejects.toThrow('Network error');
      expect(mockHistoryRepository.saveSyncHistory).toHaveBeenCalled();
    });

    it('should handle protected content by downloading and re-uploading', async () => {
      // Arrange
      const chatSync = new ChatSync('@source', '@target', {
        enabled: true,
        includeMedia: true
      });

      const protectedMessage = {
        id: 3,
        media: {
          photo: { id: 'protected_photo', content_protected: true }
        },
        message: 'Protected photo',
        date: Date.now() / 1000
      };

      mockTelegramApi.getEntity.mockResolvedValue({ id: 123 });
      mockTelegramApi.getMessages.mockResolvedValue([protectedMessage]);
      mockHistoryRepository.getLastSyncTimestamp.mockResolvedValue(null);
      mockTelegramApi.downloadMedia.mockResolvedValue({ downloaded: true });
      mockTelegramApi.sendPhoto.mockResolvedValue({ id: 4 });

      // Act
      const result = await service.synchronizeChats(chatSync);

      // Assert
      expect(result.success).toBe(true);
      expect(mockTelegramApi.downloadMedia).toHaveBeenCalled();
      expect(mockTelegramApi.sendPhoto).toHaveBeenCalled();
    });
  });

  describe('processMessages', () => {
    it('should filter out excluded message types', async () => {
      // Arrange
      const chatSync = new ChatSync('@source', '@target', {
        excludedMessageTypes: ['sticker']
      });

      const messages = [
        { id: 1, message: 'Text message', date: Date.now() / 1000 },
        { id: 2, media: { sticker: {} }, date: Date.now() / 1000 }
      ];

      // Act
      const processed = await service.processMessages(channelSync, messages);

      // Assert
      expect(processed.length).toBe(1);
      expect(processed[0].type).toBe('text');
    });
  });

  describe('sendSingleMessage', () => {
    it('should forward unsupported message types', async () => {
      // Arrange
      const processedMessage = {
        originalMessage: { id: 123, peerId: { channelId: 456 } },
        content: { text: '' },
        media: null,
        type: 'unknown'
      };

      mockTelegramApi.forwardMessage.mockResolvedValue({ id: 124 });

      // Act
      await service.sendSingleMessage('@target', processedMessage);

      // Assert
      expect(mockTelegramApi.forwardMessage).toHaveBeenCalledWith(
        '@target',
        123,
        { channelId: 456 }
      );
    });
  });

  describe('isContentProtected', () => {
    it('should detect protected photo content', () => {
      const message = {
        media: {
          photo: [{ content_protected: true }]
        }
      };

      expect(service.isContentProtected(message)).toBe(true);
    });

    it('should detect protected document content', () => {
      const message = {
        media: {
          document: { content_protected: true }
        }
      };

      expect(service.isContentProtected(message)).toBe(true);
    });

    it('should return false for unprotected content', () => {
      const message = {
        media: {
          photo: [{ sizes: [] }]
        }
      };

      expect(service.isContentProtected(message)).toBe(false);
    });

    it('should return false for text messages', () => {
      const message = {
        message: 'Hello world'
      };

      expect(service.isContentProtected(message)).toBe(false);
    });
  });
});