/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomBytes } = require('node:crypto');
const { Pool } = require('pg');

test('PostgreSQL learning schema preserves publishing, playback and media ownership', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw Error('Local test database required');
  const schema = `learning_test_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString() });
  let pool;
  let created = false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}` });
    const fixture = fs.readFileSync('scripts/fixtures/schema.sql', 'utf8').replaceAll('"public".', `"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";', '');
    await pool.query(fixture);

    const now = new Date();
    await pool.query(`INSERT INTO "User" (id,email,password,role,"updatedAt") VALUES ('admin','admin@test.local','x','ADMIN',$1),('student','student@test.local','x','USER',$1)`, [now]);
    await pool.query(`INSERT INTO "Course" (id,title,status,"publishedAt","updatedAt") VALUES ('course','Course','PUBLISHED',$1,$1)`, [now]);
    await pool.query(`INSERT INTO "MediaAsset" (id,filename,"originalName","mimeType","sizeBytes","uploadedBy",status,"updatedAt") VALUES ('asset','video.mp4','video.mp4','video/mp4',1024,'admin','ATTACHED',$1)`, [now]);
    await pool.query(`INSERT INTO "Lesson" (id,"courseId",title,"videoUrl","mediaAssetId","order","isVIP",status,"updatedAt") VALUES ('lesson','course','Lesson','/api/media/video.mp4','asset',1,false,'PUBLISHED',$1)`, [now]);
    await pool.query(`INSERT INTO "Progress" (id,"userId","lessonId",completed,"positionSeconds","durationSeconds","completedAt","updatedAt") VALUES ('progress','student','lesson',true,90,120,$1,$1)`, [now]);

    const row = (await pool.query(`SELECT c.status AS course_status,l.status AS lesson_status,p.completed,p."positionSeconds",m.status AS media_status,m."storageProvider" AS storage_provider FROM "Course" c JOIN "Lesson" l ON l."courseId"=c.id JOIN "Progress" p ON p."lessonId"=l.id JOIN "MediaAsset" m ON m.id=l."mediaAssetId"`)).rows[0];
    assert.deepEqual(row, { course_status: 'PUBLISHED', lesson_status: 'PUBLISHED', completed: true, positionSeconds: 90, media_status: 'ATTACHED', storage_provider: 'LOCAL' });
    await assert.rejects(() => pool.query(`DELETE FROM "User" WHERE id='admin'`), /foreign key/i);
    await pool.query(`UPDATE "Course" SET status='HIDDEN' WHERE id='course'`);
    assert.equal((await pool.query(`SELECT status FROM "Course" WHERE id='course'`)).rows[0].status, 'HIDDEN');
  } finally {
    if (pool && !pool.ended) await pool.end();
    if (created) await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});

test('learning upgrade is repeatable and preserves legacy rows', { skip: !process.env.TEST_DATABASE_URL }, async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw Error('Local test database required');
  const schema = `learning_upgrade_${randomBytes(8).toString('hex')}`;
  const control = new Pool({ connectionString: url.toString() });
  let pool;
  let created = false;
  try {
    await control.query(`CREATE SCHEMA "${schema}"`);
    created = true;
    pool = new Pool({ connectionString: url.toString(), options: `-c search_path=${schema}` });
    await pool.query(`
      CREATE TYPE "Role" AS ENUM ('USER','ADMIN');
      CREATE TABLE "User" (id TEXT PRIMARY KEY,email TEXT NOT NULL,password TEXT NOT NULL,role "Role" NOT NULL DEFAULT 'USER',"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
      CREATE TABLE "Course" (id TEXT PRIMARY KEY,title TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
      CREATE TABLE "Lesson" (id TEXT PRIMARY KEY,"courseId" TEXT NOT NULL,title TEXT NOT NULL,"videoUrl" TEXT,"order" INTEGER NOT NULL,"isVIP" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
      CREATE TABLE "Progress" (id TEXT PRIMARY KEY,"userId" TEXT NOT NULL,"lessonId" TEXT NOT NULL,completed BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL);
      INSERT INTO "User" (id,email,password,"updatedAt") VALUES ('u','u@test.local','x',NOW());
      INSERT INTO "Course" (id,title,"updatedAt") VALUES ('c','Legacy',NOW());
      INSERT INTO "Lesson" (id,"courseId",title,"order","updatedAt") VALUES ('l','c','Legacy lesson',1,NOW());
      INSERT INTO "Progress" (id,"userId","lessonId",completed,"updatedAt") VALUES ('p','u','l',true,NOW());
    `);
    const upgrade = fs.readFileSync('prisma/manual/complete_learning.sql', 'utf8');
    await pool.query(upgrade);
    await pool.query(upgrade);
    const result = (await pool.query(`SELECT c.status AS course_status,l.status AS lesson_status,p."completedAt" IS NOT NULL AS completed_backfilled FROM "Course" c JOIN "Lesson" l ON l."courseId"=c.id JOIN "Progress" p ON p."lessonId"=l.id`)).rows[0];
    assert.deepEqual(result, { course_status: 'PUBLISHED', lesson_status: 'PUBLISHED', completed_backfilled: true });
    assert.equal((await pool.query(`SELECT COUNT(*)::int AS count FROM "Course"`)).rows[0].count, 1);
  } finally {
    if (pool && !pool.ended) await pool.end();
    if (created) await control.query(`DROP SCHEMA "${schema}" CASCADE`);
    await control.end();
  }
});
