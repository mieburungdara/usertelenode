require('dotenv').config();

const apiId = parseInt(process.env.API_ID, 10);
if (isNaN(apiId)) {
  throw new Error('API_ID is not a valid number. Please check your .env file.');
}
if (apiId <= 0) {
  throw new Error('API_ID must be a positive number.');
}

const apiHash = process.env.API_HASH;
if (!apiHash || typeof apiHash !== 'string' || apiHash.trim() === '') {
  throw new Error('API_HASH is not set or invalid. Please check your .env file.');
}

const targetBotId = String(process.env.TARGET_BOT_ID || '825312679');
if (!/^\d+$/.test(targetBotId)) {
  throw new Error('TARGET_BOT_ID must be a valid numeric Telegram bot ID.');
}

const minDelayRaw = parseInt(process.env.MIN_DELAY, 10);
const maxDelayRaw = parseInt(process.env.MAX_DELAY, 10);
// Use Number.isNaN to properly handle 0 as valid value
const minDelay = Number.isNaN(minDelayRaw) ? 3000 : minDelayRaw;
const maxDelay = Number.isNaN(maxDelayRaw) ? 10000 : maxDelayRaw;
if (minDelay < 0) {
  throw new Error('MIN_DELAY must be a non-negative number.');
}
if (maxDelay < 0) {
  throw new Error('MAX_DELAY must be a non-negative number.');
}
if (minDelay > maxDelay) {
  throw new Error('MIN_DELAY must be less than or equal to MAX_DELAY.');
}

module.exports = {
  API_ID: apiId,
  API_HASH: apiHash,
  TARGET_BOT_ID: targetBotId,
  TRIGGER_MESSAGE: String(process.env.TRIGGER_MESSAGE || 'Partner found 😺'),
  AUTO_REPLY_MESSAGE: String(process.env.AUTO_REPLY_MESSAGE || 'cowok'),
  ACCOUNTS_FILE: String(process.env.ACCOUNTS_FILE || './accounts.json'),
  REPORT_FILE: String(process.env.REPORT_FILE || './report.md'),
  MIN_DELAY: minDelay,
  MAX_DELAY: maxDelay
};
