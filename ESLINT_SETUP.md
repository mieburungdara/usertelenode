# ESLint Setup & Clean Architecture Enforcement - UserTeleNode

## 📋 Ringkasan Implementasi

Implementasi ESLint yang komprehensif dengan JSDoc untuk mencegah kesalahan sintaks dan enforce arsitektur Clean Architecture pada proyek UserTeleNode.

### 🎯 Tujuan
- **Mencegah kesalahan sintaks** dengan linting ketat
- **Enforce Clean Architecture** melalui boundaries dan typedef
- **Tipe safety** menggunakan JSDoc typedef
- **Dokumentasi otomatis** melalui komentar terstruktur

### 🔧 Teknologi
- **ESLint**: Core linting engine
- **eslint-plugin-jsdoc**: JSDoc validation
- **eslint-plugin-boundaries**: Architecture enforcement
- **eslint-config-standard**: Base rules

## 🏗️ Arsitektur yang Di-enforce

```
src/
├── presentation/          # UI Layer (ConsoleUI, WebUI)
│   └── interfaces/        # IUI, IAccountManager
├── application/           # Use Cases, Application Services
│   ├── interfaces/        # IRunDeepLinkScraperUseCase
│   └── useCases/          # RunDeepLinkScraperUseCase
├── domain/               # Business Logic
│   ├── interfaces/       # IScrapingService, IBotInteractionService
│   ├── entities/         # Account, Channel, Message
│   └── services/         # ScrapingService, BotInteractionService
├── infrastructure/       # External Concerns
│   ├── interfaces/       # ITelegramClient, IStorage
│   ├── adapters/         # TelegramClientAdapter, FileStorageAdapter
│   └── repositories/     # AccountRepository, ScrapingHistoryRepository
├── shared/               # Shared Utilities
│   └── types/            # Common typedefs (ChannelInfo, Account, etc.)
```

### 📊 Dependency Rules
| From | Allow Import |
|------|--------------|
| Presentation | Application, Shared |
| Application | Domain, Infrastructure, Shared |
| Domain | Domain, Shared |
| Infrastructure | Domain, Infrastructure, Shared |
| Shared | Shared |

## 📝 Typedef JSDoc

### Common Types (src/shared/types/common.js)
```js
/**
 * @typedef {Object} ChannelInfo
 * @property {string} channelName - Nama channel (@channelname)
 * @property {number|null} lastMessageId - ID pesan terakhir
 * @property {number|null} lastScrapedId - ID pesan terakhir yang di-scrape
 * @property {string|null} lastMessageTimestamp - Timestamp pesan terakhir
 * @property {string} status - Status channel
 */

/**
 * @typedef {Object} Account
 * @property {string} phone - Nomor telepon
 * @property {string|null} username - Username Telegram
 * @property {string|null} firstName - Nama depan
 * @property {string} sessionPath - Path file session
 */
```

### Interface Contracts
```js
/**
 * @typedef {Object} IScrapingService
 * @property {function(string, number, number, IBotInteractionService): Promise<ScrapingResult>} scrapeChannel
 * @property {function(): Promise<ChannelInfo[]>} getAvailableChannels
 * @property {function(ChannelInfo[]): Promise<ChannelInfo[]>} checkChannels
 */
```

## 🚀 Setup & Instalasi

### 1. Install Dependencies
```bash
npm install --save-dev eslint eslint-plugin-jsdoc eslint-config-standard eslint-plugin-boundaries
```

### 2. Konfigurasi ESLint (.eslintrc.js)
```js
module.exports = {
  extends: ['standard'],
  plugins: ['jsdoc', 'boundaries'],
  parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
  rules: {
    // JSDoc rules
    'jsdoc/require-description': 'error',
    'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: true, MethodDefinition: true, ClassDeclaration: true } }],
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error',
    // Syntax prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': 'warn'
  },
  settings: {
    jsdoc: { mode: 'typescript' },
    boundaries: {
      default: 'shared',
      elements: [
        { type: 'presentation', pattern: 'src/presentation/**/*' },
        { type: 'application', pattern: 'src/application/**/*' },
        { type: 'domain', pattern: 'src/domain/**/*' },
        { type: 'infrastructure', pattern: 'src/infrastructure/**/*' },
        { type: 'shared', pattern: 'src/shared/**/*' }
      ],
      rules: [
        { from: 'presentation', allow: ['application', 'shared'] },
        { from: 'application', allow: ['domain', 'infrastructure', 'shared'] },
        { from: 'domain', allow: ['domain', 'shared'] },
        { from: 'infrastructure', allow: ['domain', 'infrastructure', 'shared'] }
      ]
    }
  }
};
```

### 3. NPM Scripts (package.json)
```json
{
  "scripts": {
    "lint": "eslint src/ --ext .js",
    "lint:fix": "eslint src/ --ext .js --fix",
    "lint:check": "npm run lint -- --max-warnings 0"
  }
}
```

### 4. .eslintignore
```
node_modules/
*.log
.env
coverage/
```

## 📚 Panduan Migrasi

### Phase 1: Setup Infrastructure
1. ✅ Install dependencies
2. ✅ Buat .eslintrc.js
3. ✅ Setup npm scripts
4. ✅ Buat .eslintignore

### Phase 2: Define Contracts (Interface Files)
1. ✅ Buat typedef di `src/shared/types/common.js`
2. ✅ Buat interface contracts untuk setiap layer
3. ✅ Validasi typedef syntax

### Phase 3: Migrate Implementation Files
1. 🟡 Mulai dari entities (sudah sebagian)
2. ⏳ Services (sedang berjalan)
3. ⏳ Repositories dan adapters
4. ⏳ Use cases dan UI

### Phase 4: Enable Enforcement
1. ⏳ Aktifkan boundaries rules
2. ⏳ Aktifkan JSDoc strict mode
3. ⏳ Setup pre-commit hooks

## 🔍 Contoh Implementasi

### Entity dengan JSDoc
```js
/**
 * @file Domain entity untuk Account
 */
class Account {
  /**
   * @param {string} id - ID unik akun
   * @param {string|null} username - Username Telegram
   * @param {string} phone - Nomor telepon
   */
  constructor(id, username, phone) {
    this.id = id;
    this.username = username;
    this.phone = phone;
  }
}
```

### Service dengan Interface
```js
/**
 * @file Domain service untuk scraping
 * @implements {IScrapingService}
 */
class ScrapingService {
  /**
   * @param {ITelegramClient} telegramClient
   * @param {IScrapingHistoryRepository} historyRepo
   */
  constructor(telegramClient, historyRepo) {
    this.telegramClient = telegramClient;
    this.historyRepo = historyRepo;
  }

  /**
   * @param {string} channel
   * @param {number} startId
   * @param {number} endId
   * @param {IBotInteractionService} botInteractionService
   * @returns {Promise<ScrapingResult>}
   */
  async scrapeChannel(channel, startId, endId, botInteractionService) {
    // implementation
  }
}
```

## ⚙️ Integrasi CI/CD

### GitHub Actions (.github/workflows/lint.yml)
```yaml
name: Lint
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run lint:check
```

### Pre-commit Hooks (husky)
```bash
npx husky install
npx husky add .husky/pre-commit "npm run lint"
```

## ✅ Checklist Implementasi

### Setup Infrastructure
- [x] Install ESLint & plugins
- [x] Konfigurasi .eslintrc.js
- [x] Setup npm scripts
- [x] Buat .eslintignore

### Define Contracts
- [x] Common types (Account, ChannelInfo, etc.)
- [x] Domain interfaces (IScrapingService, IBotInteractionService)
- [x] Infrastructure interfaces (ITelegramClient, IStorage)
- [x] Application interfaces (IRunDeepLinkScraperUseCase)
- [x] Presentation interfaces (IUI, IAccountManager)

### Migrate Implementation
- [x] Domain entities (Account, Channel, Message)
- [🟡] Domain services (BotInteractionService ✅, ScrapingService partial, ReplyService ❌)
- [ ] Infrastructure adapters (TelegramClientAdapter, FileStorageAdapter)
- [ ] Infrastructure repositories (AccountRepository, ScrapingHistoryRepository)
- [ ] Application use cases (RunDeepLinkScraperUseCase)
- [ ] Presentation UI (ConsoleUI)

### Enable Enforcement
- [ ] Aktifkan boundaries rules (disabled sementara untuk fokus JSDoc)
- [ ] Aktifkan JSDoc strict mode
- [x] Setup pre-commit hooks (.husky/pre-commit created)
- [x] CI/CD integration (GitHub Actions workflow created)
- [x] Dokumentasi guidelines (ESLINT_SETUP.md created)

## 🎯 Status Progress

**Current**: Phase 3 - Migrate Implementation (40% complete)
- ✅ Entities: 100% (Account, Channel, Message)
- 🟡 Services: 60% (BotInteractionService done, ScrapingService partial)
- ❌ Adapters/Repositories: 0%
- ❌ Use Cases/UI: 0%

**Lint Status**: 164 problems (146 errors, 18 warnings) - down from 347 initial
- ✅ Infrastructure: Setup complete
- ✅ Type definitions: Complete
- ✅ Entities migration: Complete
- 🟡 Services migration: In progress

**Next Steps**:
1. Selesaikan migrasi services (ReplyService, ScrapingService)
2. Migrate adapters dan repositories
3. Aktifkan boundaries enforcement
4. Setup CI/CD dan pre-commit hooks

## 📞 Troubleshooting

### Common Issues
1. **Boundaries not working**: Pastikan pattern di settings cocok dengan struktur folder
2. **JSDoc validation errors**: Gunakan `npm run lint:fix` untuk auto-fix
3. **Unused parameters**: Prefix dengan `_` untuk ignore (contoh: `function(_unused)`)

### Debug Commands
```bash
# Check lint status
npm run lint

# Auto-fix fixable issues
npm run lint:fix

# Strict check (no warnings allowed)
npm run lint:check
```

---

**Dokumentasi ini akan diupdate seiring progress implementasi**