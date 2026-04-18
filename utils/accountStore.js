const fs = require('fs');
const path = require('path');

const ACCOUNTS_FILE = path.resolve(__dirname, '..', 'accounts.json');

/**
 *
 */
function loadAccounts () {
  try {
    if (!fs.existsSync(ACCOUNTS_FILE)) {
      return { /**
       *
       */
        accounts: [],
      };
    }
    const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed || !Array.isArray(parsed.accounts)) {
      return { /**
       *
       */
        accounts: [],
      };
    }
    return parsed;
  } catch (error) {
    console.error('❌ Gagal membaca accounts.json:', error.message);
    return { /**
     *
     */
      accounts: [],
    };
  }
}

/**
 *
 * @param data
 */
function saveAccounts (data) {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Gagal menyimpan accounts.json:', error.message);
    return false;
  }
}

module.exports = {
  /**
   *
   */
  loadAccounts,
  /**
   *
   */
  saveAccounts,
};
