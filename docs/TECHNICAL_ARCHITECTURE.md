# 🏗️ SIMChain Technical Architecture

## 📋 **System Overview**

SIMChain is a distributed system consisting of a Solana blockchain program and a Next.js relayer application that work together to provide SIM card management services. The system enables users to create wallets, manage funds, and interact through USSD interfaces while maintaining security and auditability.

## 🏛️ **High-Level Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   USSD Client   │    │   Web Client    │    │  Admin Client   │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Next.js Relayer        │
                    │  (simchain-relayer)       │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   API Routes        │  │
                    │  │   - /api/*          │  │
                    │  └─────────────────────┘  │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   Business Logic    │  │
                    │  │   - Database Ops    │  │
                    │  │   - Encryption      │  │
                    │  │   - Validation      │  │
                    │  └─────────────────────┘  │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   PostgreSQL Database     │
                    │   - Users                │
                    │   - Wallets              │
                    │   - Transactions         │
                    │   - Audit Logs           │
                    └───────────────────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Solana Client           │
                    │   - Connection            │
                    │   - Transaction Building  │
                    │   - Program Interaction   │
                    └─────────────┬─────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │   Solana Blockchain       │
                    │   - SIMChain Program      │
                    │   - Wallet PDAs           │
                    │   - Program State         │
                    └───────────────────────────┘
```

## 🔧 **Component Details**

### **1. Solana Program (`programs/simchain_wallet/`)**

#### **Program Structure**
```rust
// programs/simchain_wallet/src/lib.rs
use anchor_lang::prelude::*;

declare_id!("your_program_id");

#[program]
pub mod simchain_wallet {
    use super::*;

    pub fn create_wallet(ctx: Context<CreateWallet>, sim: String) -> Result<()> {
        // Wallet creation logic
    }

    pub fn send_funds(ctx: Context<SendFunds>, amount: u64) -> Result<()> {
        // Fund transfer logic
    }

    pub fn validate_pin(ctx: Context<ValidatePin>, pin: String) -> Result<()> {
        // PIN validation logic
    }
}
```

#### **Key Features**
- **Wallet Creation**: Creates Program Derived Addresses (PDAs) for wallets
- **Fund Management**: Handles SOL transfers between wallets
- **PIN Validation**: On-chain PIN verification for security
- **State Management**: Manages program state and user data

#### **Data Structures**
```rust
#[account]
pub struct Wallet {
    pub authority: Pubkey,
    pub sim: String,
    pub balance: u64,
    pub created_at: i64,
}

#[account]
pub struct Config {
    pub admin: Pubkey,
    pub fee_rate: u64,
    pub min_balance: u64,
}
```

### **2. Next.js Relayer (`simchain-relayer/`)**

#### **Application Structure**
```
simchain-relayer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes (REST endpoints)
│   │   ├── admin/             # Admin interface (React)
│   │   ├── ussd/              # USSD simulation (React)
│   │   └── page.tsx           # Main dashboard
│   ├── lib/                   # Core business logic
│   │   ├── database.ts        # Database operations
│   │   ├── simchain-client.ts # Solana client
│   │   ├── encryption.ts      # Encryption utilities
│   │   └── validation.ts      # Input validation
│   └── config/                # Configuration
└── prisma/                    # Database schema
```

#### **API Layer Design**
- **RESTful Endpoints**: Standard HTTP API for client interactions
- **Middleware**: Authentication, validation, and error handling
- **Rate Limiting**: Protection against abuse
- **CORS**: Cross-origin resource sharing configuration

#### **Business Logic Layer**
```typescript
// simchain-relayer/src/lib/simchain-client.ts
export class SimchainClient {
    private connection: Connection;
    private program: Program<SimchainWallet>;

    async createWallet(sim: string): Promise<string> {
        // Wallet creation logic
    }

    async sendFunds(from: string, to: string, amount: number): Promise<string> {
        // Fund transfer logic
    }

    async validatePin(wallet: string, pin: string): Promise<boolean> {
        // PIN validation logic
    }
}
```

### **3. Database Layer (`prisma/`)**

#### **Schema Design**
```prisma
// simchain-relayer/prisma/schema.prisma
model User {
    id        String   @id @default(cuid())
    sim       String   @unique
    country   String
    alias     String?
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    
    wallet Wallet?
}

model Wallet {
    id        String   @id @default(cuid())
    address   String   @unique
    userId    String   @unique
    user      User     @relation(fields: [userId], references: [id])
    balance   Float    @default(0)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    
    transactions Transaction[]
}

model Transaction {
    id        String   @id @default(cuid())
    walletId  String
    wallet    Wallet   @relation(fields: [walletId], references: [id])
    type      String   // "SEND" | "RECEIVE" | "DEPOSIT"
    amount    Float
    txHash    String?
    createdAt DateTime @default(now())
}

model AuditLog {
    id        String   @id @default(cuid())
    action    String
    userId    String?
    details   Json
    ipAddress String?
    createdAt DateTime @default(now())
}
```

#### **Key Features**
- **User Management**: SIM-based user identification
- **Wallet Tracking**: Blockchain wallet address management
- **Transaction History**: Complete audit trail
- **Security Logging**: Comprehensive audit logs

## 🔄 **Data Flow**

### **1. Wallet Creation Flow**
```
1. Client Request → /api/create-wallet
2. Validation → Input sanitization and validation
3. Database Check → Verify SIM doesn't exist
4. Solana Interaction → Create wallet PDA
5. Database Storage → Store wallet information
6. Response → Return wallet address and alias
```

### **2. Fund Transfer Flow**
```
1. Client Request → /api/send-funds
2. Validation → Check sender balance and recipient
3. PIN Validation → Verify user PIN
4. Solana Transaction → Build and send transaction
5. Database Update → Update balances and log transaction
6. Response → Return transaction hash
```

### **3. USSD Interaction Flow**
```
1. USSD Request → /api/relay
2. Session Management → Create or retrieve session
3. Menu Processing → Handle USSD menu logic
4. Database Operations → Query/update user data
5. Solana Operations → Blockchain interactions
6. USSD Response → Format response for USSD client
```

## 🔒 **Security Architecture**

### **1. Encryption Layer**
```typescript
// simchain-relayer/src/lib/encryption.ts
export class EncryptionService {
    private algorithm = 'aes-256-gcm';
    private key: Buffer;

    encrypt(text: string): string {
        // AES-256-GCM encryption
    }

    decrypt(encryptedText: string): string {
        // AES-256-GCM decryption
    }
}
```

### **2. PIN Security**
- **Hashing**: PINs are hashed using bcrypt
- **Salt**: Unique salt per user
- **Rate Limiting**: PIN attempts are rate-limited
- **Audit Logging**: All PIN attempts are logged

### **3. Access Control**
- **Admin Endpoints**: Protected admin-only operations
- **Input Validation**: Comprehensive input sanitization
- **Session Management**: Secure session handling
- **CORS**: Proper cross-origin configuration

## 🗄️ **Database Design**

### **1. Normalization Strategy**
- **First Normal Form**: Atomic values, no repeating groups
- **Second Normal Form**: No partial dependencies
- **Third Normal Form**: No transitive dependencies

### **2. Indexing Strategy**
```sql
-- Primary indexes
CREATE UNIQUE INDEX idx_users_sim ON users(sim);
CREATE UNIQUE INDEX idx_wallets_address ON wallets(address);
CREATE UNIQUE INDEX idx_wallets_user_id ON wallets(user_id);

-- Performance indexes
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### **3. Migration Strategy**
- **Versioned Migrations**: Each schema change is versioned
- **Rollback Support**: Migrations can be rolled back
- **Data Preservation**: Migrations preserve existing data
- **Testing**: Migrations are tested before deployment

## 🔌 **API Design**

### **1. RESTful Endpoints**
```typescript
// Core wallet operations
POST   /api/create-wallet     // Create new wallet
GET    /api/check-balance     // Check wallet balance
POST   /api/send-funds        // Transfer funds
POST   /api/deposit-funds     // Deposit funds

// User management
POST   /api/set-alias         // Set user alias
POST   /api/validate-pin      // Validate PIN
GET    /api/wallet-exists     // Check wallet existence

// Admin operations
GET    /api/admin/wallets     // List all wallets
GET    /api/audit-logs        // View audit logs
POST   /api/init-program      // Initialize program

// Testing endpoints
GET    /api/test-connection   // Test Solana connection
GET    /api/test-database     // Test database connection
GET    /api/test-encryption   // Test encryption
```

### **2. Response Format**
```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface WalletResponse {
    address: string;
    alias: string;
    balance: number;
    sim: string;
}
```

### **3. Error Handling**
```typescript
// Standard error responses
{
    "success": false,
    "error": "VALIDATION_ERROR",
    "message": "Invalid SIM number format",
    "details": {
        "field": "sim",
        "value": "invalid-sim"
    }
}
```

## 🧪 **Testing Architecture**

### **1. Test Pyramid**
```
        /\
       /  \     E2E Tests (Few)
      /____\    
     /      \   Integration Tests (Some)
    /________\  
   /          \  Unit Tests (Many)
  /____________\
```

### **2. Test Categories**
- **Unit Tests**: Individual function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete user flow testing
- **Performance Tests**: Load and stress testing

### **3. Test Automation**
```bash
# Automated test scripts
scripts/test-complete-pin-flow.js
scripts/test-ussd-flow.js
scripts/test-session-auth.js
scripts/test-ussd-endpoints.js
```

## 🚀 **Deployment Architecture**

### **1. Development Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Client  │    │  Next.js Dev    │    │ Solana Validator│
│                 │◄──►│   (Port 3000)   │◄──►│   (Port 8899)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **2. Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │  Next.js App    │    │  Solana Cluster │
│                 │◄──►│   (Multiple)    │◄──►│   (Production)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │  PostgreSQL DB    │
                    │   (Production)    │
                    └───────────────────┘
```

### **3. Scaling Considerations**
- **Horizontal Scaling**: Multiple Next.js instances
- **Database Scaling**: Read replicas and connection pooling
- **Caching**: Redis for session and data caching
- **CDN**: Static asset delivery optimization

## 📊 **Monitoring and Observability**

### **1. Logging Strategy**
```typescript
// Structured logging
logger.info('Wallet created', {
    walletAddress: address,
    sim: sim,
    userId: userId,
    timestamp: new Date().toISOString()
});
```

### **2. Metrics Collection**
- **Application Metrics**: Response times, error rates
- **Database Metrics**: Query performance, connection usage
- **Blockchain Metrics**: Transaction success rates, gas usage
- **Business Metrics**: User activity, transaction volumes

### **3. Alerting**
- **Error Rate Alerts**: High error rates trigger alerts
- **Performance Alerts**: Slow response times
- **Security Alerts**: Suspicious activity detection
- **Business Alerts**: Unusual transaction patterns

## 🔧 **Configuration Management**

### **1. Environment Variables**
```bash
# Database
DATABASE_URL="postgresql://..."

# Solana
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
PROGRAM_ID="your_program_id"

# Security
ENCRYPTION_KEY="your_encryption_key"
JWT_SECRET="your_jwt_secret"

# Application
NODE_ENV="production"
PORT="3000"
```

### **2. Configuration Validation**
```typescript
// Environment validation
const requiredEnvVars = [
    'DATABASE_URL',
    'SOLANA_RPC_URL',
    'PROGRAM_ID',
    'ENCRYPTION_KEY'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        throw new Error(`Missing required environment variable: ${varName}`);
    }
});
```

## 🎯 **Performance Optimization**

### **1. Database Optimization**
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries and efficient joins
- **Caching**: Redis caching for frequently accessed data
- **Read Replicas**: Separate read and write operations

### **2. Application Optimization**
- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Minimized and compressed assets
- **Caching**: HTTP caching and service worker caching
- **CDN**: Global content delivery

### **3. Blockchain Optimization**
- **Transaction Batching**: Group multiple operations
- **Fee Optimization**: Optimal transaction fees
- **Connection Pooling**: Efficient RPC connections
- **Retry Logic**: Automatic retry for failed transactions

---

## 📚 **Key Technical Decisions**

### **1. Technology Choices**
- **Solana**: High-performance blockchain platform
- **Next.js**: Full-stack React framework
- **Prisma**: Type-safe database ORM
- **PostgreSQL**: Reliable relational database

### **2. Architecture Patterns**
- **Layered Architecture**: Separation of concerns
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Middleware Pattern**: Cross-cutting concerns

### **3. Security Patterns**
- **Defense in Depth**: Multiple security layers
- **Principle of Least Privilege**: Minimal access rights
- **Fail Secure**: Secure by default
- **Audit Trail**: Complete activity logging

---

**This technical architecture provides a comprehensive understanding of the SIMChain system design, enabling developers to understand the system's complexity and make informed decisions about future development.** 