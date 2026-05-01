// Quick script to add 'card' to payment method enum
const { Client } = require('pg');

async function runMigration() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'saas_platform333',
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check current enum values
    const checkResult = await client.query(`
      SELECT enum_range(NULL::payments_method_enum);
    `);
    console.log('Current enum values:', checkResult.rows[0].enum_range);

    // Add 'card' to the enum
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_enum 
              WHERE enumlabel = 'card' 
              AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'payments_method_enum')
          ) THEN
              ALTER TYPE payments_method_enum ADD VALUE 'card';
              RAISE NOTICE 'Added card to payments_method_enum';
          ELSE
              RAISE NOTICE 'card already exists in payments_method_enum';
          END IF;
      END$$;
    `);

    // Verify the change
    const verifyResult = await client.query(`
      SELECT enum_range(NULL::payments_method_enum);
    `);
    console.log('Updated enum values:', verifyResult.rows[0].enum_range);
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
