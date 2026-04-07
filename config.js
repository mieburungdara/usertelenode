require('dotenv').config();

const apiId = parseInt(process.env.API_ID, 10);
if (isNaN(apiId)) {
  throw new Error('API_ID is not a valid number. Please check your .env file.');
}

module.exports = {
  API_ID: apiId,
  API_HASH: process.env.API_HASH,
  TARGET_BOT_ID: '825312679',
  TRIGGER_MESSAGE: 'Partner found 😺',
  AUTO_REPLY_MESSAGE: 'cowok',
  ACCOUNTS_FILE: './accounts.json',
  REPORT_FILE: './report.md',
  MIN_DELAY: 3000,  // 3 detik minimum
  MAX_DELAY: 10000  // 10 detik maximum
};