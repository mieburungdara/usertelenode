const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const config = require('../config');

const ACCOUNTS_FILE = path.resolve(__dirname, '..', config.ACCOUNTS_FILE);

/**
 * Load semua akun dari accounts.json
 */
function loadAccounts() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return { accounts: [] };
    }
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Gagal membaca accounts.json:', error.message);
    return { accounts: [] };
  }
}

/**
 * Simpan akun ke accounts.json
 */
function saveAccounts(data) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Gagal menyimpan accounts.json:', error.message);
  }
}

/**
 * Tampilkan daftar akun
 */
function listAccounts() {
  const data = loadAccounts();
  if (data.accounts.length === 0) {
    console.log('\n⚠️ Belum ada akun terdaftar.');
    return [];
  }

  console.log('\n📋 Daftar Akun:');
  console.log('─'.repeat(40));
  data.accounts.forEach((acc, index) => {
    console.log(`  ${index + 1}. @${acc.username || acc.phone}`);
    console.log(`     Phone: ${acc.phone}`);
    console.log(`     ID: ${acc.id || 'N/A'}`);
    console.log('');
  });
  
  return data.accounts;
}

/**
 * Pilih akun dari daftar
 */
function selectAccount(rl) {
  const data = loadAccounts();
  if (data.accounts.length === 0) {
    console.log('\n⚠️ Belum ada akun terdaftar. Silakan tambahkan akun terlebih dahulu.');
    return null;
  }

  listAccounts();
  console.log('─'.repeat(40));
  
  const input = rl.question('Pilih nomor akun (1-' + data.accounts.length + '): ');
  const index = parseInt(input, 10) - 1;
  if (isNaN(index)) {
    console.log('❌ Input tidak valid. Masukkan angka.');
    return null;
  }
  
  if (index < 0 || index >= data.accounts.length) {
    console.log('❌ Nomor akun tidak valid.');
    return null;
  }
  
  return data.accounts[index];
}

/**
 * Hapus akun
 */
function deleteAccount(rl) {
  const data = loadAccounts();
  if (data.accounts.length === 0) {
    console.log('\n⚠️ Belum ada akun untuk dihapus.');
    return false;
  }

  listAccounts();
  console.log('─'.repeat(40));
  
  const input = rl.question('Pilih nomor akun yang ingin dihapus (atau 0 untuk batal): ');
  const index = parseInt(input, 10) - 1;
  if (isNaN(index)) {
    console.log('❌ Input tidak valid. Masukkan angka.');
    return false;
  }
  
  if (index === -1) {
    console.log('❌ Penghapusan dibatalkan.');
    return false;
  }
  
  if (index < 0 || index >= data.accounts.length) {
    console.log('❌ Nomor akun tidak valid.');
    return false;
  }

  const acc = data.accounts[index];
  const confirm = rl.question(`⚠️ Hapus akun @${acc.username || acc.phone}? (y/n): `);
  
  if (confirm.toLowerCase() === 'y') {
    data.accounts.splice(index, 1);
    saveAccounts(data);
    console.log('✅ Akun berhasil dihapus.');
    return true;
  }
  
  console.log('❌ Penghapusan dibatalkan.');
  return false;
}

/**
 * Tambah akun baru dengan login (OTP + 2FA support)
 */
async function addAccount() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  // Fungsi helper untuk menunggu input
  const question = (query) => new Promise((resolve) => readline.question(query, resolve));

  console.log('\n➕ Tambah Akun Baru');
  console.log('─'.repeat(40));

  const phoneNumber = await question('Masukkan nomor telepon (contoh: 6281234567890): ');

  // Buat client dengan StringSession kosong
  const sessionString = new StringSession('');
  const client = new TelegramClient(sessionString, config.API_ID, config.API_HASH, {
    connectionRetries: 5,
    deviceModel: 'UserTeleNode',
  });

  try {
    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => {
        const pwd = await question('🔐 Masukkan password 2FA (Cloud Password): ');
        return pwd;
      },
      phoneCode: async () => {
        const code = await question('Masukkan kode OTP yang diterima di Telegram: ');
        return code;
      },
      onError: (err) => {
        // Throw error agar bisa di-catch oleh try-catch
        throw err;
      }
    });

    // Dapatkan info user
    const me = await client.getMe();
    const userId = me.id;
    const username = me.username || '';
    
    // Dapatkan string session
    const sessionStr = client.session.save();

    // Simpan ke accounts.json
    const data = loadAccounts();
    const newAccount = {
      id: userId,
      phone: phoneNumber,
      username: username,
      sessionString: sessionStr
    };

    data.accounts.push(newAccount);
    saveAccounts(data);

    console.log('\n✅ Login berhasil!');
    console.log(`   Username: @${username}`);
    console.log(`   User ID: ${userId}`);
    console.log('   Session telah disimpan.');

    await client.disconnect();
  } catch (error) {
    console.error('\n❌ Login gagal:', error.message);
    if (error.message.includes('PHONE_NUMBER_INVALID')) {
      console.log('   Periksa format nomor telepon Anda.');
    } else if (error.message.includes('PHONE_CODE_INVALID')) {
      console.log('   Kode OTP yang Anda masukkan salah.');
    } else if (error.message.includes('PASSWORD_HASH_INVALID')) {
      console.log('   Password 2FA yang Anda masukkan salah.');
    }
  } finally {
    readline.close();
  }
}

/**
 * Load client dari akun yang sudah tersimpan
 */
async function loadClient(account) {
  const session = new StringSession(account.sessionString);
  
  const client = new TelegramClient(session, config.API_ID, config.API_HASH, {
    connectionRetries: 5,
    deviceModel: 'UserTeleNode',
    autoReconnect: true,
    retryDelay: 3000,
  });

  await client.connect();
  
  // Cek apakah session masih valid
  const isConnected = client.connected;
  if (!isConnected) {
    throw new Error('Session tidak valid atau sudah kadaluarsa.');
  }

  return client;
}

module.exports = {
  loadAccounts,
  saveAccounts,
  listAccounts,
  selectAccount,
  deleteAccount,
  addAccount,
  loadClient
};