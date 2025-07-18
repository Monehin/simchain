# SIMChain Project Guide

## Project Overview
SIMChain is a full-stack Solana blockchain system that enables smart contract wallets derived from SIM card numbers via USSD gateways. The system provides encrypted phone number storage, unique alias generation, and real on-chain transactions.

## Architecture

### Core Components
- **Solana Program**: Rust smart contract for wallet management
- **Next.js API**: TypeScript backend with encrypted database
- **@solana/kit**: Modern Solana SDK for RPC interactions
- **Prisma**: Database ORM with PostgreSQL
- **Encryption**: AES-256-GCM for phone number security

### Key Features
- ✅ Real on-chain wallet creation with PDAs
- ✅ Encrypted phone number storage
- ✅ Unique alias generation system
- ✅ Cross-wallet fund transfers
- ✅ Balance checking and deposits
- ✅ Alias history tracking
- ✅ Audit logging system
- ✅ Privacy-first design

## Environment Setup

### Required Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/simchain"

# Solana
SOLANA_CLUSTER_URL="http://127.0.0.1:8899"
PROGRAM_ID="DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r"
WALLET_PRIVATE_KEY="[JSON array of private key bytes]"

# Encryption
ENCRYPTION_SECRET_KEY="[32-byte hex string]"
```

### Generate Encryption Key
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Project Structure
```
SIMChain/
├── programs/simchain_wallet/     # Rust smart contract
├── simchain-relayer/             # Next.js API server
│   ├── src/app/api/              # API endpoints
│   ├── src/lib/                  # Core libraries
│   ├── prisma/                   # Database schema
│   └── src/generated/prisma/     # Generated Prisma client
├── target/                       # Compiled Rust program
├── test-ledger/                  # Solana validator data
└── idl/                         # Anchor IDL files
```

## API Endpoints

### Core Operations
- `POST /api/create-wallet` - Create new wallet
- `POST /api/check-balance` - Check wallet balance
- `POST /api/send-funds` - Transfer funds between wallets
- `POST /api/deposit-funds` - Deposit funds to wallet
- `POST /api/update-alias` - Update wallet alias
- `POST /api/init-program` - Initialize program accounts

### Utility Endpoints
- `GET /api/test-connection` - Test Solana connection
- `GET /api/test-database` - Check database status
- `GET /api/audit-logs` - View audit logs
- `GET /api/alias-preview` - Preview alias generation

## Database Schema

### EncryptedWallet
- `id`: Unique identifier
- `encryptedSim`: Encrypted phone number
- `simHash`: SHA256 hash for lookup
- `walletAddress`: Solana wallet address
- `country`: Country code (default: RW)
- `currentAlias`: Current wallet alias
- `lastBalance`: Last known balance
- `createdAt/updatedAt`: Timestamps

### AliasHistory
- `id`: Unique identifier
- `walletId`: Reference to wallet
- `oldAlias`: Previous alias (nullable)
- `newAlias`: New alias
- `changedAt`: Change timestamp

### ErrorLog
- `id`: Unique identifier
- `action`: Action being performed
- `alias`: Related alias (nullable)
- `errorMessage`: Error description
- `errorCode`: Error code
- `metadata`: Additional JSON data
- `createdAt`: Timestamp

## Setup Instructions

### 1. Fresh Start (New Chat Context)
```bash
# Clone/access project
cd /Users/monehin/Desktop/SIMChain

# Install dependencies
npm install
cd simchain-relayer && npm install

# Setup environment
cp env.example .env
# Edit .env with your values

# Generate Prisma client
cd simchain-relayer
npx prisma generate
npx prisma db push

# Start Solana validator
cd ..
solana-test-validator --reset

# Build and deploy program
anchor build
anchor deploy --provider.cluster localnet

# Start API server
cd simchain-relayer
npm run dev
```

### 2. Initialize Program
```bash
curl -X POST http://localhost:3000/api/init-program
```

### 3. Test Core Functionality
```bash
# Create wallet
curl -X POST http://localhost:3000/api/create-wallet \
  -H "Content-Type: application/json" \
  -d '{"sim": "+1234567890", "pin": "123456"}'

# Check balance
curl -X POST http://localhost:3000/api/check-balance \
  -H "Content-Type: application/json" \
  -d '{"sim": "+1234567890", "pin": "123456"}'

# Send funds
curl -X POST http://localhost:3000/api/send-funds \
  -H "Content-Type: application/json" \
  -d '{"fromSim": "+1234567890", "toSim": "+0987654321", "amount": 0.5, "pin": "123456"}'
```

## Important Technical Details

### Program ID
- **Current**: `DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r`
- **Location**: `Anchor.toml` and environment variables

### PDA Derivation
- **Config PDA**: `[Buffer.from('config')]`
- **Registry PDA**: `[Buffer.from('registry')]`
- **Wallet PDA**: `[Buffer.from('wallet'), simHash]`
- **Salt**: Stored in config account, used for SIM hashing

### Client Architecture
- Uses `@solana/kit` for RPC calls
- `@solana/web3.js` for transaction creation
- Custom PDA derivation matching Rust program
- Real transaction signing and confirmation

### Encryption System
- **Algorithm**: AES-256-GCM
- **Key Derivation**: scrypt with random salt
- **Phone Validation**: International format (+1234567890)
- **Hash Lookup**: SHA256(sim + secret_key)

### Alias System
- **Generator**: unique-names-generator package
- **Patterns**: Adjective + Animal, Color + Object, etc.
- **Validation**: 3-32 characters, printable ASCII
- **Uniqueness**: Database-enforced uniqueness
- **History**: Full change tracking

## Troubleshooting

### Common Issues
1. **"Program does not exist"** - Deploy program first
2. **"Config account does not exist"** - Run init-program
3. **"Wallet already exists"** - Check database or use different SIM
4. **"Encryption key not found"** - Set ENCRYPTION_SECRET_KEY
5. **"Database connection failed"** - Check DATABASE_URL

### Reset Everything
```bash
# Kill validator
pkill -f solana-test-validator

# Reset database
cd simchain-relayer
npx prisma db push --force-reset

# Restart validator
cd ..
solana-test-validator --reset

# Redeploy program
anchor build
anchor deploy --provider.cluster localnet

# Initialize program
curl -X POST http://localhost:3000/api/init-program
```

## Security Considerations

### Privacy
- Phone numbers encrypted at rest
- Aliases replace phone numbers in logs
- No plaintext phone storage
- Hash-based lookups only

### Access Control
- PIN validation for operations
- Transaction signing with relayer wallet
- Database access through Prisma ORM
- Environment-based secrets

### Audit Trail
- All operations logged
- Error tracking with metadata
- Alias change history
- Transaction signatures stored

## Performance Notes

### Current Limits
- **Wallets per program**: Unlimited
- **Transaction size**: Standard Solana limits
- **Database**: PostgreSQL with indexing
- **RPC**: Local validator (fast)

### Optimization
- PDA derivation cached
- Database connection pooling
- RPC connection reuse
- Batch operations supported

## Future Enhancements

### Potential Features
- USSD gateway integration
- Multi-currency support
- Advanced analytics
- Mobile app integration
- Regulatory compliance tools
- Cross-chain bridges

### Scalability
- Multiple validator support
- Database sharding
- CDN integration
- Load balancing
- Microservices architecture

## Contact & Support

### Project Location
- **Path**: `/Users/monehin/Desktop/SIMChain`
- **Repository**: Local development
- **Documentation**: This guide

### Key Files
- `Anchor.toml` - Program configuration
- `simchain-relayer/prisma/schema.prisma` - Database schema
- `simchain-relayer/src/lib/simchain-client.ts` - Main client
- `programs/simchain_wallet/src/lib.rs` - Smart contract

---

**Last Updated**: July 14, 2025
**Status**: Production Ready
**Version**: 1.0.0 