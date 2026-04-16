# UserTeleNode Architecture Documentation

## Overview
UserTeleNode is a Telegram bot application refactored to follow Clean Architecture principles for better modularity, testability, and maintainability.

## Architecture Layers

### Domain Layer
Contains core business logic and entities.
- **Entities**: Channel, Message, Account
- **Services**: ScrapingService, ReplyService

### Application Layer
Orchestrates use cases and business workflows.
- **Use Cases**: RunDeepLinkScraperUseCase

### Infrastructure Layer
Handles external concerns like data persistence and external APIs.
- **Adapters**: TelegramClientAdapter, FileStorageAdapter
- **Repositories**: AccountRepository, ScrapingHistoryRepository

### Presentation Layer
Manages user interface and input/output.
- **UI Components**: ConsoleUI

## Dependencies and Interfaces
- All modules communicate via interfaces (documented in code comments).
- Dependency injection used for loose coupling.

## Development Guidelines
- Follow SOLID principles.
- Add unit tests for new modules.
- Use structured logging.

## Migration Notes
- Legacy code in handlers/ maintained for compatibility.
- New features should use modular structure.