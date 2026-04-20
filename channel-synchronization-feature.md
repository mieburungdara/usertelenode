# Chat Synchronization Feature Documentation

## Overview

The Chat Synchronization feature is a powerful addition to UserTeleNode that enables automated message replication between Telegram chats. This feature supports synchronization between any combination of Telegram chat types: channels, groups, supergroups, and bots. Users can designate a source chat (Chat A) from any type and a target channel (Channel B), with the system continuously monitoring and copying all new messages from the source to the target channel.

The system excels at aggregating content from various sources into a centralized channel, making it ideal for content curation, broadcasting, and cross-platform content management.

### Key Benefits
- **Universal Chat Support**: Works with channels, groups, and bot chats
- **Complete Content Replication**: Supports all Telegram message types for comprehensive synchronization
- **Real-time Sync**: Continuous monitoring with configurable intervals
- **Batch Processing**: Efficient handling of message streams to prevent API rate limits
- **Error Resilience**: Built-in retry mechanisms and error handling
- **Configurable Filtering**: Options to include/exclude specific message types or content
- **Audit Trail**: Logging and tracking of all synchronization activities

### Use Cases
- **Content Aggregation**: Collect messages from multiple groups, supergroups, and bots into a single channel
- **Broadcasting Hub**: Transform group discussions into channel broadcasts
- **Bot Content Publishing**: Automatically publish bot-generated content to channels
- **Community Curation**: Aggregate community discussions across multiple groups into curated channels
- **Cross-Platform Distribution**: Distribute content from various chat sources to channel audiences
- **News Aggregation**: Collect updates from multiple bot sources into a news channel
- **Event Coverage**: Aggregate live updates from event groups into broadcast channels
- **Support Ticket System**: Route support queries from groups to dedicated support channels

## Technical Requirements

### System Prerequisites
- **Node.js**: Version 16.0.0 or higher
- **Telegram User Account**: Valid user session with appropriate channel access
- **Database**: JSON-based storage (existing infrastructure) or optional database upgrade
- **Memory**: Minimum 512MB RAM for processing media-heavy channels

### Chat Access Requirements
The user account must have appropriate access levels based on chat type:

#### For Channels:
- **Source Channel**: Administrator or member with read access
- **Target Channel**: Administrator or member with posting permissions

#### For Groups:
- **Source Group**: Member with read access (public groups) or invited member (private groups)
- **Target Group**: Administrator or member with posting permissions

#### For Bots:
- **Source Bot**: Access to bot's chat history (if the bot shares messages)
- **Target Bot**: Ability to send messages to the bot

#### General Requirements:
- Ability to send media, polls, and all supported message types
- Sufficient API rate limits for the synchronization volume
- Network connectivity for media file transfers

### Architecture Integration
This feature integrates seamlessly with UserTeleNode's clean architecture:
- **Domain Layer**: Business logic and validation rules
- **Application Layer**: Use case orchestration
- **Infrastructure Layer**: Telegram API adapters and data persistence
- **Presentation Layer**: Console UI integration

## Supported Chat Types

The feature specializes in aggregating content from various sources into centralized channels:

### Group/Supergroup → Channel
- **Community Broadcasting**: Transform group discussions into channel broadcasts
- **Content Curation**: Aggregate valuable group content into themed channels
- **Event Coverage**: Live event updates from groups to broadcast channels
- **Support System**: Route support queries from help groups to support channels

### Bot → Channel
- **Automated Publishing**: Bot-generated content, reports, and announcements
- **News Aggregation**: Collect updates from multiple news bots into one channel
- **Service Integration**: Publish bot service updates and notifications
- **Data Visualization**: Automated charts and analytics from data bots

### Channel → Channel
- **Content Mirroring**: Backup and cross-posting between channels
- **Multi-language Distribution**: Localized content across different channels
- **Content Syndication**: Distribute content to partner channels

### Example Configurations

**Group to Channel Broadcasting:**
```json
{
  "sourceChatId": "@tech_discussion_group",
  "targetChatId": "@tech_news_channel",
  "sourceChatType": "group",
  "targetChatType": "channel"
}
```

**Bot to Channel Publishing:**
```json
{
  "sourceChatId": "@news_bot",
  "targetChatId": "@daily_news",
  "sourceChatType": "bot",
  "targetChatType": "channel"
}
```

**Supergroup to Channel Curation:**
```json
{
  "sourceChatId": "-1001234567890", // Supergroup ID
  "targetChatId": "@community_highlights",
  "sourceChatType": "group",
  "targetChatType": "channel"
}
```

### Progress Tracking Display

When selecting from saved sources, progress information is displayed:

```
📋 DAFTAR SOURCE TERSIMPAN:
─────────────────────────────────────
1. Tech Discussion Group (group) - 19/04/2026 (5x digunakan) | Last Msg: 15450 (Copied: 15432)
```

- **Last Msg**: ID of the last message encountered during synchronization
- **Copied**: ID of the last message that was successfully copied (updated every successful copy operation)

## Supported Message Types

The feature supports comprehensive message type synchronization across all chat types:

### Text Messages
- Plain text messages
- Formatted text (bold, italic, code, links)
- Forwarded messages with attribution

### Media Messages
- **Photos**: JPEG, PNG, WebP formats with captions
- **Videos**: MP4, AVI, MOV with thumbnails and metadata
- **Audio Files**: MP3, WAV, OGG with artist/title information
- **Voice Messages**: OGG-encoded voice notes with duration
- **Documents**: Any file type with custom names and MIME types

### Interactive Content
- **Stickers**: Static and animated stickers
- **Animations**: GIF and WebM animations
- **Games**: Telegram game messages
- **Polls**: Regular polls and quizzes with options
- **Dice**: Animated dice throws

### Special Messages
- **Location**: GPS coordinates with venue information
- **Contacts**: Shared contact cards
- **Invoices**: Payment invoice messages
- **Venue**: Location-based venue information

### Advanced Features
- **Forward Preservation**: Maintains original sender attribution
- **Reply Threads**: Preserves reply-to relationships
- **Message Threading**: Supports topic-based messaging in groups
- **Caption Support**: Includes all media captions and descriptions
- **Album Support**: Handles grouped media messages (multiple photos/videos)
- **Media Preservation**: Maintains original file quality and metadata
- **Batch Processing**: Efficient handling of multiple messages with rate limiting
- **Content Protection Handling**: Automatically downloads and re-uploads protected media
- **Automatic File Cleanup**: Removes temporary files after successful upload to prevent storage bloat
- **Fallback Mechanisms**: Graceful degradation when direct copying fails

## Saved Sources Management

The system automatically saves chat sources for easy reuse. Saved sources are stored in `data/chat_sync_sources.json` and include:

- **Source ID**: Chat identifier (@username, ID, etc.)
- **Source Type**: channel, group, or bot
- **Title**: Display name of the chat
- **Usage Count**: How many times the source has been used
- **Last Used**: Timestamp of last synchronization
- **Last Copy ID**: ID of the last message that was successfully copied (updated every time a message is successfully synced)
- **Last Message ID**: ID of the last message encountered during synchronization

### Benefits of Saved Sources:
- **Quick Selection**: Choose from previously used sources instead of typing
- **Usage Tracking**: See which sources are used most frequently
- **Progress Monitoring**: Track last copied message and synchronization progress
- **Resume Capability**: Know where synchronization left off for each source
- **Auto-Save**: New sources are automatically saved for future use
- **Search & Filter**: Find sources by title or ID

## Configuration Settings

Configuration is managed through JSON configuration files with the following structure:

```json
{
  "chatSync": {
    "enabled": true,
    "sourceChatId": "@group_chat", // Can be @group, supergroup ID, or @bot
    "targetChatId": "@broadcast_channel", // Typically a channel for broadcasting
    "sourceChatType": "group", // "channel", "group", or "bot"
    "targetChatType": "channel", // Usually "channel" for broadcasting
    "syncIntervalSeconds": 30,
    "batchSize": 10,
    "includeMedia": true,
    "preserveTimestamps": false,
    "retryAttempts": 3,
    "rateLimitDelayMs": 1000,
    "maxMessageAgeHours": 24,
    "excludedMessageTypes": [],
    "logLevel": "info"
  }
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable/disable the synchronization feature |
| `sourceChatId` | string | - | Username or ID of the source chat (group, supergroup, bot, or channel) |
| `targetChatId` | string | - | Username or ID of the target channel |
| `sourceChatType` | string | `"channel"` | Type of source chat: "channel", "group", or "bot" |
| `targetChatType` | string | `"channel"` | Type of target chat (typically "channel" for broadcasting) |
| `syncIntervalSeconds` | number | `30` | Time between synchronization checks |
| `batchSize` | number | `10` | Number of messages to process per batch |
| `includeMedia` | boolean | `true` | Whether to copy media files |
| `preserveTimestamps` | boolean | `false` | Keep original message timestamps |
| `retryAttempts` | number | `3` | Number of retry attempts for failed operations |
| `rateLimitDelayMs` | number | `1000` | Delay between API calls to prevent rate limiting |
| `maxMessageAgeHours` | number | `24` | Maximum age of messages to synchronize |
| `excludedMessageTypes` | array | `[]` | List of message types to exclude |
| `logLevel` | string | `"info"` | Logging verbosity level |

## Implementation Guide

### Phase 1: Domain Layer Implementation

#### Step 1.1: Create Chat Sync Entity
Create `src/domain/entities/ChatSync.js`:

```javascript
class ChannelSync {
  constructor(sourceChannelId, targetChannelId, config) {
    this.sourceChannelId = sourceChannelId;
    this.targetChannelId = targetChannelId;
    this.config = config;
    this.lastSyncTimestamp = null;
    this.status = 'idle'; // idle, running, paused, error
  }

  isEnabled() {
    return this.config.enabled;
  }

  shouldProcessMessage(message) {
    // Implementation for message filtering logic
    return true;
  }

  updateLastSync(timestamp) {
    this.lastSyncTimestamp = timestamp;
  }
}

module.exports = ChannelSync;
```

#### Step 1.2: Implement Chat Sync Service
Create `src/domain/services/ChatSyncService.js`:

```javascript
const ChatSync = require('../entities/ChatSync');

class ChatSyncService {
  constructor(telegramApi, historyRepository, logger) {
    this.telegramApi = telegramApi;
    this.historyRepository = historyRepository;
    this.logger = logger;
  }

  async synchronizeChats(chatSync) {
    // Fetch new messages from source channel
    const messages = await this.fetchNewMessages(channelSync);

    // Process messages (filter, extract content/media)
    const processedMessages = await this.processMessages(channelSync, messages);

    // Send messages to target channel (supports all media types and albums)
    const syncedCount = await this.sendMessagesToTarget(channelSync, processedMessages);

    // Save sync history
    await this.historyRepository.saveSyncHistory(
      channelSync.sourceChannelId,
      channelSync.targetChannelId,
      {
        syncedAt: new Date().toISOString(),
        messagesProcessed: messages.length,
        messagesSynced: syncedCount,
        errors: messages.length - syncedCount,
        duration: Date.now() - startTime
      }
    );

    return { success: true, processedCount: messages.length, syncedCount };
  }

  async sendMessagesToTarget(channelSync, processedMessages) {
    let syncedCount = 0;

    for (const processedMessage of processedMessages) {
      try {
        await this.sendSingleMessage(channelSync.targetChannelId, processedMessage);
        syncedCount++;
      } catch (error) {
        this.logger.warn(`Failed to sync message: ${error.message}`);
      }
    }

    return syncedCount;
  }

  async sendSingleMessage(targetChannelId, processedMessage) {
    const { content, media, type } = processedMessage;

    // Handle different message types including media and albums
    switch (type) {
      case 'text':
        return await this.telegramApi.sendMessage(targetChannelId, content.text);
      case 'photo':
        return await this.telegramApi.sendPhoto(targetChannelId, media.photo, {
          caption: media.caption
        });
      case 'video':
        return await this.telegramApi.sendVideo(targetChannelId, media.video, {
          caption: media.caption
        });
      case 'document':
        return await this.telegramApi.sendDocument(targetChannelId, media.document, {
          caption: media.caption
        });
      case 'audio':
        return await this.telegramApi.sendAudio(targetChannelId, media.audio, {
          caption: media.caption
        });
      // ... additional media types with content protection handling
      default:
        // Try forwarding for unsupported types (if content not protected)
        if (!this.isContentProtected(processedMessage.originalMessage)) {
          return await this.telegramApi.forwardMessage(targetChatId, processedMessage.originalMessage.id);
        }
        throw new Error(`Unsupported message type: ${type}`);
    }
  }

  // Content protection detection and handling methods
  isContentProtected(message) {
    // Check for Telegram content protection flags
    return message.media?.hasOwnProperty('content_protected') ||
           message.hasOwnProperty('content_protected');
  }

  async sendProtectedMedia(targetChatId, originalMessage, mediaType) {
    // Download protected media and re-upload
    const downloadedMedia = await this.telegramApi.downloadMedia(originalMessage.media[mediaType]);
    // Send using appropriate method based on media type
    return await this.telegramApi.sendFile(targetChatId, downloadedMedia);
  }
  }
}

module.exports = ChannelSyncService;
```

### Phase 2: Application Layer Implementation

#### Step 2.1: Create Synchronization Use Case
Create `src/application/useCases/RunChatSyncUseCase.js`:

```javascript
class RunChatSyncUseCase {
  constructor(chatSyncService, configService, historyRepository) {
    this.chatSyncService = chatSyncService;
    this.configService = configService;
    this.historyRepository = historyRepository;
  }

  async execute() {
    const config = await this.configService.getChatSyncConfig();

    // Ensure sync pair exists in history
    await this.historyRepository.addSyncPair(
      config.sourceChatId,
      config.targetChatId
    );

    const chatSync = new (require('../../domain/entities/ChatSync'))(
      config.sourceChatId,
      config.targetChatId,
      config
    );

    if (!chatSync.isEnabled()) {
      throw new Error('Chat synchronization is disabled in configuration');
    }

    return await this.chatSyncService.synchronizeChats(chatSync);
  }

  async execute() {
    const config = await this.configService.getChannelSyncConfig();

    // Ensure sync pair exists in history
    await this.historyRepository.addSyncPair(
      config.sourceChannelId,
      config.targetChannelId
    );

    const channelSync = new ChannelSync(config.sourceChannelId, config.targetChannelId, config);

    if (!channelSync.isEnabled()) {
      throw new Error('Channel synchronization is disabled');
    }

    return await this.channelSyncService.synchronizeChannels(channelSync);
  }
}

module.exports = RunChannelSyncUseCase;
```

### Phase 3: Infrastructure Layer Implementation

#### Step 3.1: Create Chat Sync History Repository
Create `src/infrastructure/repositories/ChatSyncHistoryRepository.js`:

```javascript
// Repository for managing chat synchronization history with readable JSON storage
class ChatSyncHistoryRepository {
  constructor(storage) {
    this.storage = storage;
  }

  async saveSyncHistory(sourceChannel, targetChannel, sessionData) {
    // Implementation for saving sync session data
  }

  async getLastSyncTimestamp(sourceChannel, targetChannel) {
    // Implementation for retrieving last sync timestamp
  }

  async addSyncPair(sourceChannel, targetChannel) {
    // Implementation for adding new sync pair
  }
}

module.exports = { ChannelSyncHistoryRepository };
```

The repository uses JSON storage for human-readable history tracking. Example structure:

```json
{
  "syncPairs": {
    "sourcechat_to_targetchat": {
      "sourceChat": "@sourcechat",
      "targetChat": "@targetchat",
      "sourceTitle": "Source Chat Title",
      "targetTitle": "Target Chat Title",
      "sourceChatType": "channel",
      "targetChatType": "group",
      "lastSyncedAt": "2026-04-19T06:42:44.000Z",
      "totalMessagesSynced": 150,
      "totalSyncSessions": 5,
      "status": "active",
      "syncSessions": [
        {
          "syncedAt": "2026-04-19T06:42:44.000Z",
          "messagesProcessed": 30,
          "messagesSynced": 28,
          "errors": 2,
          "duration": 45000,
          "sourceChatType": "channel",
          "targetChatType": "group"
        }
      ]
    }
  }
}
```

#### Saved Sources Storage
Source list is stored in `data/chat_sync_sources.json`:

```json
{
  "techdiscussiongroup": {
    "id": "@tech_discussion_group",
    "type": "group",
    "title": "Tech Discussion Group",
    "lastUsed": "2026-04-19T07:36:44.000Z",
    "usageCount": 5,
    "addedAt": "2026-04-15T10:00:00.000Z",
    "lastCopyId": 15432,
    "lastMessageId": 15450
  }
}
```

#### Step 3.2: Extend Telegram API Adapter
Update `src/infrastructure/adapters/TelegramApiAdapter.js` to include channel operations:

```javascript
class TelegramApiAdapter {
  // ... existing methods ...

  async getChannelMessages(channelId, limit = 10, offsetId = null) {
    // Implementation for fetching channel messages
  }

  async sendMessageToChannel(channelId, messageData) {
    // Implementation for sending messages to channel
  }

  async forwardMessage(sourceChannelId, targetChannelId, messageId) {
    // Implementation for forwarding messages
  }
}
```

### Phase 4: Presentation Layer Integration

#### Step 4.1: Update Console UI
Update `src/presentation/ConsoleUI.js` to include synchronization options:

```javascript
class ConsoleUI {
  // ... existing methods ...

  showChannelSyncMenu() {
    console.log('=== Channel Synchronization ===');
    console.log('1. Start Synchronization');
    console.log('2. Stop Synchronization');
    console.log('3. View Sync Status');
    console.log('4. Configure Sync Settings');
    console.log('0. Back to Main Menu');
  }

  async handleChannelSyncCommand(command) {
    switch (command) {
      case '1':
        await this.startChannelSync();
        break;
      case '2':
        await this.stopChannelSync();
        break;
      case '3':
        await this.viewSyncStatus();
        break;
      case '4':
        await this.configureSyncSettings();
        break;
    }
  }
}
```

### Phase 5: Configuration and Testing

#### Step 5.1: Update Configuration Files
Ensure configuration is loaded in `src/infrastructure/config/ConfigService.js`.

#### Step 5.2: Add Unit Tests
Create comprehensive unit tests for all new components:

```
tests/
├── domain/
│   ├── entities/
│   │   └── ChannelSync.test.js
│   └── services/
│       └── ChannelSyncService.test.js
├── application/
│   └── useCases/
│       └── RunChannelSyncUseCase.test.js
└── infrastructure/
    ├── repositories/
    │   └── ChannelSyncRepository.test.js
    └── adapters/
        └── TelegramApiAdapter.test.js
```

#### Step 5.3: Integration Testing
Create integration tests to verify end-to-end synchronization functionality.

### Phase 6: Deployment and Monitoring

#### Step 6.1: Add Logging and Monitoring
Implement comprehensive logging throughout the synchronization process.

#### Step 6.2: Performance Optimization
Add caching and batch processing optimizations for high-volume channels.

#### Step 6.3: Documentation Update
Update main project documentation to include the new feature.

## Troubleshooting

### Common Issues and Solutions

#### Issue: "User account lacks permissions to read source chat messages"
**Solution**:
- **For Groups/Supergroups**: Ensure the user account is a member of the group. For private groups, you must be invited by an admin
- **For Bots**: The bot must have sent messages to your account or you need to initiate contact with the bot first
- **For Channels**: Ensure the user account has read access to the channel (administrator or member)

#### Issue: "Cannot send messages to target channel"
**Solution**:
- Ensure the user account is an administrator of the target channel with posting permissions
- Verify the channel exists and is accessible
- Check that the channel hasn't been deleted or made private

#### Issue: "Cannot send messages to target chat"
**Solution**:
- **For Channels**: Verify administrator permissions with posting rights
- **For Groups**: Ensure member status with message sending permissions
- **For Bots**: Verify the bot accepts messages and has appropriate command handling

#### Issue: "Content protection prevents media copying"
**Solution**:
- The system automatically detects protected content
- Protected media is downloaded and re-uploaded automatically
- Ensure sufficient bandwidth and storage for media downloads
- Check that the user account has permission to download media from source chat
- Protected content may take longer to sync due to download/upload process

#### Issue: "Saved sources list is empty or not showing"
**Solution**:
- Sources are automatically saved after first use
- Check if `data/chat_sync_sources.json` exists and is readable
- Manually add sources to the JSON file if needed
- Ensure write permissions to the data directory

#### Issue: "Cannot find previously used source"
**Solution**:
- Check the source ID format (should match exactly)
- Verify the source still exists and is accessible
- Use the "Input manual" option to re-enter the source
- Remove and re-add the source if the title has changed

#### Issue: "Progress information not updating"
**Solution**:
- Progress is updated after each successful synchronization
- Check write permissions to `data/chat_sync_sources.json`
- Verify that messages were actually processed during sync
- Manually update the JSON file if needed for testing

#### Issue: "Last Copy ID differs from Last Message ID"
**Solution**:
- This is normal when some messages fail to copy (due to permissions, content protection, etc.)
- The system tracks both to show processing progress vs. successful copies
- Check sync logs for details on failed message copies
- Last Copy ID is updated every time a message is successfully synced, so it represents the most recent successful copy

#### Issue: "Temporary files accumulating in storage"
**Solution**:
- The system automatically cleans up temporary files after successful uploads
- Check that uploads are completing successfully (no errors in logs)
- If cleanup fails, temporary files are cleaned up on next successful operation
- Monitor disk space and clear temp directory manually if needed: `rm -rf /tmp/protected_*`
- Ensure write permissions to temp directory for cleanup operations

#### Issue: "Rate limit exceeded"
**Solution**:
- Increase `rateLimitDelayMs` in configuration
- Reduce `batchSize` for processing
- Implement exponential backoff in retry logic

#### Issue: "Media files not copying"
**Solution**:
- Verify `includeMedia` is set to `true`
- Check user account permissions for sending media
- Ensure sufficient bandwidth and storage
- Check file size limits (Telegram limits: 2GB for documents, 10MB for media)

#### Issue: "Albums not copying as grouped media"
**Solution**:
- Albums are processed as individual messages by default
- Use `sendAlbum` method for grouped media if supported
- Some album types may be sent as separate messages to ensure compatibility

#### Issue: "Messages arriving out of order"
**Solution**:
- Enable `preserveTimestamps` if supported
- Implement message queuing with sequence numbers
- Use batch processing to maintain order

#### Issue: "Synchronization stops unexpectedly"
**Solution**:
- Check application logs for error details
- Verify network connectivity
- Ensure Telegram API is accessible
- Restart the synchronization process

### Debug Commands

```bash
# View current sync status
node index.js --command view-sync-status

# Force synchronization run
node index.js --command force-sync

# Clear sync cache
node index.js --command clear-sync-cache

# View sync history
node index.js --command view-sync-history

# View sync statistics for a pair
node index.js --command view-sync-stats --source @sourcechannel --target @targetchannel

# View saved sources
node index.js --command view-saved-sources

# Remove a saved source
node index.js --command remove-source --id @sourcechat
```

### Storage Files

#### History Storage
Sync history is stored in `data/chat_sync_history.json` in a human-readable format:

#### Saved Sources Storage
Source list is stored in `data/chat_sync_sources.json`:

```json
{
  "techdiscussiongroup": {
    "id": "@tech_discussion_group",
    "type": "group",
    "title": "Tech Discussion Group",
    "lastUsed": "2026-04-19T07:36:44.000Z",
    "usageCount": 5,
    "addedAt": "2026-04-15T10:00:00.000Z"
  },
  "newsbot": {
    "id": "@news_bot",
    "type": "bot",
    "title": "Daily News Bot",
    "lastUsed": "2026-04-19T06:42:44.000Z",
    "usageCount": 12,
    "addedAt": "2026-04-10T15:30:00.000Z"
  }
}
```

```json
{
  "syncPairs": {
    "source_to_target": {
      "sourceChannel": "@source",
      "targetChannel": "@target",
      "lastSyncedAt": "2026-04-19T06:42:44.000Z",
      "totalMessagesSynced": 150,
      "totalSyncSessions": 5,
      "syncSessions": [...]
    }
  }
}
```

This file can be manually edited or backed up as needed.

### Performance Tuning

- **High Volume Channels**: Reduce `syncIntervalSeconds` to 10-15 seconds
- **Media-Heavy Channels**: Increase `batchSize` to 5-7 messages
- **Low Bandwidth**: Set `includeMedia` to `false` temporarily
- **API Limits**: Monitor rate limits and adjust `rateLimitDelayMs`

### Source Type Optimization

- **Bot Sources**: Use smaller batch sizes (5 messages) and longer intervals (60+ seconds)
- **Group Sources**: Moderate batch sizes (10-20 messages) with standard intervals
- **Channel Sources**: Larger batch sizes possible with shorter intervals for real-time sync
- **Protected Content**: Account for download/upload time when setting rate limits

### Storage Management

- **Automatic Cleanup**: Temporary files are automatically deleted after successful upload
- **Temporary Directory**: Files are stored in OS temp directory during processing
- **Error Recovery**: Failed uploads still clean up temporary files to prevent accumulation
- **Monitoring**: Debug logs show cleanup operations for troubleshooting

### Support and Maintenance

For additional support:
1. Check the application logs in `logs/channel_sync.log`
2. Verify configuration settings match your channel setup
3. Test with a small batch size first
4. Ensure all prerequisites are met before deployment

This documentation provides a complete guide for implementing and maintaining the Chat Synchronization feature in UserTeleNode, specializing in content aggregation from groups, supergroups, and bots into centralized broadcast channels.