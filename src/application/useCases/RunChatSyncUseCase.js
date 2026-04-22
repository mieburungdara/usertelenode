// src/application/useCases/RunChatSyncUseCase.js
const ChatSync = require('../../domain/entities/ChatSync');

/**
 *
 */
class RunChatSyncUseCase {
  /**
   *
   * @param chatSyncService
   * @param configService
   * @param historyRepository
   * @param sourceRepository
   * @param ui
   */
  constructor (chatSyncService, configService, historyRepository, sourceRepository = null, ui = null) {
    this.chatSyncService = chatSyncService;
    this.configService = configService;
    this.historyRepository = historyRepository;
    this.sourceRepository = sourceRepository;
    this.ui = ui;
  }

  /**
   *
   */
  async execute () {
    // Get configuration interactively if UI is available
    let config;
    if (this.ui) {
      config = await this.ui.getChatSyncConfigInput(this.sourceRepository);
    } else {
      config = await this.configService.getChatSyncConfig();
    }

    return await this.executeWithConfig(config);
  }

  /**
   *
   * @param customConfig
   */
  async executeWithCustomConfig (customConfig) {
    return await this.executeWithConfig(customConfig);
  }

  /**
   *
   * @param config
   */
  async executeWithConfig (config) {
    // Validate configuration
    if (!config?.sourceChatId || !config?.targetChatId) {
      throw new Error('Source chat ID and target chat ID are required');
    }

    // Ensure sync pair exists in history
    await this.historyRepository.addSyncPair(
      config.sourceChatId,
      config.targetChatId,
      config.sourceChatTitle,
      config.targetChatTitle,
    );

    const chatSync = new ChatSync(
      config.sourceChatId,
      config.targetChatId,
      config,
    );

    if (!chatSync.isEnabled()) {
      throw new Error('Chat synchronization is disabled in configuration');
    }

    const result = await this.chatSyncService.synchronizeChats(chatSync);

    // Update source usage if source repository is available
    if (this.sourceRepository && config.sourceChatId) {
      try {
        await this.sourceRepository.saveSource({
          /**
           *
           */
          id: config.sourceChatId,
          /**
           *
           */
          type: config.sourceChatType,
          /**
           *
           */
          title: config.sourceChatTitle || config.sourceChatId,
        });
      } catch (error) {
        console.warn('Warning: Could not update source usage:', error.message);
      }
    }

    return result;
  }
}

module.exports = RunChatSyncUseCase;
