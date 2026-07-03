const path = require('node:path');
const { defineConfig } = require('prisma/config');
const dotenv = require('dotenv');

dotenv.config();

module.exports = defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    seed: 'node prisma/seed.js'
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
});
