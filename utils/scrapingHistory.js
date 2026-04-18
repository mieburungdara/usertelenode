const fs = require('fs');
const path = require('path');

const HISTORY_FILE = path.resolve(__dirname, '..', 'scraping_history.json');

/**
 * Load scraping history dari file
 */
function loadHistory () {
  try {
    if (!fs.existsSync(HISTORY_FILE)) {
      return { /**
       *
       */
        channels: {},
      };
    }
    const data = fs.readFileSync(HISTORY_FILE, 'utf-8');
    const history = JSON.parse(data);

    // Migrate existing channels to include new fields if missing
    for (const key in history.channels) {
      const ch = history.channels[key];
      if (ch.lastMessageId === undefined) { ch.lastMessageId = null; }
      if (ch.lastMessageTimestamp === undefined) { ch.lastMessageTimestamp = null; }
    }

    return history;
  } catch (error) {
    console.error('❌ Gagal membaca history:', error.message);
    return { /**
     *
     */
      channels: {},
    };
  }
}

/**
 * Simpan history ke file
 * @param data
 */
function saveHistory (data) {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Gagal menyimpan history:', error.message);
    return false;
  }
}

/**
 * Hapus history untuk channel tertentu
 * @param channel
 */
function deleteChannelHistory (channel) {
  const history = loadHistory();
  const key = getChannelKey(channel);
  if (!history.channels[key]) {
    return false;
  }
  delete history.channels[key];
  return saveHistory(history);
}

/**
 * Get normalized channel key untuk storage
 * @param channel
 */
function getChannelKey (channel) {
  if (typeof channel === 'string') {
    return channel.replace('@', '');
  } else if (typeof channel === 'number') {
    return channel.toString();
  }
  return String(channel);
}

/**
 * Get ID terakhir yang di-scrape untuk channel tertentu
 * @param channel
 */
function getLastScrapedId (channel) {
  const history = loadHistory();
  const key = getChannelKey(channel);
  const channelData = history.channels[key];
  return channelData ? channelData.lastScrapedId : null;
}

/**
 * Get history lengkap untuk channel tertentu
 * @param channel
 */
function getChannelHistory (channel) {
  const history = loadHistory();
  const key = getChannelKey(channel);
  return history.channels[key] || null;
}

/**
 * Get semua channel yang pernah discrape
 */
function getAllChannels () {
  const history = loadHistory();
  return Object.values(history.channels);
}

/**
 * Update lastScrapedId saja secara realtime (untuk update setiap pesan)
 * @param channel
 * @param messageId
 */
function updateLastScrapedId (channel, messageId) {
  const history = loadHistory();
  const key = getChannelKey(channel);

  // ✅ FIX BUG: Jika channel belum ada di history, buat entry baru terlebih dahulu
  if (!history.channels[key]) {
    history.channels[key] = {
      /**
       *
       */
      channelName: String(channel),
      /**
       *
       */
      lastScrapedId: messageId,
      /**
       *
       */
      lastScrapedAt: new Date().toISOString(),
      /**
       *
       */
      lastMessageId: null,
      /**
       *
       */
      lastMessageTimestamp: null,
      /**
       *
       */
      totalScraped: 0,
      /**
       *
       */
      scrapingSessions: [],
    };
  } else {
    history.channels[key].lastScrapedId = messageId;
    history.channels[key].lastScrapedAt = new Date().toISOString();
  }

  return saveHistory(history);
}

/**
 * Update lastMessageId dan timestamp untuk cache
 * @param channel
 * @param messageId
 * @param timestamp
 */
function updateLastMessageId (channel, messageId, timestamp) {
  const history = loadHistory();
  const key = getChannelKey(channel);

  if (!history.channels[key]) {
    history.channels[key] = {
      /**
       *
       */
      channelName: String(channel),
      /**
       *
       */
      lastScrapedId: null,
      /**
       *
       */
      lastScrapedAt: null,
      /**
       *
       */
      lastMessageId: messageId,
      /**
       *
       */
      lastMessageTimestamp: timestamp,
      /**
       *
       */
      totalScraped: 0,
      /**
       *
       */
      scrapingSessions: [],
    };
  } else {
    history.channels[key].lastMessageId = messageId;
    history.channels[key].lastMessageTimestamp = timestamp;
  }

  return saveHistory(history);
}

/**
 * Update history setelah scraping selesai
 * @param channel
 * @param startId
 * @param endId
 * @param linksFound
 * @param stopped
 */
function updateHistory (channel, startId, endId, linksFound, stopped = false) {
  const history = loadHistory();
  const key = getChannelKey(channel);
  const now = new Date().toISOString();

  if (!history.channels[key]) {
    history.channels[key] = {
      /**
       *
       */
      channelName: String(channel),
      /**
       *
       */
      lastScrapedId: endId,
      /**
       *
       */
      lastScrapedAt: now,
      /**
       *
       */
      lastMessageId: null,
      /**
       *
       */
      lastMessageTimestamp: null,
      /**
       *
       */
      totalScraped: (endId - startId + 1),
      /**
       *
       */
      scrapingSessions: [],
    };
  } else {
    history.channels[key].lastScrapedId = endId;
    history.channels[key].lastScrapedAt = now;
    history.channels[key].totalScraped += (endId - startId + 1);
  }

  history.channels[key].scrapingSessions.push({
    /**
     *
     */
    startId,
    /**
     *
     */
    endId,
    /**
     *
     */
    scrapedAt: now,
    /**
     *
     */
    linksFound,
    /**
     *
     */
    stopped,
  });

  return saveHistory(history);
}

module.exports = {
  /**
   *
   */
  loadHistory,
  /**
   *
   */
  saveHistory,
  /**
   *
   */
  getLastScrapedId,
  /**
   *
   */
  getChannelHistory,
  /**
   *
   */
  getAllChannels,
  /**
   *
   */
  updateLastScrapedId,
  /**
   *
   */
  updateLastMessageId,
  /**
   *
   */
  updateHistory,
  /**
   *
   */
  deleteChannelHistory,
};
