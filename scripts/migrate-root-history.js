const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');

const prisma = new PrismaClient({ 
  adapter: new PrismaBetterSqlite3({ url: 'file:C:/Users/Administrator/Documents/GitHub/usertelenode/prisma/dev.db' }) 
});

async function run() {
  console.log('🚀 Migrating data from root scraping_history.json...');
  try {
    if (!fs.existsSync('scraping_history.json')) {
      console.error('❌ File scraping_history.json not found in root.');
      return;
    }

    const history = JSON.parse(fs.readFileSync('scraping_history.json', 'utf-8'));
    const channels = history.channels || {};
    const channelKeys = Object.keys(channels);
    
    console.log(`Found ${channelKeys.length} channels.`);

    for (const key of channelKeys) {
      const ch = channels[key];
      console.log(`- Migrating ${ch.channelName}...`);
      
      const channel = await prisma.channel.upsert({
        where: { channelName: String(ch.channelName) },
        update: {
          channelTitle: ch.channelTitle,
          lastScrapedId: ch.lastScrapedId,
          lastScrapedAt: ch.lastScrapedAt ? new Date(ch.lastScrapedAt) : null,
          totalLinksFound: ch.totalLinksFound || 0,
          totalMessagesScraped: ch.totalMessagesScraped || 0,
        },
        create: {
          channelName: String(ch.channelName),
          channelTitle: ch.channelTitle,
          lastScrapedId: ch.lastScrapedId,
          lastScrapedAt: ch.lastScrapedAt ? new Date(ch.lastScrapedAt) : null,
          totalLinksFound: ch.totalLinksFound || 0,
          totalMessagesScraped: ch.totalMessagesScraped || 0,
        },
      });

      if (Array.isArray(ch.scrapingSessions)) {
        for (const sess of ch.scrapingSessions) {
          await prisma.scrapingSession.create({
            data: {
              date: sess.date ? new Date(sess.date) : new Date(),
              startId: sess.startId || 0,
              endId: sess.endId || 0,
              processed: sess.processed || 0,
              linksFound: sess.linksFound || 0,
              channelId: channel.id
            }
          });
        }
      }
    }
    console.log('✅ Migration completed successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

run();
