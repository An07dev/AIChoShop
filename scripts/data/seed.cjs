/* eslint-disable @typescript-eslint/no-require-imports */
const { randomUUID } = require('node:crypto');
async function seed(pool, mode='bootstrap') {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(16092026)');
    await client.query(`INSERT INTO "SystemSetting" (id,"adminPassword","isOpenAiActive","updatedAt") VALUES ('default',NULL,false,NOW()) ON CONFLICT (id) DO NOTHING`);
    await client.query(`INSERT INTO "SePayConfig" (id,"bankName","accountNumber","accountHolder","apiKey","autoActivate","updatedAt") VALUES ('default','','','','',false,NOW()) ON CONFLICT (id) DO NOTHING`);
    if (mode==='demo') {
      const title='[DEMO] Khóa học thực hành local';
      let course=(await client.query(`SELECT id FROM "Course" WHERE title=$1 ORDER BY "createdAt",id LIMIT 1`,[title])).rows[0];
      if (!course) {
        course={id:randomUUID()};
        await client.query(`INSERT INTO "Course" (id,title,status,"updatedAt") VALUES ($1,$2,'DRAFT',NOW())`,[course.id,title]);
      }
      for (const [index,name] of ['Bài demo 1','Bài demo 2'].entries()) {
        if ((await client.query(`SELECT id FROM "Lesson" WHERE "courseId"=$1 AND title=$2`,[course.id,name])).rows.length) continue;
        const order=Number((await client.query(`SELECT COALESCE(MAX("order"),0)+1 AS next FROM "Lesson" WHERE "courseId"=$1`,[course.id])).rows[0].next);
        await client.query(`INSERT INTO "Lesson" (id,title,"courseId","moduleName","order","isVIP",status,"updatedAt") VALUES ($1,$2,$3,$4,$5,$6,'DRAFT',NOW())`,[randomUUID(),name,course.id,`Phần ${index+1}`,order,index===1]);
      }
    }
    await client.query('COMMIT');
  } catch(error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
module.exports={seed};

