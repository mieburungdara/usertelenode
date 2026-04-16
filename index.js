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
  console.log('  2. 🔗 Deep Link Scraper Mode (Scrape channel publik dan generate laporan)');
  console.log('  3. ➕ Tambah Akun Baru');
  console.log('  4. ❌ Hapus Akun');
  console.log('  5. 🚪 Keluar');
  console.log('');
}

// Safe exit handler - creates isolated handler per mode execution
function createSafeExitHandler(client, cleanupFn) {
  let isRunning = true;
  
  const handler = async () => {
    if (!isRunning) return;
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
async function runAutoReplyMode() {
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
    return;
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

    // Create dedicated safe exit handler for this session
    const safeExitHandler = createSafeExitHandler(client);
    process.on('SIGINT', safeExitHandler);
    process.on('SIGTERM', safeExitHandler);
    process.on('SIGBREAK', safeExitHandler);

    console.log('\nℹ️  Mode Deep Link Scraper akan menangani sinyal Ctrl+C secara internal.');
    console.log('   Jika ingin berhenti, tekan Ctrl+C saat proses scraping berjalan.');

    // Jalankan scraper
    await deepLinkScraper(client, rl);

    // Tutup koneksi jika scraper selesai normal tanpa exit paksa
    await disconnectWithTimeout(client, 5000);

    // Setelah selesai normal, kembali ke menu utama
    rl.question('\nTekan Enter untuk kembali ke menu utama...');

  } catch (error) {
    console.error('❌ Gagal menghubungkan client:', error.message);
    if (client) {
      await disconnectWithTimeout(client, 5000);
    }
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
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