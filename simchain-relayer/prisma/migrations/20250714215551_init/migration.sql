-- CreateTable
CREATE TABLE "encrypted_wallets" (
    "id" TEXT NOT NULL,
    "encryptedSim" TEXT NOT NULL,
    "simHash" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'RW',
    "currentAlias" TEXT NOT NULL DEFAULT 'unknown',
    "lastBalance" DOUBLE PRECISION DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "encrypted_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alias_history" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "oldAlias" TEXT,
    "newAlias" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alias_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "alias" TEXT,
    "errorMessage" TEXT NOT NULL,
    "errorCode" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "encrypted_wallets_simHash_key" ON "encrypted_wallets"("simHash");

-- CreateIndex
CREATE UNIQUE INDEX "encrypted_wallets_walletAddress_key" ON "encrypted_wallets"("walletAddress");

-- CreateIndex
CREATE INDEX "alias_history_walletId_idx" ON "alias_history"("walletId");

-- CreateIndex
CREATE INDEX "alias_history_changedAt_idx" ON "alias_history"("changedAt");

-- CreateIndex
CREATE INDEX "error_logs_action_idx" ON "error_logs"("action");

-- CreateIndex
CREATE INDEX "error_logs_alias_idx" ON "error_logs"("alias");

-- CreateIndex
CREATE INDEX "error_logs_errorCode_idx" ON "error_logs"("errorCode");

-- CreateIndex
CREATE INDEX "error_logs_createdAt_idx" ON "error_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "alias_history" ADD CONSTRAINT "alias_history_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "encrypted_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
