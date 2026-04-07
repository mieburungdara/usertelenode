# UserTeleNode - Telegram User Bot

Telegram User Bot berbasis Node.js dengan fitur **Auto Reply** dan **Deep Link Scraper** menggunakan library GramJS.

## ✨ Fitur

- **Multi Account Management** - Kelola beberapa akun Telegram dengan String Session
- **Auto Reply Mode** - Auto reply pesan dari bot tertentu
- **Deep Link Scraper Mode** - Scraping deep link dari channel publik
- **2FA Support** - Login dengan Cloud Password
- **Safe Exit** - Ctrl+C menghasilkan report sebelum berhenti
- **Human-like Delay** - Delay random 3-10 detik untuk hindari rate limit

## 📋 Prerequisites

- Node.js versi 16 atau lebih baru
- Akun Telegram aktif
- API ID dan API Hash dari Telegram

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/mieburungdara/usertelenode.git
cd usertelenode
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Dapatkan API Credentials

1. Kunjungi [https://my.telegram.org/auth](https://my.telegram.org/auth)
2. Login dengan nomor Telegram Anda
3. Masuk ke **API development tools**
4. Buat aplikasi baru
5. Catat **API ID** dan **API Hash**

### 4. Konfigurasi

Edit file `.env`:

```env
API_ID=your_api_id_here
API_HASH=your_api_hash_here
```

## 📖 Cara Menggunakan

### Jalankan Bot

```bash
npm start
```

### Menu Utama

```
╔══════════════════════════════════════════╗
║     🤖 UserTeleNode - User Bot Telegram  ║
║     Dibuat dengan Node.js + GramJS       ║
╚══════════════════════════════════════════╝

📋 Menu Utama:
────────────────────────────────────────
  1. 🤖 Auto Reply Mode
  2. 🔗 Deep Link Scraper Mode
  3. ➕ Tambah Akun Baru
  4. ❌ Hapus Akun
  5. 🚪 Keluar

Masukkan pilihan (1-5):
```

### 1. Tambah Akun Baru

Pilih menu **3** → Masukkan nomor telepon → Masukkan kode OTP → (Jika ada) Masukkan password 2FA

```
➕ Tambah Akun Baru
────────────────────────────────────────
Masukkan nomor telepon (contoh: 6281234567890): 6281234567890

📱 Mengirim kode OTP...

Masukkan kode OTP yang diterima di Telegram: 12345

🔐 Masukkan password 2FA (Cloud Password): ********

✅ Login berhasil!
   Username: @username
   User ID: 123456789
   Session telah disimpan.
```

### 2. Auto Reply Mode

Bot akan mendengarkan pesan masuk dari bot tertentu dan membalas otomatis.

**Konfigurasi default:**
- Target Bot ID: `825312679`
- Trigger Message: `Partner found 😺`
- Auto Reply: `cowok`

Untuk mengubah konfigurasi, edit file `config.js`.

### 3. Deep Link Scraper Mode

Scrape pesan dari channel publik berdasarkan range ID pesan.

**Cara kerja:**
1. Input channel publik (contoh: `@contohchannel` atau `https://t.me/contohchannel`)
2. Input range ID pesan (contoh: dari ID 123 sampai ID 321)
3. Bot akan scrape pesan satu per satu dengan delay random 3-10 detik
4. Jika ditemukan deep link, bot akan mengirim `/start {data}` ke bot target
5. Cek response bot: jika ada media → lanjut, jika tidak → **bot stop**
6. Report otomatis disimpan ke `report.md`

**Safe Exit:** Tekan `Ctrl+C` kapan saja untuk berhenti dan generate report.

## 📊 Report Format

Report disimpan otomatis ke `report.md`:

```markdown
# Laporan Deep Link Scraping

- **Channel:** @contohchannel
- **Range Pesan:** ID 123 - ID 321
- **Tanggal:** 08/04/2026, 05:00:00

## Statistik
| Metrik | Jumlah |
|--------|--------|
| Total Pesan Discrape | 50 |
| Total Link Ditemukan | 3 |
| Total Media (Foto/Video) | 10 |

## Detail Link
1. Link
   - URL: https://t.me/bot?start=abc123
   - Bot: @bot
   - Response: ✅ Ada Media
```

## 📁 Struktur File

```
usertelenode/
├── .env                    # API credentials
├── accounts.json           # Database akun (string session)
├── config.js               # Konfigurasi bot
├── index.js                # Main entry point
├── package.json            # Dependencies
├── report.md               # Generated report (auto-created)
├── utils/
│   ├── accountManager.js   # Multi-akun management
│   └── linkParser.js       # Telegram deep link parser
├── handlers/
│   ├── autoReply.js        # Auto reply handler
│   └── deepLinkScraper.js  # Scraping + report generator
└── README.md               # Dokumentasi
```

## ⚠️ Catatan Penting

1. **Gunakan dengan bijak** - Jangan spam atau abuse. Telegram bisa membatasi akun Anda.
2. **Akun Anda sendiri yang digunakan** - User bot menggunakan akun Telegram pribadi Anda, bukan bot account.
3. **Channel publik** - Deep Link Scraper hanya bisa mengakses channel publik yang sudah Anda join.
4. **Rate Limit** - Bot menggunakan delay 3-10 detik untuk menghindari rate limit.
5. **Jangan jalankan bersamaan** - Auto Reply dan Deep Link Scraper **tidak boleh** berjalan bersamaan.

## 🔧 Troubleshooting

### Session tidak valid
Hapus akun dari `accounts.json` dan tambahkan ulang.

### FLOOD_WAIT error
Bot akan otomatis menunggu sesuai waktu yang diminta Telegram.

### Channel tidak ditemukan
Pastikan channel bersifat publik dan Anda sudah join channel tersebut.

## 📜 Lisensi

ISC License

## 🤝 Kontribusi

Silakan buat issue atau pull request di [GitHub Repository](https://github.com/mieburungdara/usertelenode).