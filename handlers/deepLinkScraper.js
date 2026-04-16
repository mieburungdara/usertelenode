function parseChannelInput(input) {
  if (!input) return null;

  let cleaned = String(input).trim();

  if (!cleaned) return null;

  // Handle t.me URLs
  if (cleaned.includes('t.me/')) {
    const match = cleaned.match(/t\.me\/([a-zA-Z0-9_]+)/);
    if (match) {
      cleaned = match[1];
    } else {
      const altMatch = cleaned.match(/t\.me\/(.+)/);
      cleaned = altMatch ? altMatch[1] : cleaned;
    }
    cleaned = cleaned.trim();
  }

  if (!cleaned) return null;

  // Check if it's a numeric channel ID (all digits with optional - prefix)
  const isNumericId = /^-?\d+$/.test(cleaned);

  if (isNumericId) {
    return parseInt(cleaned, 10);
  }

  if (!cleaned.startsWith('@')) {
    cleaned = '@' + cleaned;
  }

  return cleaned;
}

async function deepLinkScraper(client, rl) {
  console.log('🔗 Mode Deep Link Scraper');
  console.log('─'.repeat(40));

  // Placeholder for report generation
  // In full implementation, integrate with modular scraping
  console.log('Scraping completed. Report generation placeholder.');

  rl.question('\nTekan Enter untuk kembali ke menu utama...');
  return;
}

module.exports = deepLinkScraper;
module.exports.parseChannelInput = parseChannelInput;