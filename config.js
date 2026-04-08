require('dotenv').config();

const apiIdRaw = String(process.env.API_ID || '').trim();
if (!/^\d+$/.test(apiIdRaw)) {
  throw new Error('API_ID is not a valid integer. Please check your .env file.');
}
const apiId = Number(apiIdRaw);
if (apiId <= 0) {
  throw new Error('API_ID must be a positive number.');
}

const apiHash = process.env.API_HASH;
if (!apiHash || typeof apiHash !== 'string' || apiHash.trim() === '') {
  throw new Error('API_HASH is not set or invalid. Please check your .env file.');
}

const targetBotId = String(process.env.TARGET_BOT_ID || '825312679').trim();
if (!/^\d+$/.test(targetBotId)) {
  throw new Error('TARGET_BOT_ID must be a valid numeric Telegram bot ID.');
}

const minDelayRaw = Number(process.env.MIN_DELAY);
const maxDelayRaw = Number(process.env.MAX_DELAY);
// Validate that they are finite, non-negative numbers
if (!Number.isFinite(minDelayRaw) || minDelayRaw < 0) {
  throw new Error('MIN_DELAY must be a non-negative number. Please check your .env file.');
}
if (!Number.isFinite(maxDelayRaw) || maxDelayRaw < 0) {
  throw new Error('MAX_DELAY must be a non-negative number. Please check your .env file.');
}
const minDelay = Math.floor(minDelayRaw);
const maxDelay = Math.floor(maxDelayRaw);
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
