const express = require('express');
const path = require('path');
const crypto = require('crypto');
const WebSocket = require('ws');
const { loadAccounts, saveAccounts } = require('./utils/accountStore');
const { loadHistory, deleteChannelHistory } = require('./utils/scrapingHistory');
const { loadClient } = require('./utils/accountManager');
const { webScraper, parseChannelInput } = require('./handlers/deepLinkScraper');

// Encryption functions for session strings
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-this';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex');
}

const app = express();
const port = process.env.PORT || 3000;

// WebSocket server for real-time updates
const wssPort = port + 1;
const clients = new Set();
let wss;

try {
  wss = new WebSocket.Server({ port: wssPort });
  console.log(`WebSocket server started on port ${wssPort}`);

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('WebSocket client connected');

    ws.on('close', () => {
      clients.delete(ws);
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket client error:', error);
      clients.delete(ws);
    });
  });

  wss.on('error', (error) => {
    console.error('WebSocket server error:', error.message);
  });
} catch (error) {
  console.error('Failed to start WebSocket server:', error.message);
}

function broadcastProgress(data) {
  clients.forEach(client => {
    try {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      clients.delete(client);
    }
  });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;
  if (!expectedKey) {
    console.warn('API_KEY environment variable not set. API access is unprotected!');
    return next();
  }
  if (!apiKey || apiKey !== expectedKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API key' });
  }
  next();
}

app.get('/api/accounts', authenticate, (req, res) => {
  const data = loadAccounts();
  res.json({ success: true, accounts: data.accounts });
});

app.post('/api/accounts', authenticate, (req, res) => {
  let { id, phone, username, sessionString } = req.body;
  if (!id || !phone || !username || !sessionString) {
    return res.status(400).json({ success: false, message: 'id, phone, username, and sessionString are required' });
  }

  // Sanitize inputs
  id = String(id).trim();
  phone = String(phone).replace(/\D/g, ''); // Only digits
  username = String(username).trim().replace(/^@/, ''); // Remove @ if present
  sessionString = String(sessionString).trim();

  const data = loadAccounts();
  const existing = data.accounts.find(acc => acc.id === id || acc.phone === phone);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Akun sudah terdaftar' });
  }

  data.accounts.push({ id, phone, username, sessionString: encrypt(sessionString) });
  saveAccounts(data);
  return res.json({ success: true, accounts: data.accounts });
});

app.delete('/api/accounts/:id', authenticate, (req, res) => {
  const accountId = req.params.id;
  const data = loadAccounts();
  const filtered = data.accounts.filter(acc => acc.id !== accountId);
  if (filtered.length === data.accounts.length) {
    return res.status(404).json({ success: false, message: 'Akun tidak ditemukan' });
  }
  data.accounts = filtered;
  saveAccounts(data);
  return res.json({ success: true, accounts: data.accounts });
});

app.get('/api/history', authenticate, (req, res) => {
  const history = loadHistory();
  const channels = Object.entries(history.channels || {}).map(([key, value]) => ({
    channelKey: key,
    ...value
  }));
  res.json({ success: true, channels });
});

app.get('/api/channels', authenticate, (req, res) => {
  const history = loadHistory();
  const channels = Object.entries(history.channels || {}).map(([key, value]) => ({
    channelKey: key,
    channelName: value.channelName,
    lastScrapedId: value.lastScrapedId,
    lastScrapedAt: value.lastScrapedAt,
    totalScraped: value.totalScraped
  })).sort((a, b) => new Date(b.lastScrapedAt) - new Date(a.lastScrapedAt));
  res.json({ success: true, channels });
});

app.delete('/api/history/:channelKey', authenticate, (req, res) => {
  const channelKey = req.params.channelKey;
  const deleted = deleteChannelHistory(channelKey);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'History channel tidak ditemukan' });
  }
  const history = loadHistory();
  const channels = Object.entries(history.channels || {}).map(([key, value]) => ({
    channelKey: key,
    ...value
  }));
  res.json({ success: true, channels });
});

app.post('/api/scraping', authenticate, async (req, res) => {
  let { channel, startId, endId, account } = req.body;
  if (!channel || !account) {
    return res.status(400).json({ success: false, message: 'channel dan account diperlukan' });
  }

  // Sanitize inputs
  channel = parseChannelInput(channel);
  if (!channel) {
    return res.status(400).json({ success: false, message: 'channel tidak valid' });
  }
  if (startId !== undefined) startId = parseInt(startId, 10);
  if (endId !== undefined) endId = parseInt(endId, 10);

  try {
    // Load client for the specified account
    const client = await loadClient(account);
    if (!client) {
      return res.status(404).json({ success: false, message: 'Akun tidak ditemukan atau tidak bisa dimuat' });
    }

    // Start scraping in background with progress callback
    webScraper(client, channel, startId, endId, (progressData) => {
      broadcastProgress({
        ...progressData,
        channel,
        accountId: account.id
      });
    });

    res.json({ success: true, message: 'Scraping dimulai' });
  } catch (error) {
    console.error('Scraping error:', error);
    broadcastProgress({
      type: 'error',
      error: error.message,
      message: `Scraping error: ${error.message}`
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ping', authenticate, (req, res) => {
  res.json({ success: true, message: 'UserTeleNode web server is running' });
});

app.listen(port, () => {
  console.log(`🚀 UserTeleNode web server started at http://localhost:${port}`);
  console.log(`🔗 WebSocket server for progress updates at ws://localhost:${port + 1}`);
  console.log('📡 Open the browser to manage accounts and scraping history.');
});
