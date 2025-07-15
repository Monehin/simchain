-- Rename currentAlias column to alias in encrypted_wallets table
ALTER TABLE "encrypted_wallets" RENAME COLUMN "currentAlias" TO "alias"; 