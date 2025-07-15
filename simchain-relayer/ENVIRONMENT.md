# Environment Variables

This document describes the required environment variables for the SIMChain relayer.

## Required Environment Variables

### Solana Configuration
- `SOLANA_CLUSTER_URL`: The Solana RPC endpoint URL (default: http://127.0.0.1:8899)
- `PROGRAM_ID`: The SIMChain program ID (default: DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r)
- `WALLET_PRIVATE_KEY`: JSON array of private key bytes for the relayer wallet

### Database Configuration
- `DATABASE_URL`: PostgreSQL connection string (e.g., "postgresql://username:password@localhost:5432/simchain?schema=public")

### Encryption Configuration
- `ENCRYPTION_SECRET_KEY`: 32-byte encryption key for AES-256-GCM encryption of phone numbers

## Generating Encryption Key

To generate a secure encryption key, run:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Example .env.local file

```env
# Solana Configuration
SOLANA_CLUSTER_URL=http://127.0.0.1:8899
PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r

# Wallet Configuration
WALLET_PRIVATE_KEY=["your","private","key","bytes","here"]

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/simchain?schema=public"

# Encryption Configuration
ENCRYPTION_SECRET_KEY="your-32-byte-encryption-key-here"

# Optional: Logging
LOG_LEVEL=info
```

## Security Notes

1. **ENCRYPTION_SECRET_KEY**: This key is used to encrypt phone numbers in the database. If this key is lost, encrypted phone numbers cannot be decrypted. Store this key securely and backup safely.

2. **WALLET_PRIVATE_KEY**: This is the private key for the relayer wallet that pays for transactions. Keep this secure and never commit to version control.

3. **DATABASE_URL**: Contains database credentials. Use environment-specific databases for development, staging, and production. 