const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'saas_platform6',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'create-warehouses-table.sql'), 'utf8');
    
    await client.query(sql);
    console.log('✅ Warehouse migration completed successfully!');
    console.log('   - Created warehouses table');
    console.log('   - Added warehouse_id to products table');
    console.log('   - Added warehouse_id to stock_movements table');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
