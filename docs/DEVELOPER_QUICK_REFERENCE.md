# 🚀 SIMChain Developer Quick Reference

## 📁 **Essential File Locations**

### **Core Configuration**
```
Anchor.toml                                    # Anchor configuration
programs/simchain_wallet/src/lib.rs           # Solana program logic
simchain-relayer/src/config/programId.ts      # Program ID configuration
simchain-relayer/prisma/schema.prisma         # Database schema
simchain-relayer/.env                         # Environment variables
```

### **Key Scripts**
```
simchain-relayer/scripts/full-setup.sh        # Complete setup automation
scripts/clean-validator.sh                    # Validator cleanup
scripts/fix-permissions.sh                    # Permission fixes
```

### **API Routes**
```
simchain-relayer/src/app/api/                 # All API endpoints
├── create-wallet/route.ts                    # Wallet creation
├── check-balance/route.ts                    # Balance checking
├── send-funds/route.ts                       # Fund transfers
├── relay/route.ts                            # USSD handling
└── admin/                                    # Admin operations
```

## ⚡ **Quick Commands**

### **Setup & Development**
```bash
# Complete setup (recommended)
cd simchain-relayer && ./scripts/full-setup.sh

# Start development server
cd simchain-relayer && npm run dev

# Build Solana program
anchor build

# Deploy program
anchor deploy

# Clean validator
./scripts/clean-validator.sh
```

### **Database Operations**
```bash
# Generate Prisma client
npx prisma generate

# Push schema changes
npx prisma db push

# Reset database
npx prisma db push --force-reset

# Open Prisma Studio
npx prisma studio
```

### **Testing**
```bash
# Run all tests
npm test

# Test specific flows
node scripts/test-complete-pin-flow.js
node scripts/test-ussd-flow.js
node scripts/test-ussd-endpoints.js
```

## 🔧 **Troubleshooting**

### **Common Issues & Solutions**

#### **"npm run dev" Missing Script**
```bash
# Solution: Run from correct directory
cd simchain-relayer && npm run dev
```

#### **Program ID Mismatch Error**
```bash
# Check current program ID
cat simchain-relayer/src/config/programId.ts

# Rebuild and redeploy
anchor build && anchor deploy

# Update config with new program ID
# (full-setup.sh does this automatically)
```

#### **Port 3000 Already in Use**
```bash
# Kill processes on port 3000
lsof -ti :3000 | xargs kill -9

# Or use the cleanup script
pkill -f "next dev"
```

#### **Database Connection Issues**
```bash
# Check environment variables
cat simchain-relayer/.env

# Reset database
npx prisma db push --force-reset

# Test connection
curl http://localhost:3000/api/test-database
```

#### **Solana Validator Issues**
```bash
# Kill validator
pkill -f "solana-test-validator"

# Start fresh validator
solana-test-validator --reset

# Test connection
curl http://localhost:3000/api/test-connection
```

### **Permission Issues**
```bash
# Fix file permissions
chmod +x scripts/*.sh
chmod +x simchain-relayer/scripts/*.sh

# Fix .next directory permissions
sudo chown -R $(whoami) simchain-relayer/.next
```

## 📊 **API Quick Reference**

### **Core Endpoints**
```bash
# Create wallet
POST /api/create-wallet
{"sim": "+12345678901", "country": "US"}

# Check balance
GET /api/check-balance?sim=%2B12345678901

# Send funds
POST /api/send-funds
{"fromSim": "+12345678901", "toSim": "+98765432109", "amount": 0.1, "pin": "1234"}

# USSD relay
POST /api/relay
{"sessionId": "session123", "msisdn": "+12345678901", "userInput": "1", "serviceCode": "*123#"}
```

### **Testing Endpoints**
```bash
# Test connections
GET /api/test-connection
GET /api/test-database
GET /api/test-encryption

# Admin operations
GET /api/admin/wallets
GET /api/audit-logs
```

## 🔍 **Debugging Tools**

### **Log Locations**
```bash
# Next.js logs (terminal)
npm run dev

# Solana logs
solana logs

# Database logs
npx prisma studio
```

### **Useful Commands**
```bash
# Check running processes
ps aux | grep -E "(node|solana|next)"

# Check port usage
lsof -i :3000
lsof -i :8899

# Check disk space
df -h

# Check memory usage
top -o mem
```

## 🗄️ **Database Schema Quick Reference**

### **Key Tables**
```sql
-- Users table
SELECT * FROM users WHERE sim = '+12345678901';

-- Wallets table
SELECT * FROM wallets WHERE address = 'wallet_address';

-- Transactions table
SELECT * FROM transactions WHERE walletId = 'wallet_id' ORDER BY createdAt DESC;

-- Audit logs
SELECT * FROM audit_logs WHERE action = 'WALLET_CREATED' ORDER BY createdAt DESC;
```

### **Common Queries**
```sql
-- Find user by SIM
SELECT u.*, w.address, w.balance 
FROM users u 
LEFT JOIN wallets w ON u.id = w.userId 
WHERE u.sim = '+12345678901';

-- Recent transactions
SELECT t.*, w.address, u.alias 
FROM transactions t 
JOIN wallets w ON t.walletId = w.id 
JOIN users u ON w.userId = u.id 
ORDER BY t.createdAt DESC 
LIMIT 10;
```

## 🔒 **Security Checklist**

### **Environment Variables**
```bash
# Required variables
DATABASE_URL="postgresql://..."
SOLANA_RPC_URL="http://localhost:8899"
PROGRAM_ID="your_program_id"
ENCRYPTION_KEY="your_encryption_key"

# Optional variables
NODE_ENV="development"
PORT="3000"
```

### **Security Best Practices**
- ✅ Never commit `.env` files
- ✅ Use strong encryption keys
- ✅ Validate all inputs
- ✅ Log security events
- ✅ Use HTTPS in production

## 📱 **USSD Testing**

### **USSD Menu Flow**
```
*123# → Welcome Menu
├── 1. Check Balance
├── 2. Send Money
│   ├── Enter recipient SIM
│   ├── Enter amount
│   └── Enter PIN
├── 3. My Wallet
└── 4. Help
```

### **Test USSD Flow**
```bash
# Test complete USSD flow
node scripts/test-ussd-flow.js

# Test PIN validation
node scripts/test-pin-validation.js

# Test session authentication
node scripts/test-session-auth.js
```

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- ✅ All tests passing
- ✅ Environment variables configured
- ✅ Database migrations applied
- ✅ Program deployed to target cluster
- ✅ Security audit completed

### **Production Environment**
```bash
# Set production environment
NODE_ENV=production
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

# Use production database
DATABASE_URL="postgresql://production_db_url"

# Set strong encryption key
ENCRYPTION_KEY="production_encryption_key"
```

## 📞 **Emergency Contacts**

### **Critical Files to Check**
1. `simchain-relayer/src/config/programId.ts` - Program ID
2. `simchain-relayer/.env` - Environment variables
3. `simchain-relayer/prisma/schema.prisma` - Database schema
4. `programs/simchain_wallet/src/lib.rs` - Program logic

### **Recovery Commands**
```bash
# Full system reset
cd simchain-relayer && ./scripts/full-setup.sh

# Database reset
npx prisma db push --force-reset

# Program redeploy
anchor build && anchor deploy

# Process cleanup
pkill -f "node" && pkill -f "solana"
```

---

## 🎯 **Quick Start for New Developers**

1. **Clone and Setup**
   ```bash
   git clone <repository>
   cd SIMChain/simchain-relayer
   ./scripts/full-setup.sh
   ```

2. **Verify Installation**
   ```bash
   curl http://localhost:3000/api/test-connection
   curl http://localhost:3000/api/test-database
   ```

3. **Create Test Wallet**
   ```bash
   curl -X POST http://localhost:3000/api/create-wallet \
     -H "Content-Type: application/json" \
     -d '{"sim": "+12345678901", "country": "US"}'
   ```

4. **Start Development**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

---

**This quick reference provides essential information for efficient development and troubleshooting of the SIMChain system.** 