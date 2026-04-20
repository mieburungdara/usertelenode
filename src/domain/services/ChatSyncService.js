// src/domain/services/ChatSyncService.js
const ChatSync = require('../entities/ChatSync');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ChatSyncService {
  constructor(telegramApi, historyRepository, logger, sourceRepository = null) {
    this.telegramApi = telegramApi;
    this.historyRepository = historyRepository;
    this.logger = logger;
    this.sourceRepository = sourceRepository;
  }

  async synchronizeChats(chatSync) {
    // Input validation
    if (!chatSync.sourceChatId || !chatSync.targetChatId) {
      throw new Error('Source chat ID and target chat ID are required');
    }

    if (typeof chatSync.sourceChatId !== 'string' || typeof chatSync.targetChatId !== 'string') {
      throw new Error('Chat IDs must be valid strings');
    }

    const startTime = Date.now();
    let messagesProcessed = 0;
    let messagesSynced = 0;
    let lastCopiedMessageId = null;
    let errors = 0;

    try {
      this.logger.info(`Starting sync from ${chatSync.sourceChatId} (${chatSync.getSourceChatType()}) to ${chatSync.targetChatId} (${chatSync.getTargetChatType()})`);

      const messages = await this.fetchNewMessages(chatSync);
      messagesProcessed = messages.length;

      const processedMessages = await this.processMessages(chatSync, messages);

      const syncResult = await this.sendMessagesToTarget(chatSync, processedMessages);
      messagesSynced = syncResult.count;
      lastCopiedMessageId = syncResult.lastCopiedMessageId;

      // Save sync history
      const sessionData = {
        syncedAt: new Date().toISOString(),
        messagesProcessed: messagesProcessed,
        messagesSynced: messagesSynced,
        errors: errors,
        duration: Date.now() - startTime,
        sourceChatType: chatSync.getSourceChatType(),
        targetChatType: chatSync.getTargetChatType()
      };

      await this.historyRepository.saveSyncHistory(
        chatSync.sourceChatId,
        chatSync.targetChatId,
        sessionData
      );

      // Update source progress information
      if (this.sourceRepository) {
        try {
          // Get the last processed message ID for progress tracking
          const lastProcessedMessage = messages[messages.length - 1];
          const lastMessageId = lastProcessedMessage ? lastProcessedMessage.id : null;

          await this.sourceRepository.saveSource({
            id: chatSync.sourceChatId,
            type: chatSync.getSourceChatType(),
            title: chatSync.sourceChatId, // Will be updated with actual title if available
            lastCopyId: lastCopiedMessageId, // Last successfully copied message ID
            lastMessageId: lastMessageId // Last message ID encountered
          });
        } catch (error) {
          this.logger.warn(`Could not update source progress: ${error.message}`);
        }
      }

      this.logger.info('Sync completed: ' + messagesSynced + '/' + messagesProcessed + ' messages synced');

      return {
        success: true,
        processedCount: messagesProcessed,
        syncedCount: messagesSynced,
        errors: errors
      };

      await this.historyRepository.saveSyncHistory(
        chatSync.sourceChatId,
        chatSync.targetChatId,
        sessionData
      );

      // Update source progress information
      if (this.sourceRepository) {
        try {
          // Get the last processed message ID for progress tracking
          const lastProcessedMessage = messages[messages.length - 1];
          const lastMessageId = lastProcessedMessage ? lastProcessedMessage.id : null;

          await this.sourceRepository.saveSource({
            id: chatSync.sourceChatId,
            type: chatSync.getSourceChatType(),
            title: chatSync.sourceChatId, // Will be updated with actual title if available
            lastCopyId: lastCopiedMessageId, // Last successfully copied message ID
            lastMessageId: lastMessageId // Last message ID encountered
          });
        } catch (error) {
          this.logger.warn(`Could not update source progress: ${error.message}`);
        }
      }

      this.logger.info('Sync completed: ' + messagesSynced + '/' + messagesProcessed + ' messages synced');

      return {
        success: true,
        processedCount: messagesProcessed,
        syncedCount: messagesSynced,
        errors: errors
      };
    } catch (error) {
      this.logger.error(`Sync failed: ${error.message}`);

      // Save error session
      const sessionData = {
        syncedAt: new Date().toISOString(),
        messagesProcessed: messagesProcessed,
        messagesSynced: 0, // No messages synced due to error
        errors: messagesProcessed + 1, // +1 for this error
        duration: Date.now() - startTime,
        errorMessage: error.message,
        sourceChatType: chatSync.getSourceChatType(),
        targetChatType: chatSync.getTargetChatType()
      };

      await this.historyRepository.saveSyncHistory(
        chatSync.sourceChatId,
        chatSync.targetChatId,
        sessionData
      );
    }
  }

  async fetchNewMessages(chatSync) {
    try {
      const sourceEntity = await this.telegramApi.getEntity(chatSync.sourceChatId);
      const targetEntity = await this.telegramApi.getEntity(chatSync.targetChatId);

      // Get last sync timestamp
      const lastSyncTimestamp = await this.historyRepository.getLastSyncTimestamp(
        chatSync.sourceChatId,
        chatSync.targetChatId
      );

      // Adjust batch size based on chat type (bots might have fewer messages)
      let batchSize = chatSync.getBatchSize();
      if (chatSync.isSourceBot()) {
        batchSize = Math.min(batchSize, 5); // Smaller batches for bots
      }

      const options = {
        limit: batchSize,
        offsetDate: lastSyncTimestamp ? new Date(lastSyncTimestamp) : null,
        reverse: false // Get newest first
      };

      // For groups and bots, we might need different fetching strategies
      if (chatSync.isSourceGroup()) {
        // Groups might have more complex message history
        options.minId = 0; // Ensure we get all messages from the start if no timestamp
      }

      const messages = await this.telegramApi.getMessages(sourceEntity, options);

      // Filter messages based on age if configured
      const maxAge = chatSync.config.maxMessageAgeHours;
      if (maxAge) {
        const cutoffTime = new Date(Date.now() - (maxAge * 60 * 60 * 1000));
        return messages.filter(msg => new Date(msg.date * 1000) > cutoffTime);
      }

      // Additional filtering for different chat types
      return this.filterMessagesByChatType(messages, chatSync);
    } catch (error) {
      this.logger.error(`Failed to fetch messages: ${error.message}`);
      throw error;
    }
  }

  filterMessagesByChatType(messages, chatSync) {
    return messages.filter(message => {
      // For bot chats, filter out service messages or commands if needed
      if (chatSync.isSourceBot()) {
        // Allow bot responses and user messages
        return true;
      }

      // For groups, allow all messages but handle service messages appropriately
      if (chatSync.isSourceGroup()) {
        // Filter out excessive service messages if configured
        if (message.action && chatSync.config.excludeServiceMessages) {
          return false;
        }
        return true;
      }

      // For channels, standard filtering
      return true;
    });
  }

  async processMessages(chatSync, messages) {
    const processedMessages = [];

    for (const message of messages) {
      if (chatSync.shouldProcessMessage(message)) {
        // Add source attribution if needed
        const processedMessage = {
          originalMessage: message,
          content: this.extractMessageContent(message),
          media: this.extractMediaContent(message),
          type: this.determineMessageType(message),
          timestamp: message.date
        };
        processedMessages.push(processedMessage);
      }
    }

    return processedMessages;
  }

  extractMessageContent(message) {
    return {
      text: message.message || '',
      entities: message.entities || []
    };
  }

  extractMediaContent(message) {
    if (!message.media) return null;

    const media = message.media;

    // Handle different media types
    if (media.photo) {
      return {
        type: 'photo',
        photo: media.photo,
        caption: message.message || ''
      };
    }

    if (media.document) {
      return {
        type: 'document',
        document: media.document,
        caption: message.message || ''
      };
    }

    if (media.video) {
      return {
        type: 'video',
        video: media.video,
        caption: message.message || ''
      };
    }

    if (media.audio) {
      return {
        type: 'audio',
        audio: media.audio,
        caption: message.message || ''
      };
    }

    if (media.voice) {
      return {
        type: 'voice',
        voice: media.voice
      };
    }

    if (media.sticker) {
      return {
        type: 'sticker',
        sticker: media.sticker
      };
    }

    if (media.animation) {
      return {
        type: 'animation',
        animation: media.animation,
        caption: message.message || ''
      };
    }

    if (media.poll) {
      return {
        type: 'poll',
        poll: media.poll
      };
    }

    if (media.geo) {
      return {
        type: 'location',
        geo: media.geo
      };
    }

    if (media.contact) {
      return {
        type: 'contact',
        contact: media.contact
      };
    }

    if (media.venue) {
      return {
        type: 'venue',
        venue: media.venue
      };
    }

    if (media.webpage) {
      return {
        type: 'webpage',
        webpage: media.webpage
      };
    }

    return null;
  }

  determineMessageType(message) {
    if (message.media) {
      if (message.media.photo) return 'photo';
      if (message.media.document) return 'document';
      if (message.media.video) return 'video';
      if (message.media.audio) return 'audio';
      if (message.media.voice) return 'voice';
      if (message.media.sticker) return 'sticker';
      if (message.media.animation) return 'animation';
      if (message.media.poll) return 'poll';
      if (message.media.geo) return 'location';
      if (message.media.contact) return 'contact';
      if (message.media.venue) return 'venue';
      if (message.media.webpage) return 'webpage';
    }

    if (message.message) return 'text';
    if (message.game) return 'game';
    if (message.invoice) return 'invoice';

    return 'unknown';
  }

  async sendMessagesToTarget(chatSync, processedMessages) {
    let syncedCount = 0;
    let lastCopiedMessageId = null;

    for (const processedMessage of processedMessages) {
      try {
        await this.sendSingleMessage(chatSync.targetChatId, processedMessage);
        syncedCount++;
        lastCopiedMessageId = processedMessage.originalMessage.id; // Update last copied ID

        // Rate limiting - adjust based on chat type
        const delay = chatSync.getRateLimitDelay();
        if (chatSync.isTargetBot()) {
          // Slower rate for bots to avoid being flagged as spam
          await new Promise(resolve => setTimeout(resolve, delay * 2));
        } else {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        this.logger.warn(`Failed to sync message ${processedMessage.originalMessage.id}: ${error.message}`);
        // Continue with next message
      }
    }

    return {
      count: syncedCount,
      lastCopiedMessageId: lastCopiedMessageId
    };
  }

  async sendSingleMessage(targetChatId, processedMessage, chatSync = null) {
    const { content, media, type, originalMessage } = processedMessage;

    // Check if content is protected (cannot be copied directly)
    const isContentProtected = this.isContentProtected(originalMessage);

    // Try to forward first (preserves original metadata) - but only for channels and non-protected content
    const canForward = chatSync ? !chatSync.isTargetBot() && !chatSync.isTargetGroup() && !isContentProtected : !isContentProtected;

    if (!media && type === 'text' && canForward) {
      // Forward text messages to preserve formatting
      try {
        return await this.telegramApi.forwardMessage(
          targetChatId,
          originalMessage.id,
          originalMessage.peerId
        );
      } catch (error) {
        // Fall back to sending
        this.logger.debug(`Forward failed, sending instead: ${error.message}`);
      }
    }

    // Handle different message types
    switch (type) {
      case 'text':
        return await this.telegramApi.sendMessage(targetChatId, content.text);

      case 'photo':
        if (isContentProtected) {
          return await this.sendProtectedPhoto(targetChatId, originalMessage, media.caption);
        }
        return await this.telegramApi.sendPhoto(targetChatId, media.photo, {
          caption: media.caption
        });

      case 'video':
        if (isContentProtected) {
          return await this.sendProtectedVideo(targetChatId, originalMessage, media.caption);
        }
        return await this.telegramApi.sendVideo(targetChatId, media.video, {
          caption: media.caption
        });

      case 'document':
        if (isContentProtected) {
          return await this.sendProtectedDocument(targetChatId, originalMessage, media.caption);
        }
        return await this.telegramApi.sendDocument(targetChatId, media.document, {
          caption: media.caption
        });

      case 'audio':
        if (isContentProtected) {
          return await this.sendProtectedAudio(targetChatId, originalMessage, media.caption);
        }
        return await this.telegramApi.sendAudio(targetChatId, media.audio, {
          caption: media.caption
        });

      case 'voice':
        if (isContentProtected) {
          return await this.sendProtectedVoice(targetChatId, originalMessage);
        }
        return await this.telegramApi.sendVoice(targetChatId, media.voice);

      case 'sticker':
        if (isContentProtected) {
          return await this.sendProtectedSticker(targetChatId, originalMessage);
        }
        return await this.telegramApi.sendSticker(targetChatId, media.sticker);

      case 'animation':
        if (isContentProtected) {
          return await this.sendProtectedAnimation(targetChatId, originalMessage, media.caption);
        }
        return await this.telegramApi.sendAnimation(targetChatId, media.animation, {
          caption: media.caption
        });

      case 'poll':
        return await this.telegramApi.sendPoll(targetChatId, media.poll);

      case 'location':
        return await this.telegramApi.sendLocation(targetChatId, media.geo);

      case 'contact':
        return await this.telegramApi.sendContact(targetChatId, media.contact);

      case 'venue':
        return await this.telegramApi.sendVenue(targetChatId, media.venue);

      default:
        // For unsupported types, try to forward if possible
        const canForwardDefault = chatSync ? !chatSync.isTargetBot() && !isContentProtected : !isContentProtected;
        if (canForwardDefault) {
          try {
            return await this.telegramApi.forwardMessage(
              targetChatId,
              originalMessage.id,
              originalMessage.peerId
            );
          } catch (forwardError) {
            this.logger.warn(`Cannot sync message type ${type}: ${forwardError.message}`);
            throw forwardError;
          }
        } else {
          this.logger.warn(`Cannot sync message type ${type} to bot chat or protected content`);
          throw new Error(`Unsupported message type for bot chat or protected content: ${type}`);
        }
    }
  }

  /**
   * Check if message content is protected (cannot be copied directly)
   * @param {Object} message - Telegram message object
   * @returns {boolean} True if content is protected
   */
  isContentProtected(message) {
    if (!message.media) return false;

    // Check for content protection flags
    if (message.media.photo && message.media.photo.length > 0) {
      return message.media.photo[0].hasOwnProperty('restricted') ||
             message.media.photo[0].hasOwnProperty('content_protected') ||
             !message.media.photo[0].sizes;
    }

    if (message.media.document) {
      return message.media.document.hasOwnProperty('restricted') ||
             message.media.document.hasOwnProperty('content_protected') ||
             !message.media.document.size;
    }

    if (message.media.video) {
      return message.media.video.hasOwnProperty('restricted') ||
             message.media.video.hasOwnProperty('content_protected') ||
             !message.media.video.size;
    }

    if (message.media.audio) {
      return message.media.audio.hasOwnProperty('restricted') ||
             message.media.audio.hasOwnProperty('content_protected') ||
             !message.media.audio.size;
    }

    // For other media types, check general protection flags
    return message.media.hasOwnProperty('restricted') ||
           message.media.hasOwnProperty('content_protected') ||
           message.hasOwnProperty('content_protected');
  }

  /**
   * Send protected photo by downloading and re-uploading
   */
  async sendProtectedPhoto(targetChatId, originalMessage, caption) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected photo for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.photo, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendPhoto(targetChatId, tempFilePath, {
        caption: caption
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected photo: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected video by downloading and re-uploading
   */
  async sendProtectedVideo(targetChatId, originalMessage, caption) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected video for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp4`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.video, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendVideo(targetChatId, tempFilePath, {
        caption: caption
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected video: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected document by downloading and re-uploading
   */
  async sendProtectedDocument(targetChatId, originalMessage, caption) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected document for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      const originalName = originalMessage.media.document.attributes?.find(attr => attr.fileName)?.fileName || 'document';
      tempFilePath = path.join(tempDir, `protected_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${originalName}`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.document, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendDocument(targetChatId, tempFilePath, {
        caption: caption
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected document: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected audio by downloading and re-uploading
   */
  async sendProtectedAudio(targetChatId, originalMessage, caption) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected audio for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.audio, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendAudio(targetChatId, tempFilePath, {
        caption: caption
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected audio: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected voice message by downloading and re-uploading
   */
  async sendProtectedVoice(targetChatId, originalMessage) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected voice for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.ogg`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.voice, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendVoice(targetChatId, tempFilePath);

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected voice: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected sticker by downloading and re-uploading
   */
  async sendProtectedSticker(targetChatId, originalMessage) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected sticker for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_sticker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.webp`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.sticker, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendSticker(targetChatId, tempFilePath);

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected sticker: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }

  /**
   * Send protected animation by downloading and re-uploading
   */
  async sendProtectedAnimation(targetChatId, originalMessage, caption) {
    let tempFilePath = null;

    try {
      this.logger.debug('Downloading protected animation for re-upload');

      // Create temporary file path
      const tempDir = os.tmpdir();
      tempFilePath = path.join(tempDir, `protected_animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.gif`);

      // Download to temporary file
      await this.telegramApi.downloadMediaToFile(originalMessage.media.animation, tempFilePath);

      // Send the file
      const result = await this.telegramApi.sendAnimation(targetChatId, tempFilePath, {
        caption: caption
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to send protected animation: ${error.message}`);
      throw error;
    } finally {
      // Clean up temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          this.logger.debug(`Cleaned up temporary file: ${tempFilePath}`);
        } catch (cleanupError) {
          this.logger.warn(`Failed to clean up temporary file ${tempFilePath}: ${cleanupError.message}`);
        }
      }
    }
  }
}

module.exports = ChatSyncService;