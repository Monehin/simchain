# 🚀 SIMChain Production Deployment Guide

**Date:** January 15, 2025  
**Status:** ✅ **PRODUCTION READY**

## 📋 Overview

This guide covers deploying SIMChain to production:
- **Solana Program**: Deploy to Solana Devnet
- **Next.js Client**: Deploy to Vercel
- **Database**: Set up production PostgreSQL
- **Environment**: Configure production variables

## 🏗️ Prerequisites

### **Required Accounts**
- ✅ **Solana Wallet**: For program deployment
- ✅ **Vercel Account**: For client deployment
- ✅ **GitHub Account**: For code repository
- ✅ **Database Provider**: Supabase, Railway, or similar

### **Required Tools**
- ✅ **Node.js**: v18+ installed
- ✅ **Anchor CLI**: Latest version
- ✅ **Solana CLI**: Latest version
- ✅ **Git**: For version control

## 🔧 Step 1: Deploy Solana Program to Devnet

### **1.1 Switch to Devnet**
```bash
# Switch Solana CLI to devnet
solana config set --url devnet

# Verify connection
solana cluster-version
```

### **1.2 Get Devnet SOL**
```bash
# Request devnet SOL (you can request multiple times)
solana airdrop 2

# Check balance
solana balance
```

### **1.3 Build and Deploy Program**
```bash
# Navigate to project root
cd /Users/monehin/Desktop/SIMChain

# Build the program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Note the new program ID from output
```

### **1.4 Update Program ID**
After deployment, update the program ID in these files:

**`simchain-relayer/src/config/programId.ts`:**
```typescript
export const PROGRAM_ID = "YOUR_NEW_PROGRAM_ID_HERE";
```

**`Anchor.toml`:**
```toml
[programs.devnet]
simchain_wallet = "YOUR_NEW_PROGRAM_ID_HERE"
```

### **1.5 Initialize Program**
```bash
# Navigate to relayer
cd simchain-relayer

# Initialize the program on devnet
curl -X POST http://localhost:3000/api/init-program \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_admin_api_key"
```

## 🌐 Step 2: Set Up Production Database

### **2.1 Choose Database Provider**

**Option A: Supabase (Recommended)**
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get connection string from Settings > Database
```

**Option B: Railway**
```bash
# 1. Go to https://railway.app
# 2. Create new project
# 3. Add PostgreSQL service
# 4. Get connection string from Variables
```

**Option C: Neon**
```bash
# 1. Go to https://neon.tech
# 2. Create new project
# 3. Get connection string from dashboard
```

### **2.2 Update Database Schema**
```bash
# Navigate to relayer
cd simchain-relayer

# Update Prisma schema with production URL
# Edit .env file with production DATABASE_URL

# Push schema to production database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## 🚀 Step 3: Deploy Next.js Client to Vercel

### **3.1 Prepare for Deployment**

**Create `vercel.json` in `simchain-relayer/`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### **3.2 Push to GitHub**
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Prepare for production deployment"

# Create GitHub repository and push
git remote add origin https://github.com/yourusername/simchain.git
git push -u origin main
```

### **3.3 Deploy to Vercel**

**Option A: Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd simchain-relayer
vercel --prod
```

**Option B: Vercel Dashboard**
1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `simchain-relayer`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### **3.4 Configure Environment Variables**

In Vercel dashboard, add these environment variables:

```bash
# Database
DATABASE_URL=your_production_database_url

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
PROGRAM_ID=your_devnet_program_id
ADMIN_WALLET_PRIVATE_KEY=your_admin_wallet_private_key

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key

# API Keys
ADMIN_API_KEY=your_admin_api_key

# Optional: Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

## 🔐 Step 4: Security Configuration

### **4.1 Generate Encryption Key**
```bash
# Navigate to relayer
cd simchain-relayer

# Generate encryption key
node scripts/generate-encryption-key.js

# Copy the output to your environment variables
```

### **4.2 Set Up Admin Wallet**
```bash
# Generate new admin wallet
solana-keygen new --outfile admin-wallet.json

# Get public key
solana-keygen pubkey admin-wallet.json

# Fund with devnet SOL
solana airdrop 2 $(solana-keygen pubkey admin-wallet.json)

# Export private key for environment variable
cat admin-wallet.json | jq -r '.[0:64]' | base58
```

### **4.3 Configure CORS (if needed)**
Add to `next.config.ts`:
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

## 🧪 Step 5: Testing Production Deployment

### **5.1 Test API Endpoints**
```bash
# Test health check
curl https://your-vercel-app.vercel.app/api/test-connection

# Test wallet creation
curl -X POST https://your-vercel-app.vercel.app/api/create-wallet \
  -H "Content-Type: application/json" \
  -d '{"sim": "+1234567890", "country": "US"}'
```

### **5.2 Test USSD Flow**
1. Visit your Vercel app URL
2. Navigate to `/ussd`
3. Test complete registration flow
4. Verify wallet creation on devnet

### **5.3 Monitor Logs**
```bash
# Vercel logs
vercel logs

# Database logs (check your provider dashboard)
# Solana program logs
solana logs --url devnet
```

## 📊 Step 6: Monitoring and Maintenance

### **6.1 Set Up Monitoring**

**Vercel Analytics:**
- Enable in Vercel dashboard
- Monitor performance and errors

**Database Monitoring:**
- Set up alerts for connection issues
- Monitor query performance

**Solana Monitoring:**
- Track program usage on devnet
- Monitor transaction success rates

### **6.2 Backup Strategy**
```bash
# Database backup (automated by most providers)
# Program backup (source code in GitHub)
# Environment variables backup (store securely)
```

### **6.3 Update Strategy**
```bash
# 1. Update code in GitHub
# 2. Vercel auto-deploys on push
# 3. Test thoroughly before pushing
# 4. Monitor deployment logs
```

## 🔧 Troubleshooting

### **Common Issues**

**Build Failures:**
```bash
# Check Node.js version
node --version

# Clear cache
rm -rf .next node_modules
npm install

# Check environment variables
vercel env ls
```

**Database Connection:**
```bash
# Test connection
npx prisma db push

# Check connection string format
# Ensure SSL is enabled for production
```

**Program Deployment:**
```bash
# Check Solana balance
solana balance

# Verify program ID
solana program show YOUR_PROGRAM_ID --url devnet

# Check program logs
solana logs --url devnet
```

## 📞 Support

### **Useful Commands**
```bash
# Check deployment status
vercel ls

# View logs
vercel logs

# Rollback deployment
vercel rollback

# Check Solana program
solana program show YOUR_PROGRAM_ID --url devnet
```

### **Emergency Contacts**
- **Vercel Support**: https://vercel.com/support
- **Solana Discord**: https://discord.gg/solana
- **Database Provider Support**: Check your provider's docs

---

**Status:** 🟢 **READY FOR PRODUCTION**  
**Last Updated:** January 15, 2025 