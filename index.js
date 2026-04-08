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
  question: (query) => readlineSync.question(query),
  close: () => {}
};

// Import modules
let addAccount, listAccounts, selectAccount, deleteAccount, loadClient;
let setupAutoReply, deepLinkScraper;
try {
  ({ addAccount, listAccounts, selectAccount, deleteAccount, loadClient } = require('./utils/accountManager'));
  setupAutoReply = require('./handlers/autoReply');
  deepLinkScraper = require('./handlers/deepLinkScraper');
} catch (e) {
  console.error('❌ Gagal memuat modul:', e.message);
  process.exit(1);
}

// Helper: Timeout wrapper for disconnect
async function disconnectWithTimeout(client, timeoutMs = 5000) {
  try {
    await Promise.race([
      client.disconnect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
    ]);
  } catch (e) {
    // Silently ignore disconnect errors (including timeout)
  }
}

// Tampilkan header
function printHeader() {
  try { console.clear(); } catch (e) { /* ignore unsupported terminals */ }
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     🤖 UserTeleNode - User Bot Telegram  ║');
  console.log('║     Dibuat dengan Node.js + GramJS       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
}

// Tampilkan menu utama
function printMainMenu() {
  console.log('📋 Menu Utama:');
  console.log('─'.repeat(40));
  console.log('  1. 🤖 Auto Reply Mode');
  console.log('  2. 🔗 Deep Link Scraper Mode');
  console.log('  3. ➕ Tambah Akun Baru');
  console.log('  4. ❌ Hapus Akun');
  console.log('  5. 🚪 Keluar');
  console.log('');
}

// Safe exit handler untuk auto reply
// Use module-level variables to prevent handler accumulation and stale references
let _safeExitSetup = false;
let _currentClient = null;

function setupSafeExit(client) {
  _currentClient = client;  // Always update to latest client

  if (_safeExitSetup) return;
  _safeExitSetup = true;

  // Use once() instead of on() to prevent handler accumulation
  const sigHandler = async () => {
    console.log('\n\n⚠️  Menerima sinyal berhenti...');
    console.log('👋 Menutup koneksi...');

    try {
      if (_currentClient) {
        await disconnectWithTimeout(_currentClient, 5000);
      }
    } catch (e) {
      // Ignore disconnect errors
    }

    console.log('✅ Bot berhenti dengan aman.');
    process.exit(0);
  };

  process.once('SIGINT', sigHandler);
  process.once('SIGTERM', sigHandler);
  process.once('SIGBREAK', sigHandler); // Windows Ctrl+Break
}

// Mode 1: Auto Reply
async function runAutoReplyMode() {
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

    setupSafeExit(client);

    // Setup auto reply
    await setupAutoReply(client, () => {
      // Client sudah idle di event handler
    });

    // Keep script running
    console.log('Bot berjalan... Tekan Ctrl+C untuk berhenti.');

    // Block execution until process exits
    await new Promise(() => {});

  } catch (error) {
    console.error('❌ Gagal menghubungkan client:', error.message);
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return; // Return to menu, don't recurse
  }
}

// Mode 2: Deep Link Scraper
async function runDeepLinkScraper() {
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

    // Register safe exit for this mode
    setupSafeExit(client);

    // Jalankan scraper dengan readline-sync interface wrapper
    await deepLinkScraper(client, rl);

  } catch (error) {
    console.error('❌ Gagal menghubungkan client:', error.message);
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return; // Return to menu, don't recurse
  }
}

// Mode 3: Tambah Akun
async function runAddAccount() {
  try {
    await addAccount();
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menambahkan akun:', error.message);
  }
  rl.question('\nTekan Enter untuk kembali ke menu utama...');
}

// Mode 4: Hapus Akun
function runDeleteAccount() {
  try {
    deleteAccount(rl);
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat menghapus akun:', error.message);
  }
  rl.question('\nTekan Enter untuk kembali ke menu utama...');
}

// Main function - iterative loop instead of recursion
async function main() {
  while (true) {
    printHeader();
    printMainMenu();

    const choiceInput = rl.question('Masukkan pilihan (1-5): ');
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
        await runAddAccount();
        // Continue to next iteration (menu restart)
        break;
      case '4':
        runDeleteAccount();
        // Continue to next iteration
        break;
      case '5':
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