# 🔌 SIMChain Comprehensive API Reference

## 📋 **Overview**

This document provides a complete reference for all SIMChain API endpoints, including request/response formats, authentication, error handling, and usage examples.

## 🔑 **Authentication & Security**

### **API Key (Optional)**
Some endpoints support API key authentication via header:
```http
X-API-Key: your_api_key_here
```

### **Session Management**
USSD sessions are managed automatically via session tokens in cookies.

### **Rate Limiting**
- **Standard**: 100 requests per minute per IP
- **USSD**: 50 requests per minute per session
- **Admin**: 1000 requests per minute per API key

## 📊 **Response Format**

All API responses follow this standard format:

```typescript
interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp?: string;
}
```

### **Success Response**
```json
{
    "success": true,
    "data": {
        // Response data here
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

### **Error Response**
```json
{
    "success": false,
    "error": "ERROR_CODE",
    "message": "Human readable error message",
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🏦 **Wallet Management Endpoints**

### **1. Create Wallet**
**Endpoint:** `POST /api/create-wallet`

**Description:** Creates a new wallet for a SIM number.

**Request Body:**
```typescript
interface CreateWalletRequest {
    sim: string;           // SIM number (e.g., "+12345678901")
    country?: string;      // Country code (e.g., "US")
}
```

**Response:**
```typescript
interface CreateWalletResponse {
    walletAddress: string; // Solana wallet address
    alias: string;         // Generated alias
    sim: string;          // SIM number
    country: string;      // Country code
    createdAt: string;    // ISO timestamp
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/create-wallet \
  -H "Content-Type: application/json" \
  -d '{
    "sim": "+12345678901",
    "country": "US"
  }'
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "walletAddress": "BKrNbFUgnFbsp3wC3fxwGAKhbPPh9ArS7PM2pWHCrLGb",
        "alias": "IndigoRoadrunner",
        "sim": "+12345678901",
        "country": "US",
        "createdAt": "2024-01-15T10:30:00Z"
    }
}
```

**Error Codes:**
- `SIM_ALREADY_EXISTS` - SIM number already has a wallet
- `INVALID_SIM_FORMAT` - Invalid SIM number format
- `PROGRAM_ERROR` - Solana program error

### **2. Check Balance**
**Endpoint:** `GET /api/check-balance`

**Description:** Retrieves wallet balance for a SIM number.

**Query Parameters:**
```typescript
interface CheckBalanceRequest {
    sim: string;           // SIM number
}
```

**Response:**
```typescript
interface CheckBalanceResponse {
    walletAddress: string; // Wallet address
    balance: number;       // Balance in SOL
    alias: string;         // User alias
    sim: string;          // SIM number
    lastUpdated: string;   // Last balance update
}
```

**Example Request:**
```bash
curl "http://localhost:3000/api/check-balance?sim=%2B12345678901"
```

**Example Response:**
```json
{
    "success": true,
    "data": {
        "walletAddress": "BKrNbFUgnFbsp3wC3fxwGAKhbPPh9ArS7PM2pWHCrLGb",
        "balance": 1.5,
        "alias": "IndigoRoadrunner",
        "sim": "+12345678901",
        "lastUpdated": "2024-01-15T10:30:00Z"
    }
}
```

### **3. Send Funds**
**Endpoint:** `POST /api/send-funds`

**Description:** Transfers funds from one wallet to another.

**Request Body:**
```typescript
interface SendFundsRequest {
    fromSim: string;       // Sender SIM number
    toSim: string;         // Recipient SIM number
    amount: number;        // Amount in SOL
    pin: string;          // Sender PIN
}
```

**Response:**
```typescript
interface SendFundsResponse {
    transactionHash: string; // Solana transaction hash
    fromAddress: string;     // Sender wallet address
    toAddress: string;       // Recipient wallet address
    amount: number;          // Transfer amount
    fee: number;            // Transaction fee
    timestamp: string;       // Transaction timestamp
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/send-funds \
  -H "Content-Type: application/json" \
  -d '{
    "fromSim": "+12345678901",
    "toSim": "+98765432109",
    "amount": 0.1,
    "pin": "1234"
  }'
```

**Error Codes:**
- `INSUFFICIENT_BALANCE` - Insufficient funds
- `INVALID_PIN` - Incorrect PIN
- `WALLET_NOT_FOUND` - Recipient wallet not found
- `SAME_WALLET` - Cannot send to same wallet

### **4. Deposit Funds**
**Endpoint:** `POST /api/deposit-funds`

**Description:** Deposits funds into a wallet (admin function).

**Request Body:**
```typescript
interface DepositFundsRequest {
    sim: string;           // SIM number
    amount: number;        // Amount in SOL
    adminKey?: string;     // Admin API key
}
```

**Response:**
```typescript
interface DepositFundsResponse {
    transactionHash: string; // Solana transaction hash
    walletAddress: string;   // Wallet address
    amount: number;          // Deposit amount
    newBalance: number;      // New balance after deposit
    timestamp: string;       // Transaction timestamp
}
```

## 👤 **User Management Endpoints**

### **5. Set Alias**
**Endpoint:** `POST /api/set-alias`

**Description:** Sets or updates user alias.

**Request Body:**
```typescript
interface SetAliasRequest {
    sim: string;           // SIM number
    alias: string;         // New alias
    pin: string;          // User PIN
}
```

**Response:**
```typescript
interface SetAliasResponse {
    sim: string;          // SIM number
    oldAlias: string;     // Previous alias
    newAlias: string;     // New alias
    updatedAt: string;    // Update timestamp
}
```

### **6. Validate PIN**
**Endpoint:** `POST /api/validate-pin`

**Description:** Validates user PIN for authentication.

**Request Body:**
```typescript
interface ValidatePinRequest {
    sim: string;           // SIM number
    pin: string;          // PIN to validate
}
```

**Response:**
```typescript
interface ValidatePinResponse {
    isValid: boolean;      // PIN validation result
    attemptsRemaining: number; // Remaining attempts
    lockedUntil?: string;  // Lock timestamp if locked
}
```

### **7. Wallet Exists**
**Endpoint:** `GET /api/wallet-exists`

**Description:** Checks if a wallet exists for a SIM number.

**Query Parameters:**
```typescript
interface WalletExistsRequest {
    sim: string;           // SIM number
}
```

**Response:**
```typescript
interface WalletExistsResponse {
    exists: boolean;       // Wallet existence
    walletAddress?: string; // Wallet address if exists
    alias?: string;        // User alias if exists
}
```

## 🔄 **USSD Endpoints**

### **8. USSD Relay**
**Endpoint:** `POST /api/relay`

**Description:** Handles USSD requests and responses.

**Request Body:**
```typescript
interface USSDRequest {
    sessionId: string;     // USSD session ID
    msisdn: string;        // User phone number
    userInput: string;     // User input
    serviceCode: string;   // USSD service code
}
```

**Response:**
```typescript
interface USSDResponse {
    sessionId: string;     // Session ID
    message: string;       // USSD message
    shouldEnd: boolean;    // End session flag
    menuOptions?: string[]; // Menu options
}
```

**Example USSD Flow:**
```bash
# Initial USSD request
curl -X POST http://localhost:3000/api/relay \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session123",
    "msisdn": "+12345678901",
    "userInput": "",
    "serviceCode": "*906#"
  }'

# Response: Welcome menu
{
    "success": true,
    "data": {
        "sessionId": "session123",
        "message": "Welcome to SIMChain\n1. Check Balance\n2. Send Money\n3. My Wallet",
        "shouldEnd": false
    }
}

# User selects option 1
curl -X POST http://localhost:3000/api/relay \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session123",
    "msisdn": "+12345678901",
    "userInput": "1",
    "serviceCode": "*906#"
  }'
```

## 🔧 **Admin Endpoints**

### **9. List All Wallets**
**Endpoint:** `GET /api/admin/wallets`

**Description:** Lists all wallets (admin only).

**Headers:**
```http
X-API-Key: your_admin_api_key
```

**Query Parameters:**
```typescript
interface ListWalletsRequest {
    page?: number;         // Page number (default: 1)
    limit?: number;        // Items per page (default: 20)
    search?: string;       // Search by SIM or alias
}
```

**Response:**
```typescript
interface ListWalletsResponse {
    wallets: Wallet[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
```

### **10. Audit Logs**
**Endpoint:** `GET /api/audit-logs`

**Description:** Retrieves audit logs (admin only).

**Headers:**
```http
X-API-Key: your_admin_api_key
```

**Query Parameters:**
```typescript
interface AuditLogsRequest {
    page?: number;         // Page number
    limit?: number;        // Items per page
    action?: string;       // Filter by action
    userId?: string;       // Filter by user
    startDate?: string;    // Start date (ISO)
    endDate?: string;      // End date (ISO)
}
```

**Response:**
```typescript
interface AuditLogsResponse {
    logs: AuditLog[];
    pagination: PaginationInfo;
}

interface AuditLog {
    id: string;
    action: string;
    userId?: string;
    details: any;
    ipAddress?: string;
    createdAt: string;
}
```

### **11. Initialize Program**
**Endpoint:** `POST /api/init-program`

**Description:** Initializes the Solana program (admin only).

**Headers:**
```http
X-API-Key: your_admin_api_key
```

**Response:**
```typescript
interface InitProgramResponse {
    programId: string;     // Program ID
    configAddress: string; // Config PDA address
    registryAddress: string; // Registry PDA address
    adminAddress: string;  // Admin wallet address
    timestamp: string;     // Initialization timestamp
}
```

## 🧪 **Testing Endpoints**

### **12. Test Connection**
**Endpoint:** `GET /api/test-connection`

**Description:** Tests Solana connection.

**Response:**
```typescript
interface TestConnectionResponse {
    connected: boolean;    // Connection status
    rpcUrl: string;        // RPC URL used
    slot: number;          // Current slot
    timestamp: string;     // Test timestamp
}
```

### **13. Test Database**
**Endpoint:** `GET /api/test-database`

**Description:** Tests database connection.

**Response:**
```typescript
interface TestDatabaseResponse {
    connected: boolean;    // Connection status
    databaseUrl: string;   // Database URL (masked)
    tables: string[];      // Available tables
    timestamp: string;     // Test timestamp
}
```

### **14. Test Encryption**
**Endpoint:** `GET /api/test-encryption`

**Description:** Tests encryption functionality.

**Response:**
```typescript
interface TestEncryptionResponse {
    working: boolean;      // Encryption status
    algorithm: string;     // Encryption algorithm
    testData: string;      // Test data used
    encrypted: string;     // Encrypted result
    decrypted: string;     // Decrypted result
    timestamp: string;     // Test timestamp
}
```

## 🔍 **Utility Endpoints**

### **15. Alias Preview**
**Endpoint:** `GET /api/alias-preview`

**Description:** Generates a preview of available aliases.

**Query Parameters:**
```typescript
interface AliasPreviewRequest {
    count?: number;        // Number of aliases to generate (default: 5)
}
```

**Response:**
```typescript
interface AliasPreviewResponse {
    aliases: string[];     // Generated aliases
    count: number;         // Number of aliases
    timestamp: string;     // Generation timestamp
}
```

### **16. Update Alias**
**Endpoint:** `POST /api/update-alias`

**Description:** Updates user alias (alternative to set-alias).

**Request Body:**
```typescript
interface UpdateAliasRequest {
    sim: string;           // SIM number
    newAlias: string;      // New alias
    pin: string;          // User PIN
}
```

## 📊 **Error Handling**

### **Standard Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `AUTHENTICATION_ERROR` | Authentication required | 401 |
| `AUTHORIZATION_ERROR` | Insufficient permissions | 403 |
| `NOT_FOUND` | Resource not found | 404 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Server error | 500 |
| `PROGRAM_ERROR` | Solana program error | 500 |
| `DATABASE_ERROR` | Database error | 500 |

### **Business Logic Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `SIM_ALREADY_EXISTS` | SIM number already has wallet | 409 |
| `WALLET_NOT_FOUND` | Wallet not found | 404 |
| `INSUFFICIENT_BALANCE` | Insufficient funds | 400 |
| `INVALID_PIN` | Incorrect PIN | 401 |
| `PIN_LOCKED` | PIN temporarily locked | 423 |
| `SAME_WALLET` | Cannot send to same wallet | 400 |
| `INVALID_AMOUNT` | Invalid transfer amount | 400 |

### **Error Response Example**
```json
{
    "success": false,
    "error": "INSUFFICIENT_BALANCE",
    "message": "Insufficient balance for transfer. Required: 0.1 SOL, Available: 0.05 SOL",
    "details": {
        "required": 0.1,
        "available": 0.05,
        "shortfall": 0.05
    },
    "timestamp": "2024-01-15T10:30:00Z"
}
```

## 🔧 **Rate Limiting**

### **Rate Limit Headers**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642234567
```

### **Rate Limit Response**
```json
{
    "success": false,
    "error": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60
}
```

## 📱 **USSD Integration**

### **USSD Menu Structure**
```
*123# → Welcome Menu
├── 1. Check Balance
├── 2. Send Money
│   ├── Enter recipient SIM
│   ├── Enter amount
│   └── Enter PIN
├── 3. My Wallet
│   ├── Wallet Address
│   ├── Change Alias
│   └── Transaction History
└── 4. Help
```

### **USSD Response Format**
```typescript
interface USSDMenuResponse {
    message: string;       // Display message
    shouldEnd: boolean;    // End session
    menuOptions?: string[]; // Available options
    inputRequired?: boolean; // Requires user input
    inputType?: 'number' | 'text' | 'pin'; // Input type
}
```

## 🔒 **Security Considerations**

### **Input Validation**
- All inputs are validated and sanitized
- SIM numbers must match international format
- PINs must be 4-6 digits
- Amounts must be positive numbers

### **Encryption**
- Phone numbers are encrypted in database
- PINs are hashed using bcrypt
- API keys are validated and logged

### **Audit Logging**
- All sensitive operations are logged
- Failed authentication attempts are tracked
- Transaction history is maintained

## 📚 **Usage Examples**

### **Complete Wallet Creation Flow**
```bash
# 1. Create wallet
curl -X POST http://localhost:3000/api/create-wallet \
  -H "Content-Type: application/json" \
  -d '{"sim": "+12345678901", "country": "US"}'

# 2. Check balance
curl "http://localhost:3000/api/check-balance?sim=%2B12345678901"

# 3. Set alias
curl -X POST http://localhost:3000/api/set-alias \
  -H "Content-Type: application/json" \
  -d '{"sim": "+12345678901", "alias": "MyWallet", "pin": "1234"}'
```

### **Complete Fund Transfer Flow**
```bash
# 1. Check sender balance
curl "http://localhost:3000/api/check-balance?sim=%2B12345678901"

# 2. Send funds
curl -X POST http://localhost:3000/api/send-funds \
  -H "Content-Type: application/json" \
  -d '{
    "fromSim": "+12345678901",
    "toSim": "+98765432109",
    "amount": 0.1,
    "pin": "1234"
  }'

# 3. Verify transfer
curl "http://localhost:3000/api/check-balance?sim=%2B12345678901"
curl "http://localhost:3000/api/check-balance?sim=%2B98765432109"
```

### **Admin Operations**
```bash
# List all wallets
curl -H "X-API-Key: your_admin_key" \
  "http://localhost:3000/api/admin/wallets?page=1&limit=10"

# View audit logs
curl -H "X-API-Key: your_admin_key" \
  "http://localhost:3000/api/audit-logs?action=WALLET_CREATED"

# Initialize program
curl -X POST http://localhost:3000/api/init-program \
  -H "X-API-Key: your_admin_key"
```

---

**This comprehensive API reference provides all the information needed to integrate with the SIMChain system, including detailed request/response formats, error handling, and practical usage examples.** 