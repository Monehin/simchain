# SIMChain Quick Start Guide

## 🚀 5-Minute Setup

### 1. Environment Setup
```bash
cd /Users/monehin/Desktop/SIMChain/simchain-relayer
cp .env.example .env
# Edit .env with your database URL and encryption key
```

### 2. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 3. Start Solana Validator
```bash
cd ..
pkill -f solana-test-validator
solana-test-validator --reset
```

### 4. Deploy Program
```bash
anchor build
anchor deploy --provider.cluster localnet
```

### 5. Start API Server
```bash
cd simchain-relayer
npm run dev
```

### 6. Initialize Program
```bash
curl -X POST http://localhost:3000/api/init-program
```

## 🧪 Quick Test
```bash
# Create wallet
curl -X POST http://localhost:3000/api/create-wallet \
  -H "Content-Type: application/json" \
  -d '{"sim": "+1234567890", "pin": "123456"}'

# Check balance
curl -X POST http://localhost:3000/api/check-balance \
  -H "Content-Type: application/json" \
  -d '{"sim": "+1234567890", "pin": "123456"}'
```

## 🔧 Environment Variables Needed
```bash
DATABASE_URL="postgresql://..."
ENCRYPTION_SECRET_KEY="32-byte-hex-string"
SOLANA_CLUSTER_URL="http://127.0.0.1:8899"
PROGRAM_ID="DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r"
WALLET_PRIVATE_KEY="[JSON-array-of-private-key-bytes]"
```

## 📁 Key Files
- `simchain-relayer/src/lib/simchain-client.ts` - Main client
- `simchain-relayer/prisma/schema.prisma` - Database schema
- `programs/simchain_wallet/src/lib.rs` - Smart contract
- `Anchor.toml` - Program configuration

## 🆘 Common Issues
- **"Program does not exist"** → Run `anchor deploy`
- **"Config account does not exist"** → Run `/api/init-program`
- **"Database error"** → Run `npx prisma db push`
- **"Encryption key not found"** → Set `ENCRYPTION_SECRET_KEY`

## 📊 Current Status
- ✅ Program deployed and initialized
- ✅ 2 test wallets created
- ✅ Fund transfers working
- ✅ Alias system operational
- ✅ Database with encrypted data 