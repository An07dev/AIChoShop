/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { Client } = require('pg');
const { randomBytes, createHash } = require('node:crypto');
(async () => {
  const url = new URL(process.env.TEST_DATABASE_URL);
  if (url.hostname !== '127.0.0.1' || !url.pathname.endsWith('_test')) throw new Error('Local test database required');
  const db = new Client({ connectionString: url.toString() });
  const token = randomBytes(32).toString('hex');
  const filename = 'video_1789117451644_202609111458__1_.mp4';
  try {
    await db.connect();
    const tables = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    if (!tables.rowCount) await db.query(fs.readFileSync('scripts/fixtures/schema.sql', 'utf8'));
    await db.query(`INSERT INTO "Course" (id,title,"updatedAt") VALUES ('media_http_fixture','Fixture',NOW());
      INSERT INTO "Lesson" (id,"courseId",title,"videoUrl","order","isVIP","updatedAt") VALUES ('media_http_fixture','media_http_fixture','Fixture','/uploads/videos/${filename}',1,true,NOW());
      INSERT INTO "User" (id,email,password,"isVIP","updatedAt") VALUES ('media_http_fixture','media-http@example.test','fixture',true,NOW())`);
    await db.query('INSERT INTO "SeoSession" ("tokenHash","userId","expiresAt") VALUES ($1,$2,NOW()+INTERVAL \'1 hour\')', [createHash('sha256').update(token).digest('hex'), 'media_http_fixture']);
    for (const prefix of ['/uploads/videos/', '/api/media/']) {
      const target = `http://127.0.0.1:3127${prefix}${filename}`;
      let response = await fetch(target, { headers: { Range: 'bytes=0-15' } });
      assert.equal(response.status, 403);
      response = await fetch(target, { headers: { Range: 'bytes=0-15', Cookie: `seo_session=${token}` } });
      assert.equal(response.status, 206);
      assert.equal((await response.arrayBuffer()).byteLength, 16);
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      console.log(`PASS VIP authorization and seeking: ${prefix}`);
    }
    await db.query('UPDATE "User" SET "vipExpiresAt"=NOW()-INTERVAL \'1 day\' WHERE id=$1', ['media_http_fixture']);
    const denied = await fetch(`http://127.0.0.1:3127/uploads/videos/${filename}`, { headers: { Cookie: `seo_session=${token}` } });
    assert.equal(denied.status, 403);
    console.log('PASS expired VIP denied');
  } finally {
    await db.query('DELETE FROM "Lesson" WHERE id=$1', ['media_http_fixture']);
    await db.query('DELETE FROM "Course" WHERE id=$1', ['media_http_fixture']);
    await db.query('DELETE FROM "User" WHERE id=$1', ['media_http_fixture']);
    await db.end();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
