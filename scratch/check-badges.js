const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(app)/tools/pricing-calculator/PricingCalculatorClient.tsx',
  'src/app/(app)/tools/tax-calculator/page.tsx',
  'src/app/(app)/tools/seo-optimizer/page.tsx',
  'src/app/(app)/tools/policy-checker/page.tsx',
  'src/app/(app)/tools/review-replier/page.tsx',
  'src/app/(app)/tools/product-validator/page.tsx',
  'src/app/(app)/tools/competitor-miner/page.tsx',
  'src/app/(app)/tools/photo-prompter/page.tsx',
  'src/app/(app)/tools/vision-listing/page.tsx',
  'src/app/(app)/tools/title-spinner/page.tsx',
  'src/app/(app)/tools/ad-copy/page.tsx',
  'src/app/(app)/tools/script-writer/page.tsx',
  'src/app/(app)/tools/koc-planner/KocPlannerClient.tsx',
  'src/app/(app)/tools/video-repurposer/page.tsx',
  'src/app/(app)/tools/objection-killer/page.tsx',
  'src/app/(app)/tools/chat-broadcast/page.tsx',
  'src/app/(app)/tools/appeal-generator/page.tsx',
  'src/app/(app)/tools/unboxing-card/page.tsx',
  'src/app/(app)/tools/anti-return-nudge/page.tsx'
];

console.log('=== CHECKING ALL 19 TOOLS FOR TITLE BADGE ===');
let missingCount = 0;
files.forEach((f, idx) => {
  const content = fs.readFileSync(f, 'utf-8');
  const hasVip = content.includes('VIP TOOL');
  const hasFree = content.includes('FREE TOOL');
  const toolName = path.basename(path.dirname(f));
  const status = hasVip ? '👑 VIP TOOL' : hasFree ? '🟢 FREE TOOL' : '❌ MISSING';
  if (!hasVip && !hasFree) missingCount++;
  console.log(`${idx + 1}. [${toolName.padEnd(20)}]: ${status}`);
});
console.log(`\nTotal checked: ${files.length}. Missing: ${missingCount}`);
