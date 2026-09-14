const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, isVIP: true, createdAt: true }
  });
  console.log('Total users:', users.length);
  console.log('VIP users:', users.filter(u => u.isVIP).length);
  console.log('Free users:', users.filter(u => !u.isVIP).length);

  const txs = await prisma.transaction.findMany({
    where: { status: 'SUCCESS' },
    select: { id: true, amount: true, createdAt: true, status: true }
  });
  console.log('Successful transactions:', txs.length);
  txs.forEach(t => console.log(`- Amount: ${t.amount} at ${t.createdAt}`));
}

main().finally(() => prisma.$disconnect());
