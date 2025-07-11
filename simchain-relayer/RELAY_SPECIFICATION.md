# SIMChain Relay Node Full Specification

## Overview

The SIMChain Relay is a stateless component that performs all client-side transformations and Anchor RPC calls without persisting any user-sensitive data off-chain. It serves as the bridge between user interfaces (like USSD) and the SIMChain on-chain program.

## Core Principles

1. **Stateless**: No persistent storage of sensitive data
2. **Privacy-First**: All sensitive data exists only in memory and is zeroed after use
3. **Security**: Comprehensive input validation and error handling
4. **Scalability**: Efficient caching and connection management
5. **Reliability**: Idempotent operations with robust error reporting

## Architecture

```
User Interface (USSD) → SIMChain Relay → Solana Validator → SIMChain Program
```

### Components

1. **PhoneNormalizer**: E.164 phone number formatting
2. **PinManager**: PIN validation and secure hashing
3. **AliasValidator**: Alias format validation
4. **SimchainRelay**: Main relay logic with PDA derivation
5. **Error Handling**: Comprehensive error codes and messages

## Input Validation Specifications

### Phone Number Normalization

**Requirements:**
- Accept various formats: `+1234567890`, `1234567890`, `+1 (234) 567-8900`
- Normalize to E.164 format: `+[country code][number]`
- Length validation: 8-15 characters
- Strip non-digit characters except `+`

**Implementation:**
```typescript
static normalize(sim: string): string {
  let normalized = sim.replace(/[^\d+]/g, '');
  if (!normalized.startsWith('+')) {
    normalized = '+' + normalized;
  }
  if (normalized.length < 8 || normalized.length > 15) {
    throw new Error('Invalid phone number format');
  }
  return normalized;
}
```

### PIN Validation

**Security Requirements:**
- Exactly 6 digits
- Numeric only (0-9)
- Simple and memorable for users

**Implementation:**
```typescript
static validatePin(pin: string): boolean {
  if (pin.length !== 6) return false;
  if (!/^\d{6}$/.test(pin)) return false; // Must be exactly 6 digits
  return true;
}
```

### Alias Validation

**Requirements:**
- Maximum length: 32 characters
- Printable ASCII characters only
- Cannot be all zeros
- Non-empty

**Implementation:**
```typescript
static validateAlias(alias: string): boolean {
  if (alias.length > 32) return false;
  if (alias.length === 0) return false;
  if (!/^[\x20-\x7E]+$/.test(alias)) return false;
  if (/^0+$/.test(alias)) return false;
  return true;
}
```

## PDA Derivation

### Wallet PDA
```typescript
// 1. Normalize phone number
const normalizedSim = PhoneNormalizer.normalize(sim);

// 2. Fetch salt from on-chain config
const salt = await getSalt();

// 3. Hash SIM with salt
const simHash = SHA256(normalizedSim || salt);

// 4. Derive PDA
const [walletPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('wallet'), simHash],
  programId
);
```

### Alias Index PDA
```typescript
// 1. Normalize alias to 32-byte array
const aliasBytes = AliasValidator.normalizeAlias(alias);

// 2. Derive PDA
const [aliasIndexPda] = PublicKey.findProgramAddressSync(
  [Buffer.from('alias'), aliasBytes],
  programId
);
```

## Core Operations

### 1. Health Check
```typescript
async healthCheck(): Promise<RelayResult<{ connected: boolean; programId: string }>>
```
- Verifies connection to Solana validator
- Checks program deployment
- Returns connection status and program ID

### 2. Wallet Information
```typescript
async getWalletInfo(sim: string): Promise<RelayResult<WalletInfo>>
```
- Derives wallet PDA from SIM number
- Checks wallet existence
- Returns balance and wallet address

### 3. Wallet Existence Check
```typescript
async walletExists(sim: string): Promise<boolean>
```
- Quick check if wallet exists for given SIM
- Returns boolean without detailed info

### 4. Balance Query
```typescript
async getWalletBalance(sim: string): Promise<number>
```
- Returns SOL balance in SOL units
- Returns 0 if wallet doesn't exist

## Security Features

### Memory Management
- PIN hashes computed client-side only
- Sensitive data zeroed after use
- No logging of sensitive information

### Input Sanitization
- All inputs validated before processing
- Phone numbers normalized to E.164
- Aliases sanitized to printable ASCII

### Error Handling
- Comprehensive error codes
- User-friendly error messages
- No sensitive data in error responses

## Error Codes

| Code | Description |
|------|-------------|
| `CONNECTION_ERROR` | Failed to connect to validator |
| `INVALID_PHONE` | Invalid phone number format |
| `INVALID_PIN` | PIN doesn't meet security requirements |
| `INVALID_ALIAS` | Invalid alias format |
| `WALLET_NOT_FOUND` | Wallet doesn't exist |
| `WALLET_INFO_ERROR` | Failed to get wallet information |

## API Endpoints

### POST /api/relay

**Actions:**
- `health-check`: Verify system health
- `validate-phone`: Validate and normalize phone number
- `validate-pin`: Validate PIN strength
- `validate-alias`: Validate alias format
- `wallet-info`: Get detailed wallet information
- `wallet-exists`: Check if wallet exists
- `wallet-balance`: Get wallet balance
- `test-all`: Run comprehensive test suite

**Example Request:**
```json
{
  "action": "validate-phone",
  "sim": "+1 (234) 567-8900"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "original": "+1 (234) 567-8900",
    "normalized": "+12345678900",
    "valid": true
  }
}
```

## Testing

### Test Suite Coverage
1. **Phone Normalization**: Various input formats
2. **PIN Validation**: Security requirement compliance
3. **Alias Validation**: Format and length checks
4. **Health Check**: Connection verification
5. **PDA Derivation**: Wallet and alias PDAs
6. **Wallet Operations**: Existence and balance queries

### Test Cases

#### Phone Numbers
- `+1234567890` → `+1234567890` ✅
- `1234567890` → `+1234567890` ✅
- `+1 (234) 567-8900` → `+12345678900` ✅
- `invalid` → Error ❌

#### PINs
- `123456` → Valid ✅
- `000000` → Valid ✅
- `12345` → Invalid (too short) ❌
- `1234567` → Invalid (too long) ❌
- `12345a` → Invalid (contains letters) ❌

#### Aliases
- `test` → Valid ✅
- `test-alias_123` → Valid ✅
- `test_alias_123456789012345678901234567890` → Invalid (too long) ❌
- `00000000000000000000000000000000` → Invalid (all zeros) ❌

## Implementation Notes

### Dependencies
- `@solana/web3.js`: Solana client library
- `@coral-xyz/anchor`: Anchor framework
- `crypto`: Node.js crypto module

### Configuration
- Connection URL: `http://127.0.0.1:8899` (local validator)
- Program ID: `DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r`
- Commitment: `confirmed`

### Performance Considerations
- Salt caching to reduce RPC calls
- Connection pooling for multiple requests
- Efficient PDA derivation algorithms

### Security Considerations
- HTTPS for production deployments
- Rate limiting on API endpoints
- Input validation at all layers
- Secure memory handling

## Future Enhancements

1. **Google libphonenumber**: Enhanced phone number parsing
2. **Rate Limiting**: API request throttling
3. **Caching**: Redis for frequently accessed data
4. **Monitoring**: Prometheus metrics and logging
5. **Load Balancing**: Multiple relay instances
6. **Circuit Breaker**: Fault tolerance patterns

## Deployment

### Environment Variables
```bash
SOLANA_RPC_URL=http://127.0.0.1:8899
SIMCHAIN_PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r
NODE_ENV=production
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## Conclusion

The SIMChain Relay provides a secure, stateless, and scalable interface between user applications and the SIMChain program. It ensures privacy by never persisting sensitive data while providing comprehensive validation and error handling for all operations.

The implementation follows security best practices and is designed for production deployment with proper monitoring and scaling capabilities. 