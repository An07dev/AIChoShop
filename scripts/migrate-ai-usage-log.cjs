const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("No DATABASE_URL found");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function migrate() {
  try {
    console.log("Adding columns to AiUsageLog...");
    await pool.query(`
      ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "model" TEXT DEFAULT 'gpt-4o-mini';
      ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "promptTokens" INTEGER DEFAULT 0;
      ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "completionTokens" INTEGER DEFAULT 0;
      ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "totalTokens" INTEGER DEFAULT 0;
      ALTER TABLE "AiUsageLog" ADD COLUMN IF NOT EXISTS "costUsd" DOUBLE PRECISION DEFAULT 0;
      CREATE INDEX IF NOT EXISTS "AiUsageLog_tool_createdAt_idx" ON "AiUsageLog"("tool", "createdAt");
    `);
    console.log("Migration completed successfully!");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await pool.end();
  }
}

migrate();
