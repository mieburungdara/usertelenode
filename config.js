require('dotenv').config();

module.exports = {
  API_ID: parseInt(process.env.API_ID),
  API_HASH: process.env.API_HASH,
  TARGET_BOT_ID: '825312679',
  TRIGGER_MESSAGE: 'Partner found 😺',
  AUTO_REPLY_MESSAGE: 'cowok',
  ACCOUNTS_FILE: './accounts.json',
  REPORT_FILE: './report.md',
  MIN_DELAY: 3000,  // 3 detik minimum
  MAX_DELAY: 10000  // 10 detik maximum
};