// Run: node --experimental-strip-types scratch/deep-review-domain-probes.mjs
// Pure calculation fixtures; no database or provider access.
import { calculateEcommerceTax } from '../src/lib/tax-calculator/engine.ts';
import { detectCategory } from '../src/lib/pricing/registry.ts';
import fs from 'node:fs';

const base = {
  taxYear: 2026, payerType: 'company', activity: 'goods', personalIncomeMethod: 'revenue',
  shopeeRevenue: 800000000, tiktokRevenue: 0, otherPlatformRevenue: 0, directRevenue: 0,
  platformFees: 0, deductibleCosts: 500000000, otherTaxableIncome: 0, carriedLoss: 0,
  withheldVat: 0, withheldIncomeTax: 0, companyPreviousYearRevenue: 800000000,
  companyVatRate: 10, deductibleInputVat: 0, applyIncomeTaxReduction: false,
};
const tax = calculateEcommerceTax(base);
const category = detectCategory('zzzzqqqqxxxx', 'shopee', 'marketplace');
const fees = JSON.parse(fs.readFileSync('src/lib/pricing/data/official-fees.json', 'utf8'));
const result = {
  companyUnderOneBillion: {
    revenue: base.shopeeRevenue, previousYearRevenue: base.companyPreviousYearRevenue,
    incomeTax: tax.incomeTax, isExempt: tax.isExempt,
  },
  unrelatedCategorySuggestion: category ? { id: category.id, level3: category.level3 } : null,
  feeRows: fees.length,
  feePlatforms: fees.reduce((counts, row) => { counts[row.platform] = (counts[row.platform] || 0) + 1; return counts; }, {}),
};
fs.writeFileSync('scratch/deep-review-domain-probes.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
