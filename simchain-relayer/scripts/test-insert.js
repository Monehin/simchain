const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.walletMapping.create({
    data: {
      simNumber: '+test',
      walletAddress: 'test_wallet_address',
      ownerAddress: 'test_owner_address',
      simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      alias: 'test_alias'
    }
  });
  console.log('Inserted test wallet mapping!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => prisma.$disconnect()); 