import { PrismaClient } from '../src/generated/prisma';
import { AliasGenerator } from '../src/lib/alias-generator';

const prisma = new PrismaClient();

async function migrateAliases() {
  try {
    console.log('Starting alias migration...');

    // Get all wallets with default "unknown" alias
    const wallets = await prisma.encryptedWallet.findMany({
      where: {
        currentAlias: "unknown"
      }
    });

    console.log(`Found ${wallets.length} wallets to migrate`);

    for (const wallet of wallets) {
      // Generate unique alias
      const newAlias = await AliasGenerator.generateUniqueAlias();
      
      console.log(`Migrating wallet ${wallet.walletAddress} to alias: ${newAlias}`);

      // Update wallet with new alias
      await prisma.encryptedWallet.update({
        where: { id: wallet.id },
        data: { currentAlias: newAlias }
      });

      // Create alias history record
      await prisma.aliasHistory.create({
        data: {
          walletId: wallet.id,
          oldAlias: null,
          newAlias: newAlias
        }
      });
    }

    console.log('Alias migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAliases()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  }); 