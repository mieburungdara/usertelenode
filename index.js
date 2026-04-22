#!/usr/bin/env node
/**
 * UserTeleNode - Telegram User Bot dengan Node.js
 *
 * Fitur:
 * - Multi Account Management
 * - Auto Reply Mode
 * - Deep Link Scraper Mode
 * - Safe Exit dengan Report Generation
 */

let readlineSync;
try {
  readlineSync = require('readline-sync');
} catch (e) {
  console.error('❌ Module readline-sync tidak ditemukan. Jalankan: npm install');
  process.exit(1);
}

// Buat readline interface
const rl = {
  /**
   *
   * @param query
   */
  question: (query) => readlineSync.question(query),
  /**
   *
   */
  close: () => {},
};

// Import new modular modules
const Config = require('./src/infrastructure/Config');
const prisma = require('./src/infrastructure/adapters/PrismaClientAdapter');
const { /**
 *
 */
  TelegramClientAdapter,
} = require('./src/infrastructure/adapters/TelegramClientAdapter');
const { /**
 *
 */
  AccountRepository,
} = require('./src/infrastructure/repositories/AccountRepository');
const { /**
 *
 */
  ScrapingHistoryRepository,
} = require('./src/infrastructure/repositories/ScrapingHistoryRepository');
const { /**
 *
 */
  ChatSyncHistoryRepository,
} = require('./src/infrastructure/repositories/ChatSyncHistoryRepository');
const { /**
 *
 */
  ChatSyncSourceRepository,
} = require('./src/infrastructure/repositories/ChatSyncSourceRepository');
const { /**
 *
 */
  ScrapingService,
} = require('./src/domain/services/ScrapingService');
const { /**
 *
 */
  ChatSyncService,
} = require('./src/domain/services/ChatSyncService');
const { /**
 *
 */
  ReplyService,
} = require('./src/domain/services/ReplyService');
const BotInteractionService = require('./src/domain/services/BotInteractionService');
const RunDeepLinkScraperUseCase = require('./src/application/useCases/RunDeepLinkScraperUseCase');
const RunChatSyncUseCase = require('./src/application/useCases/RunChatSyncUseCase');
const ConsoleUI = require('./src/presentation/ConsoleUI');

// Setup DI
const config = new Config();
const accountRepo = new AccountRepository();
const historyRepo = new ScrapingHistoryRepository();
const chatSyncHistoryRepo = new ChatSyncHistoryRepository();
const chatSyncSourceRepo = new ChatSyncSourceRepository();

// For simplicity, assume client is created here
// const telegramClient = new TelegramClientAdapter(client);

// Import legacy for now
let addAccount, listAccounts, selectAccount, deleteAccount, loadClient;
let setupAutoReply, deepLinkScraper;
try {
  ({ /**
   *
   */
    addAccount, /**
   *
   */
    listAccounts, /**
   *
   */
    selectAccount, /**
   *
   */
    deleteAccount, /**
   *
   */
    loadClient,
  } = require('./utils/accountManager'));
  setupAutoReply = require('./handlers/autoReply');
  deepLinkScraper = require('./handlers/deepLinkScraper');
} catch (e) {
  console.error('❌ Gagal memuat modul:', e.message);
  process.exit(1);
}

// Helper: Timeout wrapper for disconnect
/**
 *
 * @param client
 * @param timeoutMs
 */
async function disconnectWithTimeout (client, timeoutMs = 5000) {
  try {
    await Promise.race([
      client.disconnect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
  } catch (e) {
    // Silently ignore disconnect errors (including timeout)
  }
}

// Tampilkan header
/**
 *
 */
function printHeader () {
  try { console.clear(); } catch (e) { /* ignore unsupported terminals */ }
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🤖 UserTeleNode - User Bot Telegram  ║');
  console.log('║     Dibuat dengan Node.js + GramJS       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
}

// Tampilkan menu utama
/**
 *
 */
function printMainMenu () {
  console.log('📋 Menu Utama:');
  console.log('─'.repeat(40));
  console.log('  1. 🤖 Auto Reply Mode');
  console.log('  2. 🔗 Deep Link Scraper Mode (Scrape channel publik dan generate laporan)');
  console.log('  3. 🔄 Chat Synchronization (Sinkronisasi dari group/bot ke channel)');
  console.log('  4. ➕ Tambah Akun Baru');
  console.log('  5. ❌ Hapus Akun');
  console.log('  6. 🚪 Keluar');
  console.log('');
}

// Safe exit handler - creates isolated handler per mode execution
/**
 *
 * @param client
 * @param cleanupFn
 */
function createSafeExitHandler (client, cleanupFn) {
  let isRunning = true;

  const handler = async () => {
    if (!isRunning) { return; }
    isRunning = false;

    console.log('\n\n⚠️  Menerima sinyal berhenti...');
    console.log('👋 Menutup koneksi...');

    // Call cleanup if provided
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (e) {
        console.warn('⚠️  Error during cleanup:', e.message);
      }
    }

    try {
      if (client) {
        await disconnectWithTimeout(client, 5000);
      }
    } catch (e) {
      // Ignore disconnect errors
    }

    console.log('✅ Bot berhenti dengan aman.');
    process.exit(0);
  };

  return handler;
}

// Mode 1: Auto Reply
/**
 *
 */
async function runAutoReplyMode () {
  const account = selectAccount(rl);
  if (!account) {
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
  }

  console.log('\n🔄 Menghubungkan dengan akun @' + (account.username || account.phone || 'unknown') + '...');

  let client = null;
  let cleanupAutoReply = null;
  try {
    client = await loadClient(account);
    const me = await client.getMe();
    console.log('✅ Terhubung sebagai @' + (me.username || me.firstName || 'unknown'));

    // Setup auto reply (returns cleanup function)
    cleanupAutoReply = setupAutoReply(client);

    // Create dedicated safe exit handler for this session
    const safeExitHandler = createSafeExitHandler(client, cleanupAutoReply);
    process.on('SIGINT', safeExitHandler);
    process.on('SIGTERM', safeExitHandler);
    process.on('SIGBREAK', safeExitHandler);

    // Keep script running
    console.log('Bot berjalan... Tekan Ctrl+C untuk berhenti.');

    // Block execution until process exits
    await new Promise(() => {});
  } catch (error) {
    console.error('❌ Gagal menghubungkan client:', error.message);
    if (cleanupAutoReply) {
      try { cleanupAutoReply(); } catch (e) {}
    }
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
  }
}

// Mode 2: Deep Link Scraper
/**
 *
 */
async function runDeepLinkScraper () {
  // Use new modular architecture
  const account = selectAccount(rl);
  if (!account) {
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
  }

  console.log('\n🔄 Menghubungkan dengan akun @' + (account.username || account.phone || 'unknown') + '...');

  let client = null;
  try {
    client = await loadClient(account);
    const me = await client.getMe();
    console.log('✅ Terhubung sebagai @' + (me.username || me.firstName || 'unknown'));

    // Setup new architecture
    const telegramAdapter = new TelegramClientAdapter(client);
    const scrapingService = new ScrapingService(telegramAdapter, historyRepo);
    const botInteractionService = new BotInteractionService(telegramAdapter);
    const ui = new ConsoleUI(rl);
    const useCase = new RunDeepLinkScraperUseCase(scrapingService, botInteractionService, ui);

    await useCase.execute(account);

    await disconnectWithTimeout(client, 5000);
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
  }
}

// Mode 3: Chat Synchronization
/**
 *
 */
async function runChatSynchronization () {
  // Use new modular architecture
  const account = selectAccount(rl);
  if (!account) {
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
  }

  console.log('\n🔄 Menghubungkan dengan akun @' + (account.username || account.phone || 'unknown') + '...');

  let client = null;
  try {
    client = await loadClient(account);
    const me = await client.getMe();
    console.log('✅ Terhubung sebagai @' + (me.username || me.firstName || 'unknown'));

    // Setup new architecture for chat sync
    const telegramAdapter = new TelegramClientAdapter(client);
    const chatSyncService = new ChatSyncService(telegramAdapter, chatSyncHistoryRepo, console, chatSyncSourceRepo);
    const ui = new ConsoleUI(rl);
    const useCase = new RunChatSyncUseCase(chatSyncService, config, chatSyncHistoryRepo, chatSyncSourceRepo, ui);

    await useCase.execute();

    await disconnectWithTimeout(client, 5000);
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
  }
}

// Mode 3: Tambah Akun
/**
 *
 */
async function runAddAccount () {
  try {
    await addAccount();
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menambahkan akun:', error.message);
  }
  rl.question('\nTekan Enter untuk kembali ke menu utama...');
}

// Mode 4: Hapus Akun
/**
 *
 */
function runDeleteAccount () {
  try {
    deleteAccount(rl);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menghapus akun:', error.message);
  }
  rl.question('\nTekan Enter untuk kembali ke menu utama...');
}

// Main function - iterative loop instead of recursion
/**
 *
 */
async function main () {
  while (true) {
    printHeader();
    printMainMenu();

    const choiceInput = rl.question('Masukkan pilihan (1-6): ');
    if (!choiceInput || !choiceInput.trim()) {
      console.log('\n❌ Input kosong atau hanya spasi.');
      rl.question('\nTekan Enter untuk mencoba lagi...');
      continue;
    }
    const choice = choiceInput.trim();

    switch (choice) {
    case '1':
      await runAutoReplyMode();
      break;
    case '2':
      await runDeepLinkScraper();
      break;
    case '3':
      await runChatSynchronization();
      break;
    case '4':
      await runAddAccount();
      // Continue to next iteration (menu restart)
      break;
    case '5':
      runDeleteAccount();
      // Continue to next iteration
      break;
    case '6':
      console.log('\n👋 Terima kasih telah menggunakan UserTeleNode!');
      process.exit(0);
      break;
    default:
      console.log('\n❌ Pilihan tidak valid.');
      rl.question('\nTekan Enter untuk mencoba lagi...');
      break;
    }
  }
}

// Jalankan main
main().catch(console.error);
