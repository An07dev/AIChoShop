-- Change defaults only; existing banking/AI settings remain untouched.
ALTER TABLE "SystemSetting" ALTER COLUMN "adminPassword" DROP DEFAULT;
ALTER TABLE "SystemSetting" ALTER COLUMN "isOpenAiActive" SET DEFAULT false;
ALTER TABLE "SePayConfig" ALTER COLUMN "bankName" SET DEFAULT '';
ALTER TABLE "SePayConfig" ALTER COLUMN "accountNumber" SET DEFAULT '';
ALTER TABLE "SePayConfig" ALTER COLUMN "accountHolder" SET DEFAULT '';
ALTER TABLE "SePayConfig" ALTER COLUMN "syntaxPrefix" SET DEFAULT 'ACS';
ALTER TABLE "SePayConfig" ALTER COLUMN "autoActivate" SET DEFAULT false;
