/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool }=require('pg');
const { seed }=require('./data/seed.cjs');
require('dotenv').config({quiet:true});
async function main() {
  const mode=process.argv[2]||'bootstrap';
  if (!['bootstrap','demo'].includes(mode)) throw Error('Seed mode không hợp lệ.');
  if (!process.env.DATABASE_URL) throw Error('Thiếu DATABASE_URL.');
  const url=new URL(process.env.DATABASE_URL);
  if (mode==='demo' && (!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||process.env.NODE_ENV==='production')) throw Error('Demo chỉ được chạy trên PostgreSQL local, ngoài production.');
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  try { await seed(pool,mode); console.log(`Seed ${mode} hoàn tất; không ghi đè dữ liệu hiện có.`); }
  finally { await pool.end(); }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

