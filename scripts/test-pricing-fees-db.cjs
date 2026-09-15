/* eslint-disable @typescript-eslint/no-require-imports */
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const {randomBytes}=require('node:crypto');const {Pool}=require('pg');const {PrismaPg}=require('@prisma/adapter-pg');const {PrismaClient}=require('@prisma/client');
test('PostgreSQL pricing fees: value constraints and concurrent period exclusion',{skip:!process.env.TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.TEST_DATABASE_URL);if(!['localhost','127.0.0.1'].includes(url.hostname)||!url.pathname.endsWith('_test'))throw Error('Local *_test database required');
 const schema=`pricing_test_${randomBytes(8).toString('hex')}`;const control=new Pool({connectionString:url.toString()});let pool,db,created=false;
 try{await control.query(`CREATE SCHEMA "${schema}"`);created=true;pool=new Pool({connectionString:url.toString(),options:`-c search_path=${schema}`,max:8});
  await pool.query(fs.readFileSync('scripts/fixtures/schema.sql','utf8').replaceAll('"public".',`"${schema}".`).replace('CREATE SCHEMA IF NOT EXISTS "public";',''));
  const sql=fs.readFileSync('prisma/manual/guard_pricing_fee_periods.sql','utf8');await pool.query(sql);await pool.query(sql);
  db=new PrismaClient({adapter:new PrismaPg(pool,{schema})});
  const base={platform:'shopee',shopType:'marketplace',categoryId:'shopee-416',commissionRate:10,effectiveFrom:new Date('2026-01-01'),sourceName:'fixture'};
  const outcomes=await Promise.allSettled([
   db.pricingFeeOverride.create({data:{...base,id:'one',effectiveTo:new Date('2026-12-31')}}),
   db.pricingFeeOverride.create({data:{...base,id:'two',effectiveFrom:new Date('2026-06-01')}}),
  ]);
  assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,1);assert.equal(await db.pricingFeeOverride.count(),1);
  await assert.rejects(()=>db.pricingFeeOverride.create({data:{...base,id:'bad-rate',categoryId:'shopee-other',commissionRate:101}}));
  await assert.rejects(()=>db.pricingFeeOverride.create({data:{...base,id:'bad-period',categoryId:'shopee-period',effectiveTo:new Date('2025-01-01')}}));
 }finally{if(db)await db.$disconnect();if(pool&&!pool.ended)await pool.end();if(created)await control.query(`DROP SCHEMA "${schema}" CASCADE`);await control.end();}
});
