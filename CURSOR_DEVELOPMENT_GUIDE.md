# 🚀 SIMChain Development Guide for Cursor

## 📋 **Project Overview**

SIMChain is a blockchain-based SIM card management platform built on Solana that enables users to create wallets, manage funds, and interact through USSD (Unstructured Supplementary Service Data) interfaces. The system consists of a Solana program (smart contract) and a Next.js relayer application.

### **Key Technologies**
- **Blockchain**: Solana with Anchor framework
- **Backend**: Next.js 15 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Frontend**: React with Tailwind CSS
- **Testing**: Jest and custom test scripts

## 🏗️ **Architecture Overview**

```
SIMChain/
├── programs/simchain_wallet/     # Solana smart contract
├── simchain-relayer/             # Next.js backend/frontend
├── scripts/                      # Utility scripts
├── idl/                         # Interface definitions
└── docs/                        # Documentation
```

### **Core Components**

1. **Solana Program** (`programs/simchain_wallet/`)
   - Handles wallet creation, fund transfers, PIN validation
   - Uses Anchor framework for Solana development
   - Manages on-chain state and program logic

2. **Relayer Application** (`simchain-relayer/`)
   - Next.js application serving as API backend and frontend
   - Handles database operations, encryption, and user management
   - Provides USSD interface simulation

3. **Database Layer** (`simchain-relayer/prisma/`)
   - PostgreSQL database with Prisma ORM
   - Stores user data, wallet information, and audit logs
   - Handles migrations and schema management

## 📁 **Detailed File Structure**

### **Root Directory**
```
SIMChain/
├── Anchor.toml                   # Anchor configuration
├── Cargo.toml                    # Rust workspace configuration
├── package.json                  # Root package.json (minimal)
├── tsconfig.json                 # TypeScript configuration
├── .env                          # Environment variables
├── .gitignore                    # Git ignore rules
└── README.md                     # Main project documentation
```

### **Solana Program** (`programs/simchain_wallet/`)
```
programs/simchain_wallet/
├── Cargo.toml                    # Program dependencies
└── src/
    └── lib.rs                    # Main program logic
```

**Key Features:**
- Wallet creation and management
- Fund transfers between wallets
- PIN validation and security
- Program state management

### **Relayer Application** (`simchain-relayer/`)
```
simchain-relayer/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   ├── admin/                # Admin interface
│   │   ├── ussd/                 # USSD simulation
│   │   └── page.tsx              # Main dashboard
│   ├── lib/                      # Core libraries
│   ├── config/                   # Configuration files
│   └── idl/                      # Interface definitions
├── prisma/                       # Database schema and migrations
├── scripts/                      # Development scripts
├── public/                       # Static assets
└── package.json                  # Dependencies
```

### **API Routes** (`simchain-relayer/src/app/api/`)
```
api/
├── create-wallet/                # Wallet creation
├── check-balance/                # Balance checking
├── send-funds/                   # Fund transfers
├── deposit-funds/                # Fund deposits
├── set-alias/                    # Alias management
├── validate-pin/                 # PIN validation
├── relay/                        # USSD relay
├── admin/                        # Admin operations
├── audit-logs/                   # Security logging
├── test-*                        # Testing endpoints
└── wallet-exists/                # Wallet validation
```

### **Core Libraries** (`simchain-relayer/src/lib/`)
```
lib/
├── database.ts                   # Database operations
├── simchain-client.ts            # Solana client
├── encryption.ts                 # Encryption utilities
├── audit-log.ts                  # Audit logging
├── alias-generator.ts            # Alias generation
└── validation.ts                 # Input validation
```

### **Scripts** (`scripts/` and `simchain-relayer/scripts/`)
```
scripts/
├── full-setup.sh                 # Complete setup script
├── clean-validator.sh            # Validator cleanup
├── fix-permissions.sh            # Permission fixes
├── migrate-aliases.ts            # Database migrations
├── register-admin.ts             # Admin registration
└── test-*.js                     # Test scripts
```

## 🔧 **Development Workflow**

### **1. Initial Setup**
```bash
# Clone and setup
git clone <repository>
cd SIMChain

# Run full setup (recommended)
cd simchain-relayer
./scripts/full-setup.sh
```

### **2. Development Commands**

#### **Solana Program Development**
```bash
# Build program
anchor build

# Deploy program
anchor deploy

# Run tests
anchor test
```

#### **Relayer Development**
```bash
cd simchain-relayer

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Database operations
npx prisma generate
npx prisma db push
npx prisma studio
```

### **3. Key Configuration Files**

#### **Program ID Configuration**
```typescript
// simchain-relayer/src/config/programId.ts
export const PROGRAM_ID = 'your_program_id_here';
```

#### **Environment Variables**
```bash
# .env
DATABASE_URL="postgresql://..."
SOLANA_RPC_URL="http://localhost:8899"
PROGRAM_ID="your_program_id"
ENCRYPTION_KEY="your_encryption_key"
```

## 🗄️ **Database Schema**

### **Key Tables**
- `users` - User information and SIM data
- `wallets` - Wallet addresses and metadata
- `transactions` - Transaction history
- `audit_logs` - Security audit trail
- `aliases` - User-friendly aliases

### **Prisma Schema Location**
```
simchain-relayer/prisma/schema.prisma
```

## 🔌 **API Endpoints**

### **Core Wallet Operations**
- `POST /api/create-wallet` - Create new wallet
- `GET /api/check-balance` - Check wallet balance
- `POST /api/send-funds` - Transfer funds
- `POST /api/deposit-funds` - Deposit funds

### **User Management**
- `POST /api/set-alias` - Set user alias
- `POST /api/validate-pin` - Validate PIN
- `GET /api/wallet-exists` - Check wallet existence

### **Admin Operations**
- `GET /api/admin/wallets` - List all wallets
- `GET /api/audit-logs` - View audit logs
- `POST /api/init-program` - Initialize program

### **Testing Endpoints**
- `GET /api/test-connection` - Test Solana connection
- `GET /api/test-database` - Test database connection
- `GET /api/test-encryption` - Test encryption

## 🔒 **Security Features**

### **Encryption**
- Phone number encryption using AES-256
- PIN validation with secure hashing
- Audit logging for security monitoring

### **Access Control**
- Admin-only endpoints for sensitive operations
- Input validation and sanitization
- Rate limiting and request validation

## 🧪 **Testing Strategy**

### **Automated Tests**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
```

### **Manual Testing Scripts**
```bash
# Test complete PIN flow
node scripts/test-complete-pin-flow.js

# Test USSD flow
node scripts/test-ussd-flow.js

# Test session authentication
node scripts/test-session-auth.js
```

### **API Testing**
```bash
# Test all endpoints
node scripts/test-ussd-endpoints.js

# Test PIN validation
node scripts/test-pin-validation.js
```

## 🚀 **Deployment**

### **Development Environment**
```bash
# Start local validator
solana-test-validator

# Deploy program
anchor deploy

# Start relayer
cd simchain-relayer && npm run dev
```

### **Production Considerations**
- Use production Solana cluster
- Configure proper environment variables
- Set up monitoring and logging
- Implement proper backup strategies

## 🔍 **Debugging and Troubleshooting**

### **Common Issues**

#### **Program ID Mismatch**
```bash
# Check program ID in config
cat simchain-relayer/src/config/programId.ts

# Verify deployment
anchor deploy --provider.cluster localnet
```

#### **Database Issues**
```bash
# Reset database
npx prisma db push --force-reset

# Check migrations
npx prisma migrate status
```

#### **Port Conflicts**
```bash
# Kill processes on port 3000
lsof -ti :3000 | xargs kill -9

# Kill Solana validator
pkill -f "solana-test-validator"
```

### **Logging and Monitoring**
- Check browser console for frontend errors
- Monitor server logs in terminal
- Use Prisma Studio for database inspection
- Check Solana logs for blockchain issues

## 📚 **Key Files to Understand**

### **Critical Files for Development**

1. **`programs/simchain_wallet/src/lib.rs`**
   - Main Solana program logic
   - Wallet creation and management
   - Transaction processing

2. **`simchain-relayer/src/lib/simchain-client.ts`**
   - Solana client implementation
   - Program interaction logic
   - Transaction building

3. **`simchain-relayer/src/lib/database.ts`**
   - Database operations
   - User and wallet management
   - Transaction logging

4. **`simchain-relayer/scripts/full-setup.sh`**
   - Complete setup automation
   - Process management
   - Testing and validation

5. **`simchain-relayer/prisma/schema.prisma`**
   - Database schema definition
   - Table relationships
   - Migration management

## 🎯 **Development Best Practices**

### **Code Organization**
- Keep API routes focused and single-purpose
- Use TypeScript for type safety
- Implement proper error handling
- Follow consistent naming conventions

### **Testing**
- Write tests for new features
- Test both success and failure scenarios
- Use integration tests for API endpoints
- Maintain test coverage

### **Security**
- Validate all inputs
- Encrypt sensitive data
- Log security events
- Use environment variables for secrets

### **Performance**
- Optimize database queries
- Implement caching where appropriate
- Monitor resource usage
- Use connection pooling

## 🔄 **Version Control**

### **Branch Strategy**
- `main` - Production-ready code
- `test-and-fix` - Current development branch
- Feature branches for new development

### **Commit Conventions**
- Use conventional commit format
- Group related changes together
- Write descriptive commit messages
- Include issue references

## 📞 **Support and Resources**

### **Documentation**
- `README.md` - Main project overview
- `API_REFERENCE.md` - API documentation
- `QUICK_START_GUIDE.md` - Quick setup guide
- `SECURITY_CONSIDERATIONS.md` - Security guidelines

### **External Resources**
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

## 🎉 **Getting Started Checklist**

For a new developer joining the project:

1. ✅ **Environment Setup**
   - Install Node.js, Rust, Solana CLI
   - Clone repository and run `./scripts/full-setup.sh`

2. ✅ **Understanding Architecture**
   - Review this guide and project structure
   - Understand Solana program and relayer interaction
   - Familiarize with database schema

3. ✅ **Development Workflow**
   - Set up development environment
   - Run tests and verify functionality
   - Make small changes and test thoroughly

4. ✅ **Production Readiness**
   - Review security considerations
   - Test deployment process
   - Understand monitoring and logging

---

**This guide should provide everything needed to understand and continue development on the SIMChain project. The system is production-ready with comprehensive testing, security features, and automated setup processes.** 