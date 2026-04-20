// src/domain/entities/ChatSync.js
class ChatSync {
  constructor(sourceChatId, targetChatId, config) {
    // Validate and sanitize input
    if (!sourceChatId || typeof sourceChatId !== 'string') {
      throw new Error('Source chat ID must be a non-empty string');
    }
    
    if (!targetChatId || typeof targetChatId !== 'string') {
      throw new Error('Target chat ID must be a non-empty string');
    }
    
    // Trim whitespace
    this.sourceChatId = sourceChatId.trim();
    this.targetChatId = targetChatId.trim();
    
    // Set default config values
    this.config = {
      enabled: true,
      includeMedia: true,
      excludeServiceMessages: true,
      excludedMessageTypes: [],
      maxMessageAgeHours: null,
      batchSize: 10,
      rateLimitDelayMs: 1000,
      sourceChatType: 'channel',
      targetChatType: 'channel',
      ...(config || {})
    };
    
    // Validate config values
    if (this.config.batchSize < 1) {
      this.config.batchSize = 10;
    }
    
    if (this.config.rateLimitDelayMs < 100) {
      this.config.rateLimitDelayMs = 1000;
    }
    
    this.lastSyncTimestamp = null;
    this.status = 'idle'; // idle, running, paused, error
  }

  isEnabled() {
    return this.config.enabled === true;
  }

  shouldProcessMessage(message) {
    // Skip if message is empty and has no media
    if (!message.message && !message.media) {
      return false;
    }

    // Check excluded message types
    const excludedTypes = this.config.excludedMessageTypes || [];
    const messageType = this.getMessageType(message);
    if (excludedTypes.includes(messageType)) {
      return false;
    }

    // Check media inclusion
    if (message.media && !this.config.includeMedia) {
      return false;
    }

    // Check message age
    if (this.config.maxMessageAgeHours) {
      const messageTime = new Date(message.date * 1000);
      const cutoffTime = new Date(Date.now() - (this.config.maxMessageAgeHours * 60 * 60 * 1000));
      if (messageTime < cutoffTime) {
        return false;
      }
    }

    // Additional validation based on chat type
    if (!this.isValidForChatType(message)) {
      return false;
    }

    return true;
  }

  isValidForChatType(message) {
    // For bot chats, ensure we're not trying to sync bot commands or service messages
    if (this.config.sourceChatType === 'bot') {
      // Allow bot responses and user messages to bots
      return true;
    }

    // For groups, handle group-specific message types
    if (this.config.sourceChatType === 'group') {
      // Allow all message types in groups
      return true;
    }

    // For channels, standard validation
    return true;
  }

  getMessageType(message) {
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

  updateLastSync(timestamp) {
    this.lastSyncTimestamp = timestamp;
  }

  getBatchSize() {
    return this.config.batchSize || 10;
  }

  getRateLimitDelay() {
    return this.config.rateLimitDelayMs || 1000;
  }

  getSourceChatType() {
    return this.config.sourceChatType || 'channel';
  }

  getTargetChatType() {
    return this.config.targetChatType || 'channel';
  }

  isSourceChannel() {
    return this.getSourceChatType() === 'channel';
  }

  isTargetChannel() {
    return this.getTargetChatType() === 'channel';
  }

  isSourceGroup() {
    return this.getSourceChatType() === 'group';
  }

  isTargetGroup() {
    return this.getTargetChatType() === 'group';
  }

  isSourceBot() {
    return this.getSourceChatType() === 'bot';
  }

  isTargetBot() {
    return this.getTargetChatType() === 'bot';
  }
}

module.exports = ChatSync;