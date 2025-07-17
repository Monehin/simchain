# 📱 SIMChain USSD Flow Specification

## 📋 Overview

This document specifies the complete USSD flow for SIMChain's multichain implementation, including all menus, user interactions, and system responses.

## 🎯 USSD Design Principles

### **1. Simplicity First**
- Clear, concise menu options
- Minimal text input required
- Logical navigation flow

### **2. Chain Transparency**
- Users always know which blockchain they're using
- Clear indication of fees and costs
- Transparent transaction status

### **3. Error Handling**
- Clear error messages
- Recovery options provided
- Graceful fallbacks

## 🔐 Registration & Authentication Flow

### **Initial USSD Access**
```
Welcome to SIMChain
*123# → Access SIMChain

Checking registration status...
⏳ Please wait...

If not registered:
  → Registration:
    Enter your phone number: +1234567890
    (proceed to PIN creation)

If registered:
  → Welcome back!
    Enter your PIN: ******
```

### **New User Registration**
```
Registration:
Enter your phone number: +1234567890

Confirm phone number:
+1234567890

1 → Confirm
2 → Change number
3 → Back

Select option:
```

### **PIN Creation**
```
Create PIN:
Enter 6-digit PIN: ******

Confirm PIN:
Re-enter PIN: ******

PIN created successfully!

Creating wallet...
⏳ Processing...

✅ Registration successful!
Wallet created on Solana
Address: BKrNbFUgnFbsp3wC3fxwGAKhbPPh9ArS7PM2pWHCrLGb
Alias: IndigoRoadrunner

1 → Continue to wallet
2 → Back to main menu

Select option:
```

### **User Login (if already registered)**
```
Welcome back!
Enter your PIN: ******

✅ Login successful!

USSD Menu:
1 → Wallet
2 → Set Alias
3 → Services
4 → Help
5 → Exit

Select option:
```

### **Invalid PIN Handling**
```
❌ Invalid PIN
Attempts remaining: 2

Enter PIN: ******

✅ Login successful!

USSD Menu:
1 → Wallet
2 → Set Alias
3 → Services
4 → Help
5 → Exit

Select option:
```

### **Too Many Failed Attempts**
```
❌ Too many failed attempts
Account temporarily locked
Please try again in 15 minutes

1 → Try again
2 → Contact support
3 → Exit

Select option:
```

### **Session Expiry**
```
⚠️ Session expired
Please login again:
Enter your PIN: ******

✅ Login successful!

USSD Menu:
1 → Wallet
2 → Set Alias
3 → Services
4 → Help
5 → Exit

Select option:
```

### **Registration Errors**
```
❌ Registration failed
Reason: Phone number already registered

1 → Try PIN (login)
2 → Try different number
3 → Contact support
4 → Exit

Select option:
```

### **PIN Mismatch During Registration**
```
❌ PINs don't match
Please try again

Enter 6-digit PIN: ******

Confirm PIN:
Re-enter PIN: ******

PIN created successfully!
```

## 👛 Wallet Operations

### **Main Wallet Menu**
```
Wallet Options:
1 → SOL (Solana)
2 → DOT (Polkadot)
3 → USDC (Solana)
4 → USDC (Polkadot)
5 → Back to main menu

Select option:
```

### **SOL Wallet Operations**
```
SOL Wallet:
1 → Check Balance
2 → Send SOL
3 → Receive SOL
4 → Transaction History
5 → Back

Select option:
```

### **DOT Wallet Operations**
```
DOT Wallet:
1 → Check Balance
2 → Send DOT
3 → Receive DOT
4 → Transaction History
5 → Back

Select option:
```

### **Check Balance Flow**
```
SOL Balance: 12.5 SOL
≈ $1,250 USD

1 → Send SOL
2 → Receive SOL
3 → Back

Select option:
```

### **Send Funds Flow**
```
Send SOL:
Enter recipient SIM: +1234567890

Recipient: +1234567890
Alias: BlueEagle
Enter amount (SOL): 1.5

Confirm transaction:
From: +1234567890
To: +1234567890
Amount: 1.5 SOL
Fee: 0.000005 SOL
Total: 1.500005 SOL

1 → Confirm
2 → Cancel

Select option:
```

### **Transaction Confirmation**
```
⏳ Processing transaction...
Please wait...

✅ Transaction successful!
Hash: ABC123...XYZ789
Amount: 1.5 SOL
Fee: 0.000005 SOL
Status: Confirmed

1 → Send more
2 → Back to wallet
3 → Main menu

Select option:
```

### **Insufficient Balance**
```
❌ Insufficient balance
Required: 1.500005 SOL
Available: 1.2 SOL
Shortfall: 0.300005 SOL

Please add more SOL to your wallet.

1 → Try again
2 → Back to wallet
3 → Main menu

Select option:
```

## 🔄 Cross-Chain Operations

### **Cross-Chain Transfer Menu**
```
Cross-Chain Transfer:
1 → SOL → DOT
2 → DOT → SOL
3 → SOL → USDC (Polkadot)
4 → DOT → USDC (Solana)
5 → Back

Select option:
```

### **SOL → DOT Transfer Flow**
```
SOL → DOT Transfer:
Enter amount (SOL): 2.0

Exchange Quote:
From: 2.0 SOL
To: DOT
Rate: 1 SOL = 25 DOT
Estimated: 50 DOT
Bridge Fee: 0.001 SOL
Total Cost: 2.001 SOL

1 → Confirm
2 → Cancel

Select option:
```

### **Cross-Chain Processing**
```
⏳ Processing cross-chain transfer...

Step 1/4: Validating PIN on Solana ✅
Step 2/4: Locking SOL on Solana...
Step 3/4: Sending cross-chain message...
Step 4/4: Releasing DOT on Polkadot...

✅ Transfer successful!
SOL Tx: ABC123...XYZ789
DOT Tx: DEF456...UVW012
Bridge Msg: MSG789...ABC123
Amount: 50 DOT
Status: Confirmed

1 → Transfer more
2 → Back to wallet
3 → Main menu

Select option:
```

## 💱 DeFi Services

### **Services Main Menu**
```
DeFi Services:
1. View Interest Rates - SOL
2. Withdraw from Vault - DOT
3. Loan Request - SOL
4. Loan Repayment - SOL
5. Stake Tokens - DOT
6. View Staking Rewards - DOT
7. Swap Tokens
8. Back

Select option:
```

### **Swap Tokens Menu**
```
Swap Tokens:
1. SOL ↔ DOT
2. SOL ↔ USDC (Solana)
3. DOT ↔ USDC (Polkadot)
4. Cross-chain swap
5. Back

Select option:
```

### **Token Swap Flow**
```
Swap SOL → DOT:
Enter amount (SOL): 5.0

Swap Quote:
From: 5.0 SOL
To: DOT
Rate: 1 SOL = 25 DOT
You'll receive: 125 DOT
Protocol Fee: 0.1% (0.005 SOL)
Gas Fee: 0.000005 SOL
Total Cost: 5.005005 SOL

1 → Confirm swap
2 → Cancel

Select option:
```

### **Swap Processing**
```
⏳ Processing swap...

Step 1/2: Executing on Jupiter DEX...
Step 2/2: Confirming transaction...

✅ Swap successful!
Hash: ABC123...XYZ789
Received: 125 DOT
Fee: 0.005005 SOL
Status: Confirmed

1 → Swap more
2 → Back to services
3 → Main menu

Select option:
```

### **Lending Flow**
```
Loan Request - SOL:
1. Borrow SOL
2. Repay Loan
3. View Loans
4. Back

Select option:
```

### **Borrow SOL Flow**
```
Borrow SOL:
Enter amount: 10.0

Loan Terms:
Amount: 10.0 SOL
Interest Rate: 5% APY
Collateral Required: 15.0 SOL
Duration: 30 days
Fee: 0.5% (0.05 SOL)

1 → Confirm loan
2 → Cancel

Select option:
```

### **Staking Flow**
```
Stake DOT:
Enter amount: 100.0

Staking Terms:
Amount: 100.0 DOT
Reward Rate: 8% APY
Lock Period: 28 days
Gas Fee: 0.01 DOT

1 → Confirm staking
2 → Cancel

Select option:
```

## 🏷️ Alias Management

### **Set Alias Menu**
```
Set Alias:
1 → SOL Alias
2 → DOT Alias
3 → View Aliases
4 → Back

Select option:
```

### **Set SOL Alias Flow**
```
Set SOL Alias:
Current: IndigoRoadrunner
Enter new alias: BlueEagle

Confirm alias change:
From: IndigoRoadrunner
To: BlueEagle
Fee: 0.000005 SOL

1 → Confirm
2 → Cancel

Select option:
```

### **Alias Confirmation**
```
✅ Alias updated successfully!
New alias: BlueEagle
Fee: 0.000005 SOL
Status: Confirmed

1 → Set another alias
2 → Back to main menu

Select option:
```

## ❓ Help & Support

### **Help Menu**
```
Help & Support:
1. How to send funds
2. How to swap tokens
3. Transaction fees
4. Contact support
5. Back

Select option:
```

### **Help Content**
```
How to send funds:
1. Select Wallet → SOL/DOT
2. Choose Send
3. Enter recipient SIM
4. Enter amount
5. Confirm transaction

1 → Next topic
2 → Back to help
3 → Main menu

Select option:
```

### **Contact Support**
```
Contact Support:
Call: +1-800-SIMCHAIN
Email: support@simchain.com
Hours: 24/7

1 → Back to help
2 → Main menu

Select option:
```

## ⚠️ Error Handling

### **Network Error**
```
❌ Network error
Unable to connect to blockchain.
Please try again in a few minutes.

1 → Retry
2 → Back to main menu

Select option:
```

### **Transaction Failed**
```
❌ Transaction failed
Reason: Insufficient gas fees
Hash: ABC123...XYZ789

1 → Try again
2 → Back to wallet
3 → Main menu

Select option:
```

### **Invalid Input**
```
❌ Invalid input
Please enter a valid amount (0.001 - 1000)

Enter amount (SOL): 1.5

1 → Confirm
2 → Cancel

Select option:
```

### **Service Unavailable**
```
⚠️ Service temporarily unavailable
Please try again later.

1 → Back to main menu
2 → Contact support

Select option:
```

## 📊 Status Messages

### **Processing Messages**
```
⏳ Processing...
Please wait...

Step 1/3: Validating...
Step 2/3: Executing...
Step 3/3: Confirming...
```

### **Success Messages**
```
✅ Operation successful!
Transaction details:
Hash: ABC123...XYZ789
Amount: 1.5 SOL
Status: Confirmed
```

### **Pending Messages**
```
⏳ Transaction pending
Hash: ABC123...XYZ789
Status: Processing
Check back in 30 seconds.
```

## 🔄 Navigation Patterns

### **Standard Navigation**
```
USSD Access → Register/Login → Main Menu → Submenu → Action → Confirmation → Result → Back Options
```

### **Registration Flow**
```
USSD Access → Register → Phone Number → PIN Creation → Wallet Creation → Main Menu
```

### **Login Flow**
```
USSD Access → Login → PIN Entry → Main Menu
```

### **Error Recovery**
```
Error → Explanation → Recovery Options → Retry or Back
```

### **Session Management**
```
Session Expiry → Re-authentication → Continue or Exit
```

### **USSD Session States**
```
1. Initial State: *123# → Welcome menu
2. Registration State: Phone number → PIN creation
3. Login State: PIN entry → Main menu
4. Active Session: Main menu → Submenus → Actions
5. Session Expired: Re-authentication required
```

## 📱 USSD Technical Specifications

### **USSD Code**
- **Access Code**: *123# (standard USSD format)
- **Session Timeout**: 5 minutes of inactivity
- **Max Session Duration**: 30 minutes
- **Auto-logout**: After 3 failed PIN attempts
- **Account Lockout**: 15 minutes after 3 failed attempts

### **Character Limits**
- **Menu Options**: Max 160 characters per screen
- **Input Fields**: Max 20 characters
- **Status Messages**: Max 140 characters
- **Error Messages**: Max 120 characters
- **Phone Numbers**: International format (+1234567890)
- **PIN**: 6 digits only

### **Response Times**
- **Menu Navigation**: <2 seconds
- **Balance Check**: <3 seconds
- **Transaction Processing**: <10 seconds
- **Cross-Chain Operations**: <30 seconds

### **Session Management**
- **Session Timeout**: 5 minutes of inactivity
- **Max Session Duration**: 30 minutes
- **Auto-logout**: After 3 failed PIN attempts
- **Account Lockout**: 15 minutes after 3 failed attempts

### **Input Validation**
- **PIN**: 6 digits only
- **Amount**: Positive numbers with decimals
- **Phone Number**: International format (+1234567890)
- **Alias**: 3-20 alphanumeric characters
- **USSD Code**: *123# format

## 🎨 Menu Design Guidelines

### **Visual Hierarchy**
```
1. Main action (numbered)
2. Secondary action (numbered)
3. Navigation (numbered)
4. Exit option (last)
```

### **Consistent Formatting**
```
✅ Success indicators
❌ Error indicators
⏳ Processing indicators
⚠️ Warning indicators
```

### **Clear Instructions**
```
"Enter amount (SOL): "
"Select option: "
"Confirm (Y/N): "
```

## 📊 Complete USSD Flow Diagram

```
User dials *123#
    │
    ▼
┌─────────────────┐
│ Welcome Menu    │
│ 1. Register     │
│ 2. Login        │
│ 3. Help         │
│ 4. Exit         │
└─────────────────┘
    │
    ├─ 1 → Registration Flow
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Enter Phone #   │
    │ │ +1234567890     │
    │ └─────────────────┘
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Create PIN      │
    │ │ ******          │
    │ └─────────────────┘
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Wallet Created  │
    │ │ Success!        │
    │ └─────────────────┘
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Main Menu       │
    │ └─────────────────┘
    │
    ├─ 2 → Login Flow
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Enter PIN       │
    │ │ ******          │
    │ └─────────────────┘
    │   │
    │   ▼
    │ ┌─────────────────┐
    │ │ Main Menu       │
    │ └─────────────────┘
    │
    └─ 3 → Help Flow
        │
        ▼
      ┌─────────────────┐
      │ Help Menu       │
      └─────────────────┘

Main Menu Options:
1 → Wallet (SOL/DOT/USDC)
2 → Set Alias
3 → Services (DeFi)
4 → Help
5 → Exit
```

## 🔄 Session State Transitions

```
Initial State (*123#)
    │
    ├─ Register → Phone Input → PIN Creation → Wallet Creation → Main Menu
    ├─ Login → PIN Input → Main Menu
    ├─ Help → Help Menu → Back to Initial
    └─ Exit → End Session

Main Menu State
    │
    ├─ Wallet → Chain Selection → Wallet Operations
    ├─ Set Alias → Alias Management
    ├─ Services → DeFi Services
    ├─ Help → Help Menu
    └─ Exit → End Session

Session Expiry
    │
    └─ Re-authentication Required → PIN Input → Main Menu
```

---

*This USSD flow specification ensures a consistent, user-friendly experience across all multichain operations, from initial registration to advanced DeFi services.* 