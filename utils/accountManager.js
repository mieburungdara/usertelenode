const fs = require('fs');
const path = require('path');
const readlineSync = require('readline-sync');
const { TelegramClient } = require('telegram');
const { StringSession } = require('telegram/sessions');
const config = require('../config');

const ACCOUNTS_FILE = path.resolve(__dirname, '..', config.ACCOUNTS_FILE);

// Default readline-sync interface for backward compatibility
const defaultRL = {
  question: (query) => readlineSync.question(query),
  close: () => {}
};

// Normalize phone number by removing all non-digit characters
function normalizePhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

/**
 * Load semua akun dari accounts.json
 */
function loadAccounts() {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return { accounts: [] };
    }
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Validate structure
    if (!parsed || !Array.isArray(parsed.accounts)) {
      console.error('❌ accounts.json memiliki format yang tidak valid.');
      return { accounts: [] };
    }
    return parsed;
  } catch (error) {
    console.error('❌ Gagal membaca accounts.json:', error.message);
    return { accounts: [] };
  }
}

/**
 * Simpan akun ke accounts.json
 * @returns {boolean} true if save was successful
 */
function saveAccounts(data) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Gagal menyimpan accounts.json:', error.message);
    return false;
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
  
  // Return a copy to prevent external mutation
  return [...data.accounts];
}

/**
 * Pilih akun dari daftar
 */
function selectAccount(rl = defaultRL) {
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
function deleteAccount(rl = defaultRL) {
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
    if (!saveAccounts(data)) {
      console.log('❌ Gagal menyimpan perubahan.');
      return false;
    }
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

  // Validate phone number
  if (!phoneNumber || !phoneNumber.trim()) {
    console.error('\n❌ Nomor telepon tidak boleh kosong.');
    readline.close();
    return;
  }
  const normalizedPhone = normalizePhone(phoneNumber);
  if (!/^\d+$/.test(normalizedPhone)) {
    console.error('\n❌ Nomor telepon tidak valid. Hanya gunakan angka.');
    readline.close();
    return;
  }
  if (normalizedPhone.length < 5) {
    console.error('\n❌ Nomor telepon terlalu pendek.');
    readline.close();
    return;
  }

  let client = null;
  try {
    // Buat client dengan StringSession kosong
    const sessionString = new StringSession('');
    client = new TelegramClient(sessionString, config.API_ID, config.API_HASH, {
      connectionRetries: 5,
      deviceModel: 'UserTeleNode',
    });

    await client.start({
      phoneNumber: async () => phoneNumber,
      password: async () => {
        const pwd = await question('🔐 Masukkan password 2FA (Cloud Password): ');
        return pwd;
      },
      phoneCode: async () => {
        const code = await question('Masukkan kode OTP yang diterima di Telegram: ');
        return code;
      }
    });

    // Dapatkan info user
    const me = await client.getMe();
    // Convert BigInt id to string for JSON serialization
    const userId = typeof me.id === 'bigint' ? me.id.toString() : String(me.id);
    const username = me.username || '';
    
    // Dapatkan string session
    const sessionStr = client.session.save();

    // Cek duplikat dengan normalisasi nomor telepon
    const data = loadAccounts();
    const existingIndex = data.accounts.findIndex(
      acc => normalizePhone(acc.phone) === normalizedPhone || acc.id === userId
    );
    if (existingIndex !== -1) {
      console.log('\n⚠️ Akun dengan nomor atau ID ini sudah terdaftar.');
      return;
    }

    // Simpan ke accounts.json
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
    // Ensure client is always safely disconnected
    if (client) {
      try {
        await client.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
    readline.close();
  }
}

/**
 * Load client dari akun yang sudah tersimpan
 */
async function loadClient(account) {
  if (!account || !account.sessionString) {
    throw new Error('Akun tidak valid atau session string kosong.');
  }
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