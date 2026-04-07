/**
 * Extract deep link dari URL Telegram
 * Format: https://t.me/{bot_username}?start={data}
 * 
 * @param {string} text - Text yang akan dicari deep link-nya
 * @returns {Array} - Array of {botUsername, startData}
 */
function extractDeepLinks(text) {
  if (!text || typeof text !== 'string') return [];

  const results = [];
  
  // Pattern untuk mencocokkan Telegram deep link
  // Mencakup: https://t.me/username?start=data, t.me/username?start=data
  // Use non-global regex to avoid lastIndex issues
  const pattern = /https?:\/\/(?:www\.)?t\.me\/([a-zA-Z0-9_]{5,})[?&]start=([a-zA-Z0-9_\-]+)/gi;
  
  let match;
  // Reset lastIndex before each use
  pattern.lastIndex = 0;
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      botUsername: match[1],
      startData: match[2],
      fullUrl: match[0]
    });
  }

  // Juga cek format tanpa http/https: t.me/username?start=data
  const patternShort = /(?:^|\s)t\.me\/([a-zA-Z0-9_]{5,})[?&]start=([a-zA-Z0-9_\-]+)/gi;
  // Reset lastIndex before each use
  patternShort.lastIndex = 0;
  while ((match = patternShort.exec(text)) !== null) {
    const botUsername = match[1];
    const startData = match[2];
    // Cek apakah sudah ada di results
    const exists = results.some(r => r.botUsername === botUsername && r.startData === startData);
    if (!exists) {
      results.push({
        botUsername,
        startData,
        fullUrl: `t.me/${botUsername}?start=${startData}`
      });
    }
  }

  return results;
}

/**
 * Generate pesan /start dari deep link
 * @param {string} botUsername 
 * @param {string} startData 
 * @returns {string} - Format pesan /start
 */
function generateStartMessage(botUsername, startData) {
  return `/start ${startData}`;
}

module.exports = {
  extractDeepLinks,
  generateStartMessage
};