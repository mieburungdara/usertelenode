const express = require('express');
const path = require('path');
const { loadAccounts, saveAccounts } = require('./utils/accountStore');
const { loadHistory, deleteChannelHistory } = require('./utils/scrapingHistory');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/accounts', (req, res) => {
  const data = loadAccounts();
  res.json({ success: true, accounts: data.accounts });
});

app.post('/api/accounts', (req, res) => {
  const { id, phone, username, sessionString } = req.body;
  if (!id || !phone || !username || !sessionString) {
    return res.status(400).json({ success: false, message: 'id, phone, username, and sessionString are required' });
  }

  const data = loadAccounts();
  const existing = data.accounts.find(acc => acc.id === id || acc.phone === phone);
  if (existing) {
    return res.status(409).json({ success: false, message: 'Akun sudah terdaftar' });
  }

  data.accounts.push({ id, phone, username, sessionString });
  saveAccounts(data);
  return res.json({ success: true, accounts: data.accounts });
});

app.delete('/api/accounts/:id', (req, res) => {
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

app.get('/api/history', (req, res) => {
  const history = loadHistory();
  const channels = Object.entries(history.channels || {}).map(([key, value]) => ({
    channelKey: key,
    ...value
  }));
  res.json({ success: true, channels });
});

app.delete('/api/history/:channelKey', (req, res) => {
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

app.get('/api/ping', (req, res) => {
  res.json({ success: true, message: 'UserTeleNode web server is running' });
});

app.listen(port, () => {
  console.log(`🚀 UserTeleNode web server started at http://localhost:${port}`);
  console.log('📡 Open the browser to manage accounts and scraping history.');
});
