# SIMChain Relayer - USSD Interface

A Next.js application that simulates a USSD interface (*906#) for the SIMChain Solana program. This demo showcases how mobile users can interact with blockchain wallets through traditional USSD menus.

## 🚀 Features

### USSD Menu Interface
- **Create Wallet**: Initialize new wallets using SIM numbers and PINs
- **Check Balance**: View wallet balances in real-time
- **Send Funds**: Transfer SOL between wallets using SIM numbers
- **Set Alias**: Assign human-readable aliases to wallets

### Technical Features
- **Solana Integration**: Full integration with SIMChain smart contract
- **PDA Derivation**: Secure wallet derivation using SIM numbers and salt
- **API Routes**: RESTful endpoints for all wallet operations
- **Demo Mode**: Safe simulation environment for testing

## 📱 USSD Interface

The app simulates a traditional USSD menu interface:

```
*906#
SIMChain Wallet Service

1. Create Wallet
2. Check Balance  
3. Send Funds
4. Set Alias

Enter option (1-4):
```

### Usage Examples

#### Create Wallet
```
Format: SIM*PIN
Example: +2348012345678*MyPin123
Response: Wallet created ✅
```

#### Check Balance
```
Input: +2348012345678
Response: Balance: 2.1345 SOL
```

#### Send Funds
```
Format: FROM_SIM*TO_SIM*AMOUNT
Example: +2348012345678*+2348098765432*0.1
Response: Sent 0.1000 SOL
```

#### Set Alias
```
Format: SIM*ALIAS
Example: +2348012345678*mywallet
Response: Alias set ✅
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd simchain-relayer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local`:
   ```env
   SOLANA_RPC_URL=http://127.0.0.1:8899
   PROGRAM_ID=DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r
   ```

4. **Start the development server**
```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
simchain-relayer/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── create-wallet/
│   │   │   │   └── route.ts
│   │   │   ├── check-balance/
│   │   │   │   └── route.ts
│   │   │   ├── send-funds/
│   │   │   │   └── route.ts
│   │   │   └── set-alias/
│   │   │       └── route.ts
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   └── lib/
│       ├── sim-utils.ts
│       └── solana.ts
├── simchain_wallet.json
├── .env.local
└── README.md
```

## 🔧 API Endpoints

### POST `/api/create-wallet`
Creates a new wallet for a SIM number.

**Request:**
```json
{
  "sim": "+2348012345678",
  "pin": "MyPin123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Wallet created ✅",
  "wallet": "wallet_pda_address"
}
```

### GET `/api/check-balance?sim=+2348012345678`
Checks the balance of a wallet.

**Response:**
```json
{
  "success": true,
  "message": "Balance: 2.1345 SOL",
  "balance": 2134500000,
  "formattedBalance": "2.1345"
}
```

### POST `/api/send-funds`
Sends funds between wallets.

**Request:**
```json
{
  "from_sim": "+2348012345678",
  "to_sim": "+2348098765432",
  "amount": "0.1"
}
```

### POST `/api/set-alias`
Sets an alias for a wallet.

**Request:**
```json
{
  "sim": "+2348012345678",
  "alias": "mywallet"
}
```

## 🔐 Security Features

### PIN Validation
- Minimum 8 characters
- Must contain both letters and numbers
- SHA256 hashing for secure storage

### Wallet Derivation
- Uses SIM number + salt for deterministic PDA generation
- Salt rotation capability for enhanced security
- Collision-resistant hashing

### Input Validation
- SIM number format validation
- Amount validation and conversion
- Alias length and uniqueness checks

## 🎯 Demo Mode

The application runs in demo mode by default:

- **No Real Transactions**: All operations are simulated
- **Mock Responses**: Realistic USSD-style responses
- **Safe Testing**: No actual blockchain interactions
- **Demo SIM Numbers**: Use provided test numbers

### Demo SIM Numbers
- `+2348012345678` - Primary test wallet
- `+2348098765432` - Secondary test wallet

## 🚀 Production Deployment

### Environment Setup
1. **Real RPC Endpoint**: Use production Solana RPC
2. **Program ID**: Deploy SIMChain program to mainnet
3. **Relayer Keypair**: Secure keypair for transaction signing
4. **Salt Management**: Implement secure salt rotation

### Security Considerations
- **HTTPS**: Always use HTTPS in production
- **Rate Limiting**: Implement API rate limiting
- **Input Sanitization**: Validate all user inputs
- **Error Handling**: Graceful error handling and logging

### Scaling
- **Load Balancing**: Multiple relayer instances
- **Caching**: Cache frequently accessed data
- **Monitoring**: Implement health checks and metrics

## 🔗 Integration

### Mobile App Integration
The USSD interface can be integrated with mobile apps:

```javascript
// Example mobile app integration
const response = await fetch('/api/create-wallet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sim: userSim, pin: userPin })
});

const result = await response.json();
// Display USSD-style response to user
```

### SMS Gateway Integration
For real USSD deployment, integrate with SMS gateways:

```javascript
// Example SMS gateway integration
const ussdResponse = await processUSSDRequest(userInput);
await sendSMSResponse(userPhone, ussdResponse);
```

## 🧪 Testing

### Manual Testing
1. Start the development server
2. Navigate to the USSD interface
3. Test each menu option with demo data
4. Verify responses match expected format

### Automated Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## 📊 Performance

### Optimization Features
- **Client-side Validation**: Immediate input validation
- **Optimistic Updates**: Fast UI responses
- **Caching**: Smart caching of wallet data
- **Compression**: Gzip compression for API responses

### Monitoring
- **Response Times**: Track API response times
- **Error Rates**: Monitor error frequencies
- **User Metrics**: Track usage patterns
- **Blockchain Metrics**: Monitor Solana network status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API examples

---

**Note**: This is a demo application. For production use, implement proper security measures, error handling, and monitoring. 