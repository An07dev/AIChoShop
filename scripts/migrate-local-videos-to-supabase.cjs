/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'course-videos';
  if (!databaseUrl || !supabaseUrl || !serviceKey) throw new Error('Thiếu DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY.');

  const pool = new Pool({ connectionString: databaseUrl });
  const storage = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const privateRoot = path.resolve(process.env.MEDIA_ROOT || path.join(process.cwd(), '.data', 'media'));
  const publicRoot = path.join(process.cwd(), 'public', 'uploads', 'videos');
  const admin = (await pool.query(`SELECT id FROM "User" WHERE role='ADMIN' ORDER BY "createdAt" LIMIT 1`)).rows[0];
  if (!admin) throw new Error('Không tìm thấy tài khoản admin để ghi ownership media.');
  const lessons = (await pool.query(`
    SELECT l.id,l.title,l."videoUrl",l."mediaAssetId",m.filename
    FROM "Lesson" l LEFT JOIN "MediaAsset" m ON m.id=l."mediaAssetId"
    WHERE l."videoUrl" LIKE '/api/media/%' OR l."videoUrl" LIKE '/uploads/videos/%'
    ORDER BY l."createdAt"
  `)).rows;
  const result = { migrated: 0, skippedRemote: 0, missing: [] };
  try {
    for (const lesson of lessons) {
      const filename = path.basename(lesson.videoUrl);
      const existing = lesson.mediaAssetId
        ? (await pool.query(`SELECT * FROM "MediaAsset" WHERE id=$1`, [lesson.mediaAssetId])).rows[0]
        : (await pool.query(`SELECT * FROM "MediaAsset" WHERE filename=$1`, [filename])).rows[0];
      if (existing?.storageProvider === 'SUPABASE') { result.skippedRemote++; continue; }
      const candidates = [path.join(privateRoot, filename), path.join(publicRoot, filename)];
      const source = candidates.find(file => fs.existsSync(file));
      if (!source) { result.missing.push({ lessonId: lesson.id, title: lesson.title, filename }); continue; }
      const extension = path.extname(filename).toLowerCase();
      if (!['.mp4', '.webm'].includes(extension)) { result.missing.push({ lessonId: lesson.id, title: lesson.title, filename, reason: 'unsupported' }); continue; }
      const objectPath = `migrations/${lesson.id}/${randomUUID()}${extension}`;
      const body = fs.readFileSync(source);
      const mimeType = extension === '.webm' ? 'video/webm' : 'video/mp4';
      const uploaded = await storage.storage.from(bucket).upload(objectPath, body, { contentType: mimeType, upsert: false, cacheControl: '3600' });
      if (uploaded.error) throw new Error(`Upload ${filename}: ${uploaded.error.message}`);
      const assetId = existing?.id || randomUUID();
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        if (existing) {
          await client.query(`UPDATE "MediaAsset" SET "storageProvider"='SUPABASE',"storageBucket"=$1,"storagePath"=$2,"sizeBytes"=$3,"mimeType"=$4,status='ATTACHED',"updatedAt"=NOW() WHERE id=$5`, [bucket, objectPath, body.length, mimeType, assetId]);
        } else {
          await client.query(`INSERT INTO "MediaAsset" (id,filename,"originalName","mimeType","sizeBytes","uploadedBy",status,"storageProvider","storageBucket","storagePath","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'ATTACHED','SUPABASE',$7,$8,NOW())`, [assetId, filename, filename, mimeType, body.length, admin.id, bucket, objectPath]);
        }
        await client.query(`UPDATE "Lesson" SET "mediaAssetId"=$1,"videoUrl"=$2,"updatedAt"=NOW() WHERE id=$3`, [assetId, `/api/media/${filename}`, lesson.id]);
        await client.query('COMMIT');
        result.migrated++;
      } catch (error) {
        await client.query('ROLLBACK');
        await storage.storage.from(bucket).remove([objectPath]);
        throw error;
      } finally { client.release(); }
    }
    console.log(JSON.stringify(result, null, 2));
  } finally { await pool.end(); }
}

main().catch(error => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
