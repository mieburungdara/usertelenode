const accountsList = document.getElementById('accountsList');
const historyList = document.getElementById('historyList');
const refreshAccounts = document.getElementById('refreshAccounts');
const refreshHistory = document.getElementById('refreshHistory');
const addAccountForm = document.getElementById('addAccountForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingMessage = document.getElementById('loadingMessage');

const controls = [refreshAccounts, refreshHistory, addAccountForm];

/**
 *
 * @param url
 * @param options
 */
async function fetchJson (url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Request failed');
  }
  return response.json();
}

/**
 *
 * @param accounts
 */
function renderAccounts (accounts) {
  accountsList.innerHTML = '';
  if (!accounts.length) {
    accountsList.innerHTML = '<div class="item">Belum ada akun terdaftar.</div>';
    return;
  }

  accounts.forEach((account) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <strong>@${account.username || account.phone}</strong>
      <div>Phone: ${account.phone}</div>
      <div>ID: ${account.id}</div>
      <button class="button danger" data-id="${account.id}">Hapus</button>
    `;
    const btn = item.querySelector('button');
    btn.addEventListener('click', () => deleteAccount(account.id));
    accountsList.appendChild(item);
  });
}

/**
 *
 * @param channels
 */
function renderHistory (channels) {
  historyList.innerHTML = '';
  if (!channels.length) {
    historyList.innerHTML = '<div class="item">Belum ada history scraping.</div>';
    return;
  }

  channels.forEach((channel) => {
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <strong>${channel.channelName}</strong>
      <div>Last Scraped ID: ${channel.lastScrapedId}</div>
      <div>Total Scraped: ${channel.totalScraped}</div>
      <div>Last Scraped At: ${new Date(channel.lastScrapedAt).toLocaleString('id-ID')}</div>
      <div>Links Found: ${channel.scrapingSessions?.reduce((sum, session) => sum + (session.linksFound || 0), 0)}</div>
      <div>Status: ${channel.scrapingSessions?.length ? (channel.scrapingSessions[channel.scrapingSessions.length - 1].stopped ? 'Stopped' : 'Completed') : 'N/A'}</div>
      <button class="button danger delete-history" data-channel-key="${encodeURIComponent(channel.channelKey)}">Hapus History</button>
    `;
    const deleteButton = item.querySelector('.delete-history');
    deleteButton.addEventListener('click', () => deleteHistory(channel.channelKey));
    historyList.appendChild(item);
  });
}

/**
 *
 * @param isLoading
 * @param message
 */
function setLoading (isLoading, message = 'Loading...') {
  loadingMessage.textContent = message;
  if (isLoading) {
    loadingOverlay.classList.remove('hidden');
  } else {
    loadingOverlay.classList.add('hidden');
  }

  controls.forEach((control) => {
    if (control instanceof HTMLFormElement) {
      Array.from(control.elements).forEach((el) => {
        el.disabled = isLoading;
      });
    } else {
      control.disabled = isLoading;
    }
  });

  document.querySelectorAll('.item button').forEach((button) => {
    button.disabled = isLoading;
  });
}

/**
 *
 */
async function loadAccounts () {
  setLoading(true, 'Muat akun...');
  try {
    const result = await fetchJson('/api/accounts');
    renderAccounts(result.accounts);
  } catch (error) {
    accountsList.innerHTML = `<div class="item">Error: ${error.message}</div>`;
  } finally {
    setLoading(false);
  }
}

/**
 *
 */
async function loadHistory () {
  setLoading(true, 'Muat history...');
  try {
    const result = await fetchJson('/api/history');
    renderHistory(result.channels);
  } catch (error) {
    historyList.innerHTML = `<div class="item">Error: ${error.message}</div>`;
  } finally {
    setLoading(false);
  }
}

/**
 *
 * @param accountId
 */
async function deleteAccount (accountId) {
  try {
    await fetchJson(`/api/accounts/${encodeURIComponent(accountId)}`, { /**
     *
     */
      method: 'DELETE',
    });
    loadAccounts();
  } catch (error) {
    alert(error.message);
  }
}

/**
 *
 * @param channelKey
 */
async function deleteHistory (channelKey) {
  if (!confirm('Yakin ingin menghapus history channel ini?')) {
    return;
  }
  setLoading(true, 'Menghapus history...');
  try {
    const result = await fetchJson(`/api/history/${encodeURIComponent(channelKey)}`, { /**
     *
     */
      method: 'DELETE',
    });
    renderHistory(result.channels);
  } catch (error) {
    alert(error.message);
  } finally {
    setLoading(false);
  }
}

addAccountForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(addAccountForm);
  const payload = Object.fromEntries(formData.entries());

  try {
    await fetchJson('/api/accounts', {
      /**
       *
       */
      method: 'POST',
      /**
       *
       */
      headers: { /**
       *
       */
        'Content-Type': 'application/json',
      },
      /**
       *
       */
      body: JSON.stringify(payload),
    });
    addAccountForm.reset();
    loadAccounts();
  } catch (error) {
    alert(error.message);
  }
});

refreshAccounts.addEventListener('click', loadAccounts);
refreshHistory.addEventListener('click', loadHistory);

loadAccounts();
loadHistory();
