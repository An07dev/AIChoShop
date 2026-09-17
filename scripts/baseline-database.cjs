/* eslint-disable @typescript-eslint/no-require-imports */
const {spawnSync}=require('node:child_process');
const {Pool}=require('pg');
require('dotenv').config({quiet:true});
function run(args) {
  const result=spawnSync(process.execPath,[require.resolve('prisma/build/index.js'),...args],{stdio:'inherit',env:process.env});
  if(result.error) throw result.error;
  return result.status;
}
async function main() {
  const code=run(['migrate','diff','--from-config-datasource','--to-schema','prisma/baseline.prisma','--exit-code']);
  if(code!==0) throw Error('Baseline bị chặn: database không khớp baseline hoặc mất kết nối. Không thay đổi dữ liệu.');
  const pool=new Pool({connectionString:process.env.DATABASE_URL});
  try {
    // Prisma diff does not represent CHECK/exclusion constraints. Verify them separately.
    const constraints=await pool.query(`SELECT conname FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND t.relname IN ('Lesson','Progress','PricingFeeOverride')`);
    const present=new Set(constraints.rows.map(row=>row.conname));
    for(const name of ['Lesson_durationSeconds_check','Progress_positionSeconds_check','PricingFeeOverride_valid_values_check','PricingFeeOverride_no_active_overlap_excl']) {
      if(!present.has(name)) throw Error(`Baseline bị chặn: thiếu constraint ${name}. Chuẩn bị migration tương thích trước khi nhận baseline.`);
    }
  } finally { await pool.end(); }
  process.exitCode=run(['migrate','resolve','--applied','20260916000000_baseline']);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});

