# SIMChain Relay API Documentation

## Base URL
`http://localhost:3000/api/relay`

## Authentication
All endpoints require a POST request with JSON body containing an `action` parameter.

## Endpoints

### 1. Health Check
**Action:** `health-check`

**Request:**
```json
{
  "action": "health-check"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "connected": true,
    "programId": "DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r"
  }
}
```

### 2. Check Wallet Exists
**Action:** `wallet-exists`

**Request:**
```json
{
  "action": "wallet-exists",
  "sim": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true
  }
}
```

### 3. Get Wallet Info
**Action:** `wallet-info`

**Request:**
```json
{
  "action": "wallet-info",
  "sim": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "wallet_address_here",
    "balance": 0.5,
    "exists": true
  }
}
```

### 4. Get Wallet Balance
**Action:** `wallet-balance`

**Request:**
```json
{
  "action": "wallet-balance",
  "sim": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "balance": 0.5
  }
}
```

### 5. Initialize Wallet
**Action:** `initialize-wallet`

**Request:**
```json
{
  "action": "initialize-wallet",
  "sim": "+1234567890",
  "pin": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "signature": "transaction_signature_here",
    "walletAddress": "wallet_address_here"
  }
}
```

### 6. Set Alias
**Action:** `set-alias`

**Request:**
```json
{
  "action": "set-alias",
  "sim": "+1234567890",
  "alias": "my_wallet"
}
```

**Alias Requirements:**
- Length: 2-12 characters
- Characters: Letters (a-z, A-Z), digits (0-9), underscore (_), hyphen (-)
- Examples: `my_wallet`, `user123`, `test-alias`

**Response:**
```json
{
  "success": true,
  "data": {
    "alias": "my_wallet",
    "message": "Alias validation passed. On-chain update not yet implemented.",
    "signature": "mock-signature"
  }
}
```

**Error Response (Invalid Alias):**
```json
{
  "success": false,
  "error": "Invalid alias format. Must be 2-12 characters (letters, digits, underscore, hyphen)"
}
```

**Error Response (Wallet Not Found):**
```json
{
  "success": false,
  "error": "Wallet not found for this SIM number"
}
```

## Error Handling

All endpoints return error responses in the following format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:
- `400`: Bad Request (missing parameters, invalid format)
- `404`: Not Found (wallet doesn't exist)
- `500`: Internal Server Error

## Testing Examples

### Test with curl:

```bash
# Health check
curl -X POST http://localhost:3000/api/relay \
  -H "Content-Type: application/json" \
  -d '{"action": "health-check"}'

# Set alias
curl -X POST http://localhost:3000/api/relay \
  -H "Content-Type: application/json" \
  -d '{"action": "set-alias", "sim": "+1234567890", "alias": "test123"}'

# Check wallet exists
curl -X POST http://localhost:3000/api/relay \
  -H "Content-Type: application/json" \
  -d '{"action": "wallet-exists", "sim": "+1234567890"}'
``` 