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
        await _currentClient.disconnect();
      }
    } catch (e) {
      // Ignore disconnect errors
    }
    
    console.log('✅ Bot berhenti dengan aman.');
    process.exit(0);
  };
  
  process.once('SIGINT', sigHandler);
  process.once('SIGTERM', sigHandler);
}

// Mode 1: Auto Reply
async function runAutoReplyMode() {
  const account = selectAccount(rl);
  if (!account) {
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
  }
  
  console.log('\n🔄 Menghubungkan dengan akun @' + (account.username || account.phone) + '...');
  
  try {
    const client = await loadClient(account);
    const me = await client.getMe();
    console.log('✅ Terhubung sebagai @' + (me.username || me.firstName));
    
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
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return main();
  }
}

// Mode 2: Deep Link Scraper
async function runDeepLinkScraper() {
  const account = selectAccount(rl);
  if (!account) {
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return;
  }
  
  console.log('\n🔄 Menghubungkan dengan akun @' + (account.username || account.phone) + '...');
  
  try {
    const client = await loadClient(account);
    const me = await client.getMe();
    console.log('✅ Terhubung sebagai @' + (me.username || me.firstName));
    
    // Jalankan scraper dengan readline-sync interface wrapper
    await deepLinkScraper(client, rl);
    
  } catch (error) {
    console.error('❌ Gagal menghubungkan client:', error.message);
    rl.question('\nTekan Enter untuk kembali ke menu utama...');
    return main();
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

// Main function
async function main() {
  printHeader();
  printMainMenu();
  
  const choiceInput = rl.question('Masukkan pilihan (1-5): ');
  if (!choiceInput || !choiceInput.trim()) {
    console.log('\n❌ Input kosong atau hanya spasi.');
    return main();
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
      // Restart menu setelah tambah akun
      return main();
    case '4':
      runDeleteAccount();
      return main();
    case '5':
      console.log('\n👋 Terima kasih telah menggunakan UserTeleNode!');
      process.exit(0);
      return;
    default:
      console.log('\n❌ Pilihan tidak valid.');
      rl.question('\nTekan Enter untuk mencoba lagi...');
      return main();
  }
}

// Jalankan main
main().catch(console.error);