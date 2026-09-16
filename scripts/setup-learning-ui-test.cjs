/* eslint-disable @typescript-eslint/no-require-imports */
const { Pool } = require('pg');
const { createHash } = require('node:crypto');

async function main() {
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required');
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Local test database required');
  const pool = new Pool({ connectionString: url.toString() });
  try {
    const password = createHash('sha256').update('Admin123!', 'utf8').digest('hex');
    await pool.query(`INSERT INTO "User" (id,email,password,name,role,"isVIP","updatedAt") VALUES ('ui-admin','admin@local.test',$1,'Admin Local','ADMIN',true,NOW()) ON CONFLICT (email) DO NOTHING`, [password]);
    await pool.query(`INSERT INTO "Course" (id,title,description,status,"publishedAt","updatedAt") VALUES ('ui-course','Khóa học kiểm thử','Nội dung kiểm thử local','PUBLISHED',NOW(),NOW()) ON CONFLICT (id) DO NOTHING`);
    await pool.query(`INSERT INTO "Lesson" (id,"courseId",title,content,"order","isVIP",status,"updatedAt") VALUES ('ui-free','ui-course','Bài miễn phí','Nội dung miễn phí',1,false,'PUBLISHED',NOW()),('ui-vip','ui-course','Bài VIP','Nội dung VIP',2,true,'PUBLISHED',NOW()) ON CONFLICT (id) DO NOTHING`);
    console.log('UI fixtures ready: admin@local.test / Admin123!');
  } finally {
    await pool.end();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
