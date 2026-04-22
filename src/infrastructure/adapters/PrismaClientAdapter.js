const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const Database = require('better-sqlite3');

/**
 * Singleton class for Prisma Client
 */
const prisma = new PrismaClient({ 
  adapter: new PrismaBetterSqlite3({ url: 'file:C:/Users/Administrator/Documents/GitHub/usertelenode/prisma/dev.db' }) 
});

module.exports = prisma;
