const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

const prisma = new PrismaClient({ 
  adapter: new PrismaBetterSqlite3({ url: 'file:C:/Users/Administrator/Documents/GitHub/usertelenode/prisma/dev.db' }) 
});

const DATA_DIR = path.resolve(__dirname, '../data');

async function migrate() {
  console.log('🚀 Starting Data Migration: JSON ➡️ SQLite');

  try {
    // 1. Migrate Accounts
    const accountsPath = path.join(DATA_DIR, 'accounts.json');
    if (fs.existsSync(accountsPath)) {
      console.log('📦 Migrating Accounts...');
      const accounts = JSON.parse(fs.readFileSync(accountsPath, 'utf-8'));
      for (const acc of accounts) {
        await prisma.account.upsert({
          where: { phoneNumber: acc.phoneNumber },
          update: {
            username: acc.username,
            telegramId: acc.id ? String(acc.id) : null,
            sessionString: acc.sessionString,
          },
          create: {
            phoneNumber: acc.phoneNumber,
            username: acc.username,
            telegramId: acc.id ? String(acc.id) : null,
            sessionString: acc.sessionString,
          },
        });
      }
      console.log(`✅ Migrated ${accounts.length} accounts.`);
    }

    // 2. Migrate Scraping History
    const historyPath = path.join(DATA_DIR, 'scraping_history.json');
    if (fs.existsSync(historyPath)) {
      console.log('📦 Migrating Scraping History...');
      const history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      const channels = history.channels || {};
      
      for (const key of Object.keys(channels)) {
        const ch = channels[key];
        const channel = await prisma.channel.upsert({
          where: { channelName: String(ch.channelName) },
          update: {
            channelTitle: ch.channelTitle,
            lastScrapedId: ch.lastScrapedId,
            lastScrapedAt: ch.lastScrapedAt ? new Date(ch.lastScrapedAt) : null,
            lastMessageId: ch.lastMessageId,
            lastMessageTimestamp: ch.lastMessageTimestamp ? new Date(ch.lastMessageTimestamp) : null,
            lastCheckedAt: ch.lastCheckedAt ? new Date(ch.lastCheckedAt) : null,
            totalLinksFound: ch.totalLinksFound || 0,
            totalMessagesScraped: ch.totalMessagesScraped || 0,
          },
          create: {
            channelName: String(ch.channelName),
            channelTitle: ch.channelTitle,
            lastScrapedId: ch.lastScrapedId,
            lastScrapedAt: ch.lastScrapedAt ? new Date(ch.lastScrapedAt) : null,
            lastMessageId: ch.lastMessageId,
            lastMessageTimestamp: ch.lastMessageTimestamp ? new Date(ch.lastMessageTimestamp) : null,
            lastCheckedAt: ch.lastCheckedAt ? new Date(ch.lastCheckedAt) : null,
            totalLinksFound: ch.totalLinksFound || 0,
            totalMessagesScraped: ch.totalMessagesScraped || 0,
          },
        });

        // Migrate Sessions
        if (Array.isArray(ch.scrapingSessions)) {
          for (const sess of ch.scrapingSessions) {
            await prisma.scrapingSession.create({
              data: {
                date: sess.date ? new Date(sess.date) : (sess.scrapedAt ? new Date(sess.scrapedAt) : new Date()),
                startId: sess.startId || 0,
                endId: sess.endId || 0,
                processed: sess.processed || 0,
                linksFound: sess.linksFound || 0,
                noLinks: sess.noLinks || 0,
                deleted: sess.deleted || 0,
                interactions: sess.interactions || 0,
                error: sess.error,
                channelId: channel.id,
              },
            });
          }
        }
      }
      console.log(`✅ Migrated ${Object.keys(channels).length} channels and their sessions.`);
    }

    // 3. Migrate Sync Pairs
    const syncHistoryPath = path.join(DATA_DIR, 'channel_sync_history.json');
    if (fs.existsSync(syncHistoryPath)) {
      console.log('📦 Migrating Chat Sync History...');
      const syncHistory = JSON.parse(fs.readFileSync(syncHistoryPath, 'utf-8'));
      const pairs = syncHistory.syncPairs || {};

      for (const key of Object.keys(pairs)) {
        const p = pairs[key];
        const syncPair = await prisma.syncPair.upsert({
          where: {
            sourceChannel_targetChannel: {
              sourceChannel: String(p.sourceChannel),
              targetChannel: String(p.targetChannel),
            }
          },
          update: {
            sourceTitle: p.sourceTitle,
            targetTitle: p.targetTitle,
            lastSyncedAt: p.lastSyncedAt ? new Date(p.lastSyncedAt) : null,
            totalMessagesSynced: p.totalMessagesSynced || 0,
            totalSyncSessions: p.totalSyncSessions || 0,
            status: p.status || 'inactive',
          },
          create: {
            sourceChannel: String(p.sourceChannel),
            targetChannel: String(p.targetChannel),
            sourceTitle: p.sourceTitle,
            targetTitle: p.targetTitle,
            lastSyncedAt: p.lastSyncedAt ? new Date(p.lastSyncedAt) : null,
            totalMessagesSynced: p.totalMessagesSynced || 0,
            totalSyncSessions: p.totalSyncSessions || 0,
            status: p.status || 'inactive',
          },
        });

        // Migrate Sync Sessions
        if (Array.isArray(p.syncSessions)) {
          for (const sess of p.syncSessions) {
            await prisma.syncSession.create({
              data: {
                syncedAt: sess.syncedAt ? new Date(sess.syncedAt) : new Date(),
                messagesProcessed: sess.messagesProcessed || 0,
                messagesSynced: sess.messagesSynced || 0,
                duration: sess.duration ? parseInt(sess.duration) : null,
                errors: sess.errors ? String(sess.errors) : null,
                pairId: syncPair.id,
              },
            });
          }
        }
      }
      console.log(`✅ Migrated ${Object.keys(pairs).length} sync pairs.`);
    }

    // 4. Migrate Sync Sources
    const sourcesPath = path.join(DATA_DIR, 'chat_sync_sources.json');
    if (fs.existsSync(sourcesPath)) {
      console.log('📦 Migrating Sync Sources...');
      const sources = JSON.parse(fs.readFileSync(sourcesPath, 'utf-8'));
      for (const key of Object.keys(sources)) {
        const s = sources[key];
        await prisma.syncSource.upsert({
          where: { id: String(s.id) },
          update: {
            type: s.type,
            title: s.title,
            lastUsed: s.lastUsed ? new Date(s.lastUsed) : new Date(),
            usageCount: s.usageCount || 0,
            addedAt: s.addedAt ? new Date(s.addedAt) : new Date(),
            lastCopyId: s.lastCopyId,
            lastMessageId: s.lastMessageId,
          },
          create: {
            id: String(s.id),
            type: s.type,
            title: s.title,
            lastUsed: s.lastUsed ? new Date(s.lastUsed) : new Date(),
            usageCount: s.usageCount || 0,
            addedAt: s.addedAt ? new Date(s.addedAt) : new Date(),
            lastCopyId: s.lastCopyId,
            lastMessageId: s.lastMessageId,
          },
        });
      }
      console.log(`✅ Migrated ${Object.keys(sources).length} sync sources.`);
    }

    console.log('\n✨ MIGRATION COMPLETED SUCCESSFULLY! ✨');
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
