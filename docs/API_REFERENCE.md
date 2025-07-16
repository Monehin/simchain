# SIMChain API Reference

## Base URL
```
http://localhost:3000/api
```

## Authentication
All endpoints require proper environment variables to be set:
- `WALLET_PRIVATE_KEY` - Relayer wallet for transaction signing
- `ENCRYPTION_SECRET_KEY` - For phone number encryption
- `DATABASE_URL` - PostgreSQL connection string

## Endpoints

### 1. Create Wallet
**POST** `/create-wallet`

Creates a new SIM-based wallet on the Solana blockchain.

**Request Body:**
```json
{
  "sim": "+1234567890",
  "pin": "123456",
  "country": "RW"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Wallet initialized successfully",
    "walletAddress": "BNiu8MHxbuRmVoevLhnWLJbfS5Vtjp7YQtcPSs8n1QGw",
    "transactionSignature": "3Q2FZVJkSsG3peCqLwhqrg2RzbejtC9cyN5Rp3zxwKgSNNbNRTuMLCUA5G6UM5QWPXoGNRSdKbzKRy8F2WRfP3he",
    "alias": "RichStar",
    "client": "@solana/kit",
    "encrypted": true
  }
}
```

**Error Responses:**
- `400` - Invalid phone number or PIN
- `409` - Phone number already registered
- `500` - Internal server error

---

### 2. Check Balance
**POST** `/check-balance`

Retrieves the current balance of a wallet.

**Request Body:**
```json
{
  "sim": "+1234567890",
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alias": "RichStar",
    "balance": 1.0018444
  }
}
```

---

### 3. Send Funds
**POST** `/send-funds`

Transfers funds between two wallets.

**Request Body:**
```json
{
  "fromSim": "+1234567890",
  "toSim": "+0987654321",
  "amount": 0.5,
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Funds sent successfully",
    "fromAlias": "RichStar",
    "toAlias": "SafePlatypus",
    "amount": 0.5,
    "signature": "3brRRCco4P2h9UfFaNv1SHfGozbUZTgKob4EYjBTWnyed9nUNBTD8aXBJ2ERW4xJV8cpv1UvDiTsb23pSMTGs5Xi"
  }
}
```

---

### 4. Deposit Funds
**POST** `/deposit-funds`

Deposits funds to a wallet from the relayer account.

**Request Body:**
```json
{
  "sim": "+1234567890",
  "amount": 1.0
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Funds deposited successfully",
    "alias": "RichStar",
    "amount": 1,
    "signature": "JYS3E4VmAx6myQVw4qvbavsBMtHST6dQetCDfeDHbM27UJcZrczEVk49qPUYngNcegac6S5mpcZzawZyLEW53ww"
  }
}
```

---

### 5. Update Alias
**POST** `/update-alias`

Updates the alias for a wallet.

**Request Body:**
```json
{
  "walletAddress": "BNiu8MHxbuRmVoevLhnWLJbfS5Vtjp7YQtcPSs8n1QGw",
  "newAlias": "TestLion"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Alias updated",
  "oldAlias": "RichStar",
  "newAlias": "TestLion"
}
```

---

### 6. Initialize Program
**POST** `/init-program`

Initializes the config and registry accounts for the program.

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Program initialized successfully",
    "configSignature": "3d13jgt5W9JdZLxCB5t4YqasNziqPasd8v2nHnREVtjBk6jiMBrPsnXS7UnJgrdkaG1sT6cKs7kJ4pPESoWW7NKf",
    "registrySignature": "XDVaDgPYcvSTYRpRdhMUgKNnuJxd5VtHSxDM9GysCvXuWsHa17Yp8kWQVdML6rTrcHt2eogCAYCvFCPk5VcDoRA",
    "client": "@solana/kit"
  }
}
```

---

### 7. Test Connection
**GET** `/test-connection`

Tests the connection to the Solana cluster.

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "programId": "DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r",
    "programAccountsCount": 0,
    "client": "@solana/kit"
  }
}
```

---

### 8. Test Database
**GET** `/test-database`

Retrieves all wallets from the database.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWallets": 2,
    "wallets": [
      {
        "id": "cmd3nye4s000012riie3r7b8a",
        "walletAddress": "BNiu8MHxbuRmVoevLhnWLJbfS5Vtjp7YQtcPSs8n1QGw",
        "country": "RW",
        "currentAlias": "TestLion",
        "createdAt": "2025-07-14T22:16:54.797Z",
        "updatedAt": "2025-07-14T22:26:51.609Z"
      }
    ]
  }
}
```

---

### 9. Audit Logs
**GET** `/audit-logs`

Retrieves audit logs for compliance and debugging.

**Query Parameters:**
- `action` (optional) - Filter by action type
- `alias` (optional) - Filter by alias
- `limit` (optional) - Number of logs to return (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log_id",
        "action": "WALLET_CREATED",
        "alias": "RichStar",
        "errorMessage": null,
        "errorCode": null,
        "metadata": {
          "walletAddress": "BNiu8MHxbuRmVoevLhnWLJbfS5Vtjp7YQtcPSs8n1QGw",
          "country": "RW"
        },
        "createdAt": "2025-07-14T22:16:54.797Z"
      }
    ],
    "total": 1
  }
}
```

---

### 10. Alias Preview
**GET** `/alias-preview`

Generates sample aliases for testing.

**Query Parameters:**
- `count` (optional) - Number of aliases to generate (default: 5)

**Response:**
```json
{
  "success": true,
  "data": {
    "aliases": [
      "SwiftEagle",
      "GoldenLion",
      "SilverWolf",
      "BraveTiger",
      "CleverFox"
    ],
    "patterns": [
      "Adjective + Animal",
      "Color + Animal",
      "Adjective + Animal"
    ]
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

### Common Error Codes
- `400` - Bad Request (invalid input)
- `404` - Not Found (endpoint or resource)
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

### Error Types
- **Validation Errors**: Invalid phone numbers, PINs, amounts
- **Business Logic Errors**: Insufficient funds, wallet not found
- **System Errors**: Database connection, blockchain errors
- **Security Errors**: Invalid signatures, unauthorized access

## Rate Limiting
Currently no rate limiting implemented. Consider implementing for production.

## Security Notes
- All phone numbers are encrypted before storage
- PINs are validated but not stored
- Transaction signatures are verified
- Database queries use parameterized statements
- Environment variables contain sensitive data

## Testing
Use the provided test endpoints to verify system health:
1. `/test-connection` - Verify Solana connection
2. `/test-database` - Check database status
3. Create test wallets with different phone numbers
4. Perform fund transfers between test wallets 