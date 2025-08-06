"use client";

import React from "react";
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface USSDState {
  isActive: boolean;
  mobileNumber: string;
  isRegistered: boolean;
  pinAttempts: number;
  currentMenu: string;
  menuStack: string[];
  tempData: Record<string, unknown>;
  messages: string[];
  alias: string | null;
  walletAddress: string | null;
  isAuthenticated: boolean;
}

export default function USSDDemo() {
  const [state, setState] = useState<USSDState>({
    isActive: false,
    mobileNumber: '',
    isRegistered: false,
    pinAttempts: 0,
    currentMenu: 'dial',
    menuStack: [],
    tempData: {},
    messages: [],
    alias: null,
    walletAddress: null,
    isAuthenticated: false,
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Check if wallet exists using the wallet-exists endpoint
  const checkWalletExists = async (mobileNumber: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/wallet-exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: mobileNumber,
          country: 'RW'
        })
      });
      const result = await response.json();
      return result.success && result.data?.exists;
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  };

  // Handle dial code
  const handleDial = () => {
    if (!state.mobileNumber.trim()) {
      addMessage('❌ Please enter a mobile number first');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(state.mobileNumber.replace(/\s/g, ''))) {
      addMessage('❌ Invalid mobile number format');
      return;
    }

    setState(prev => ({ ...prev, mobileNumber: state.mobileNumber, isActive: true }));
    startSession(state.mobileNumber);
  };

  // Start USSD session
  const startSession = async (mobileNumber: string) => {
    setIsLoading(true);
    addMessage('Welcome to SIMChain');
    addMessage('*123# → Access SIMChain');
    addMessage('');
    addMessage('Checking registration status...');
    addMessage('⏳ Please wait...');
    
    const exists = await checkWalletExists(mobileNumber);
    
    setState(prev => ({ 
      ...prev, 
      isRegistered: exists,
      currentMenu: exists ? 'pin' : 'registration',
      menuStack: ['main']
    }));
    
    setIsLoading(false);
    
    if (exists) {
      addMessage('');
      addMessage('Welcome back!');
      addMessage('Enter your PIN: ******');
    } else {
      showRegistrationMenu();
    }
  };

  // Show registration menu
  const showRegistrationMenu = () => {
    addMessage('');
    addMessage('Registration:');
    addMessage(`Enter your phone number: ${state.mobileNumber}`);
    addMessage('');
    addMessage('Confirm phone number:');
    addMessage(state.mobileNumber);
    addMessage('');
    addMessage('1 → Confirm');
    addMessage('2 → Change number');
    addMessage('3 → Back');
    addMessage('');
    addMessage('Select option:');
  };

  // Handle PIN validation
  const handlePinValidation = async (pin: string) => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      addMessage('❌ PIN must be 6 digits. Try again:');
      return;
    }

    if (state.currentMenu === 'register_pin') {
      // For new users, create wallet with PIN
      setIsLoading(true);
      try {
        const response = await fetch('/api/create-wallet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sim: state.mobileNumber,
            pin: pin,
            country: 'RW'
          })
        });
        const result = await response.json();
        setIsLoading(false);
        
        if (result.success) {
          addMessage('');
          addMessage('PIN created successfully!');
          addMessage('');
          addMessage('Creating wallet...');
          addMessage('⏳ Processing...');
          addMessage('');
          addMessage('✅ Registration successful!');
          addMessage('Wallet created on Solana');
          addMessage(`Address: ${result.data.walletAddress}`);
          addMessage(`Alias: ${result.data.alias}`);
          addMessage('');
          addMessage('1 → Continue to wallet');
          addMessage('2 → Back to main menu');
          addMessage('');
          addMessage('Select option:');
          
          setState(prev => ({ 
            ...prev, 
            currentMenu: 'registration_success',
            isAuthenticated: true,
            alias: result.data.alias,
            walletAddress: result.data.walletAddress
          }));
        } else {
          addMessage(`❌ Registration failed`);
          addMessage(`Reason: ${result.error || 'Phone number already registered'}`);
          addMessage('');
          addMessage('1 → Try PIN (login)');
          addMessage('2 → Try different number');
          addMessage('3 → Contact support');
          addMessage('4 → Exit');
          addMessage('');
          addMessage('Select option:');
          setState(prev => ({ ...prev, currentMenu: 'registration_error' }));
        }
      } catch (error) {
        setIsLoading(false);
        addMessage('❌ Network error. Try again.');
        setState(prev => ({ ...prev, currentMenu: 'registration' }));
      }
      return;
    }

    // For existing users, verify PIN using the validate-pin endpoint
    try {
      const response = await fetch('/api/validate-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          pin: pin,
          country: 'RW'
        })
      });
      const result = await response.json();
      
      if (!result.success || !result.isValid) {
        const attempts = state.pinAttempts + 1;
        setState(prev => ({ ...prev, pinAttempts: attempts }));
        
        if (attempts >= 3) {
          addMessage('❌ Too many failed attempts');
          addMessage('Account temporarily locked');
          addMessage('Please try again in 15 minutes');
          addMessage('');
          addMessage('1 → Try again');
          addMessage('2 → Contact support');
          addMessage('3 → Exit');
          addMessage('');
          addMessage('Select option:');
          setState(prev => ({ ...prev, currentMenu: 'account_locked' }));
          return;
        }
        
        addMessage('❌ Invalid PIN');
        addMessage(`Attempts remaining: ${3 - attempts}`);
        addMessage('');
        addMessage('Enter PIN: ******');
        return;
      }

      // PIN is valid, mark as authenticated and proceed to main menu
      setState(prev => ({ 
        ...prev, 
        pinAttempts: 0,
        currentMenu: 'main',
        isAuthenticated: true
      }));
      addMessage('');
      addMessage('✅ Login successful!');
      addMessage('');
      showMainMenu();
    } catch (error) {
      const attempts = state.pinAttempts + 1;
      setState(prev => ({ ...prev, pinAttempts: attempts }));
      
      if (attempts >= 3) {
        addMessage('❌ Too many failed attempts');
        addMessage('Account temporarily locked');
        addMessage('Please try again in 15 minutes');
        addMessage('');
        addMessage('1 → Try again');
        addMessage('2 → Contact support');
        addMessage('3 → Exit');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'account_locked' }));
        return;
      }
      
      addMessage('❌ Network error. Try again.');
      addMessage(`Attempts remaining: ${3 - attempts}`);
      addMessage('');
      addMessage('Enter PIN: ******');
    }
  };

  // Show main menu
  const showMainMenu = () => {
    setState(prev => ({
      ...prev,
      messages: [`
USSD Menu:
1 → Wallet
2 → Set Alias
3 → Services
4 → Help
5 → Exit

Select option:
    `.trim()]
    }));
  };

  // Show wallet menu
  const showWalletMenu = () => {
    addMessage(`
Wallet Options:
1 → SOL (Solana)
2 → DOT (Polkadot)
3 → USDC (Solana)
4 → USDC (Polkadot)
5 → Back to main menu

Select option:
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'wallet' }));
  };

  // Show SOL wallet operations
  const showSOLWallet = () => {
    addMessage(`
SOL Wallet:
1 → Check Balance
2 → Send SOL
3 → Receive SOL
4 → Transaction History
5 → Back

Select option:
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'sol_wallet' }));
  };

  // Show DOT wallet operations
  const showDOTWallet = () => {
    addMessage(`
DOT Wallet:
1 → Check Balance
2 → Send DOT
3 → Receive DOT
4 → Transaction History
5 → Back

Select option:
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'dot_wallet' }));
  };

  // Handle menu selection
  const handleMenuSelection = (selection: string) => {
    if (state.currentMenu === 'registration') {
      handleRegistrationSelection(selection);
    } else if (state.currentMenu === 'registration_success') {
      handleRegistrationSuccess(selection);
    } else if (state.currentMenu === 'registration_error') {
      handleRegistrationError(selection);
    } else if (state.currentMenu === 'account_locked') {
      handleAccountLocked(selection);
    } else if (state.currentMenu === 'main') {
      handleMainMenuSelection(selection);
    } else if (state.currentMenu === 'wallet') {
      handleWalletSelection(selection);
    } else if (state.currentMenu === 'sol_wallet') {
      handleSOLWalletSelection(selection);
    } else if (state.currentMenu === 'dot_wallet') {
      handleDOTWalletSelection(selection);
    } else if (state.currentMenu === 'services') {
      handleServicesSelection(selection);
    } else if (state.currentMenu === 'swap_tokens') {
      handleSwapTokensSelection(selection);
    } else if (state.currentMenu === 'help') {
      handleHelpSelection(selection);
    } else if (state.currentMenu === 'help_send_funds' || 
               state.currentMenu === 'help_swap_tokens' || 
               state.currentMenu === 'help_fees' || 
               state.currentMenu === 'help_contact') {
      handleHelpSubmenu(selection);
    } else if (state.currentMenu === 'convert_source_token') {
      handleConvertSourceToken(selection);
    } else if (state.currentMenu === 'convert_target_token') {
      handleConvertTargetToken(selection);
    } else if (state.currentMenu === 'convert_amount') {
      handleConvertAmount(selection);
    } else if (state.currentMenu === 'convert_confirm') {
      handleConvertConfirm(selection);
    } else if (state.currentMenu === 'send_amount') {
      handleSendAmount(selection);
    } else if (state.currentMenu === 'send_recipient') {
      handleSendRecipient(selection);
    } else if (state.currentMenu === 'deposit_amount') {
      handleDepositAmount(selection);
    } else if (state.currentMenu === 'alias_input') {
      handleAliasInput(selection);
    } else if (state.currentMenu === 'balance_result' || 
               state.currentMenu === 'receive_sol' || 
               state.currentMenu === 'sol_history' || 
               state.currentMenu === 'send_dot' || 
               state.currentMenu === 'receive_dot' || 
               state.currentMenu === 'dot_history' || 
               state.currentMenu === 'usdc_solana' || 
               state.currentMenu === 'usdc_polkadot' || 
               state.currentMenu === 'interest_rates' || 
               state.currentMenu === 'withdraw_vault' || 
               state.currentMenu === 'loan_request' || 
               state.currentMenu === 'loan_repayment' || 
               state.currentMenu === 'stake_tokens' || 
               state.currentMenu === 'staking_rewards' || 
               state.currentMenu === 'network_error' || 
               state.currentMenu === 'contact_support' ||
               state.currentMenu === 'swap_sol_usdc' ||
               state.currentMenu === 'swap_dot_usdc' ||
               state.currentMenu === 'cross_chain_swap') {
      handleGenericBackMenu(selection);
    }
  };

  // Handle registration selection
  const handleRegistrationSelection = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
      addMessage('Create PIN:');
      addMessage('Enter 6-digit PIN: ******');
    } else if (selection === '2') {
      setState(prev => ({ ...prev, currentMenu: 'dial' }));
      addMessage('Please enter a new mobile number:');
    } else if (selection === '3') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle registration success
  const handleRegistrationSuccess = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'main' }));
      showMainMenu();
    } else if (selection === '2') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle registration error
  const handleRegistrationError = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'pin' }));
      addMessage('Enter your PIN: ******');
    } else if (selection === '2') {
      setState(prev => ({ ...prev, currentMenu: 'dial' }));
      addMessage('Please enter a new mobile number:');
    } else if (selection === '3') {
      addMessage('Contact Support:');
      addMessage('Call: +1-800-SIMCHAIN');
      addMessage('Email: support@simchain.com');
      addMessage('Hours: 24/7');
      addMessage('');
      addMessage('1 → Back to main menu');
      addMessage('2 → Exit');
      addMessage('');
      addMessage('Select option:');
      setState(prev => ({ ...prev, currentMenu: 'contact_support' }));
    } else if (selection === '4') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle account locked
  const handleAccountLocked = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'pin', pinAttempts: 0 }));
      addMessage('Enter your PIN: ******');
    } else if (selection === '2') {
      addMessage('Contact Support:');
      addMessage('Call: +1-800-SIMCHAIN');
      addMessage('Email: support@simchain.com');
      addMessage('Hours: 24/7');
      addMessage('');
      addMessage('1 → Back to main menu');
      addMessage('2 → Exit');
      addMessage('');
      addMessage('Select option:');
      setState(prev => ({ ...prev, currentMenu: 'contact_support' }));
    } else if (selection === '3') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle main menu selection
  const handleMainMenuSelection = (action: string) => {
    switch (action) {
      case '1':
        showWalletMenu();
        break;
      case '2':
        setState(prev => ({ ...prev, currentMenu: 'alias_input' }));
        addMessage('Set Alias:');
        addMessage('1 → SOL Alias');
        addMessage('2 → DOT Alias');
        addMessage('3 → View Aliases');
        addMessage('4 → Back');
        addMessage('');
        addMessage('Select option:');
        break;
      case '3':
        showServicesMenu();
        break;
      case '4':
        showHelp();
        break;
      case '5':
        endSession();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle wallet selection
  const handleWalletSelection = (selection: string) => {
    switch (selection) {
      case '1':
        showSOLWallet();
        break;
      case '2':
        showDOTWallet();
        break;
      case '3':
        addMessage('USDC (Solana) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to wallet menu');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'usdc_solana' }));
        break;
      case '4':
        addMessage('USDC (Polkadot) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to wallet menu');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'usdc_polkadot' }));
        break;
      case '5':
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle SOL wallet selection
  const handleSOLWalletSelection = (selection: string) => {
    switch (selection) {
      case '1':
        checkBalance();
        break;
      case '2':
        setState(prev => ({ ...prev, currentMenu: 'send_amount' }));
        addMessage('Send SOL:');
        addMessage('Enter recipient SIM: +1234567890');
        break;
      case '3':
        addMessage('Receive SOL:');
        addMessage(`Your address: ${state.walletAddress || 'Not available'}`);
        addMessage('');
        addMessage('1 → Back to SOL wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'receive_sol' }));
        break;
      case '4':
        addMessage('Transaction History - Coming Soon');
        addMessage('');
        addMessage('1 → Back to SOL wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'sol_history' }));
        break;
      case '5':
        showWalletMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle DOT wallet selection
  const handleDOTWalletSelection = (selection: string) => {
    switch (selection) {
      case '1':
        checkBalance();
        break;
      case '2':
        addMessage('Send DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to DOT wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'send_dot' }));
        break;
      case '3':
        addMessage('Receive DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to DOT wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'receive_dot' }));
        break;
      case '4':
        addMessage('Transaction History - Coming Soon');
        addMessage('');
        addMessage('1 → Back to DOT wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'dot_history' }));
        break;
      case '5':
        showWalletMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Check balance
  const checkBalance = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        const balance = result.data.balance;
        addMessage(`
SOL Balance: ${balance} SOL
≈ $${(parseFloat(balance) * 100).toFixed(2)} USD

1 → Send SOL
2 → Receive SOL
3 → Back

Select option:
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'balance_result' }));
      } else {
        addMessage(`❌ Error: ${result.error || 'Failed to check balance'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error');
      addMessage('Unable to connect to blockchain.');
      addMessage('Please try again in a few minutes.');
      addMessage('');
      addMessage('1 → Retry');
      addMessage('2 → Back to main menu');
      addMessage('');
      addMessage('Select option:');
      setState(prev => ({ ...prev, currentMenu: 'network_error' }));
    }
  };

  // Handle send amount
  const handleSendAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }
    setState(prev => ({
      ...prev,
      currentMenu: 'send_recipient',
      tempData: { ...prev.tempData, amount: numAmount }
    }));
    addMessage('Enter recipient mobile number:');
  };

  // Handle send recipient
  const handleSendRecipient = async (recipient: string) => {
    if (!recipient.trim()) {
      addMessage('❌ Please enter a recipient number:');
      return;
    }

    setIsLoading(true);
    const { amount } = state.tempData;
    try {
      const response = await fetch('/api/send-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          pin: '000000', // Use dummy PIN since authenticated
          recipient: recipient,
          amount: amount,
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Transfer successful!
Amount: ${amount} SOL
Recipient: ${recipient}
Tx: ${result.data.txHash}

1. Back to Main Menu
0. Exit
        `.trim());
        setState(prev => ({ 
          ...prev, 
          currentMenu: 'send_result',
          tempData: {}
        }));
      } else {
        addMessage(`❌ Transfer failed: ${result.error || 'Unknown error'}`);
        setState(prev => ({ ...prev, currentMenu: 'main', tempData: {} }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main', tempData: {} }));
    }
  };

  // Handle deposit amount
  const handleDepositAmount = async (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/deposit-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          pin: '000000', // Use dummy PIN since authenticated
          amount: numAmount,
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Deposit successful!
Amount: ${numAmount} SOL
Tx: ${result.data.txHash}

1. Back to Main Menu
0. Exit
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'deposit_result' }));
      } else {
        addMessage(`❌ Deposit failed: ${result.error || 'Unknown error'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main' }));
    }
  };

  // Handle alias input
  const handleAliasInput = async (alias: string) => {
    if (!alias.trim() || alias.length < 3) {
      addMessage('❌ Alias must be at least 3 characters. Try again:');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/set-alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          pin: '000000', // Use dummy PIN since authenticated
          alias: alias,
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Alias set successfully!
New alias: ${alias}

1. Back to Main Menu
0. Exit
        `.trim());
        setState(prev => ({ 
          ...prev, 
          currentMenu: 'alias_result',
          alias: alias
        }));
      } else {
        addMessage(`❌ Failed to set alias: ${result.error || 'Unknown error'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main' }));
    }
  };

  // Show services menu
  const showServicesMenu = () => {
    addMessage(`
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
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'services' }));
  };

  // Handle services selection
  const handleServicesSelection = (selection: string) => {
    switch (selection) {
      case '1':
        addMessage('View Interest Rates - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'interest_rates' }));
        break;
      case '2':
        addMessage('Withdraw from Vault - DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'withdraw_vault' }));
        break;
      case '3':
        addMessage('Loan Request - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'loan_request' }));
        break;
      case '4':
        addMessage('Loan Repayment - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'loan_repayment' }));
        break;
      case '5':
        addMessage('Stake Tokens - DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'stake_tokens' }));
        break;
      case '6':
        addMessage('View Staking Rewards - DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'staking_rewards' }));
        break;
      case '7':
        showSwapTokensMenu();
        break;
      case '8':
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Show swap tokens menu
  const showSwapTokensMenu = () => {
    addMessage(`
Swap Tokens:
1. SOL ↔ DOT
2. SOL ↔ USDC (Solana)
3. DOT ↔ USDC (Polkadot)
4. Cross-chain swap
5. Back

Select option:
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'swap_tokens' }));
  };

  // Handle swap tokens selection
  const handleSwapTokensSelection = (selection: string) => {
    switch (selection) {
      case '1':
        setState(prev => ({ ...prev, currentMenu: 'convert_source_token' }));
        addMessage('Select source token:');
        addMessage('1. SOL');
        addMessage('2. DOT');
        addMessage('');
        addMessage('Select option:');
        break;
      case '2':
        addMessage('SOL ↔ USDC (Solana) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to swap tokens');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'swap_sol_usdc' }));
        break;
      case '3':
        addMessage('DOT ↔ USDC (Polkadot) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to swap tokens');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'swap_dot_usdc' }));
        break;
      case '4':
        addMessage('Cross-chain swap - Coming Soon');
        addMessage('');
        addMessage('1 → Back to swap tokens');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'cross_chain_swap' }));
        break;
      case '5':
        showServicesMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle help submenu
  const handleHelpSubmenu = (selection: string) => {
    switch (selection) {
      case '1':
        if (state.currentMenu === 'help_send_funds') {
          handleHelpSelection('2'); // Next topic: swap tokens
        } else if (state.currentMenu === 'help_swap_tokens') {
          handleHelpSelection('3'); // Next topic: fees
        } else if (state.currentMenu === 'help_fees') {
          handleHelpSelection('4'); // Next topic: contact
        } else if (state.currentMenu === 'help_contact') {
          handleHelpSelection('1'); // Back to first topic
        }
        break;
      case '2':
        showHelp();
        break;
      case '3':
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle generic back menu
  const handleGenericBackMenu = (selection: string) => {
    switch (selection) {
      case '1':
        if (state.currentMenu === 'balance_result') {
          showSOLWallet();
        } else if (state.currentMenu === 'receive_sol' || state.currentMenu === 'sol_history') {
          showSOLWallet();
        } else if (state.currentMenu === 'send_dot' || state.currentMenu === 'receive_dot' || state.currentMenu === 'dot_history') {
          showDOTWallet();
        } else if (state.currentMenu === 'usdc_solana' || state.currentMenu === 'usdc_polkadot') {
          showWalletMenu();
        } else if (state.currentMenu === 'interest_rates' || state.currentMenu === 'withdraw_vault' || 
                   state.currentMenu === 'loan_request' || state.currentMenu === 'loan_repayment' || 
                   state.currentMenu === 'stake_tokens' || state.currentMenu === 'staking_rewards' ||
                   state.currentMenu === 'swap_sol_usdc' || state.currentMenu === 'swap_dot_usdc' ||
                   state.currentMenu === 'cross_chain_swap') {
          showServicesMenu();
        } else if (state.currentMenu === 'network_error') {
          checkBalance();
        } else if (state.currentMenu === 'contact_support') {
          setState(prev => ({ ...prev, currentMenu: 'main' }));
          showMainMenu();
        }
        break;
      case '2':
        if (state.currentMenu === 'balance_result' || state.currentMenu === 'receive_sol' || state.currentMenu === 'sol_history') {
          showSOLWallet();
        } else if (state.currentMenu === 'send_dot' || state.currentMenu === 'receive_dot' || state.currentMenu === 'dot_history') {
          showDOTWallet();
        } else if (state.currentMenu === 'usdc_solana' || state.currentMenu === 'usdc_polkadot') {
          showWalletMenu();
        } else if (state.currentMenu === 'interest_rates' || state.currentMenu === 'withdraw_vault' || 
                   state.currentMenu === 'loan_request' || state.currentMenu === 'loan_repayment' || 
                   state.currentMenu === 'stake_tokens' || state.currentMenu === 'staking_rewards' ||
                   state.currentMenu === 'swap_sol_usdc' || state.currentMenu === 'swap_dot_usdc' ||
                   state.currentMenu === 'cross_chain_swap') {
          showServicesMenu();
        } else if (state.currentMenu === 'network_error' || state.currentMenu === 'contact_support') {
          setState(prev => ({ ...prev, currentMenu: 'main' }));
          showMainMenu();
        }
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Perform health check
  const performHealthCheck = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-connection');
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ System Status: Healthy
Database: Connected
Blockchain: Connected
API: Operational

1. Back to Services
0. Main Menu
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'health_result' }));
      } else {
        addMessage('❌ System check failed. Please try again later.');
        setState(prev => ({ ...prev, currentMenu: 'services' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'services' }));
    }
  };

  // Show help
  const showHelp = () => {
    addMessage(`
Help & Support:
1. How to send funds
2. How to swap tokens
3. Transaction fees
4. Contact support
5. Back

Select option:
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'help' }));
  };

  // Handle help selection
  const handleHelpSelection = (selection: string) => {
    switch (selection) {
      case '1':
        addMessage(`
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
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'help_send_funds' }));
        break;
      case '2':
        addMessage(`
How to swap tokens:
1. Select Services → Swap Tokens
2. Choose token pair
3. Enter amount
4. Confirm swap
5. Wait for confirmation

1 → Next topic
2 → Back to help
3 → Main menu

Select option:
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'help_swap_tokens' }));
        break;
      case '3':
        addMessage(`
Transaction fees:
- Solana: ~0.000005 SOL
- Polkadot: ~0.01 DOT
- Cross-chain: ~0.001 SOL
- DeFi swaps: 0.1% + gas

1 → Next topic
2 → Back to help
3 → Main menu

Select option:
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'help_fees' }));
        break;
      case '4':
        addMessage(`
Contact Support:
Call: +1-800-SIMCHAIN
Email: support@simchain.com
Hours: 24/7

1 → Back to help
2 → Main menu

Select option:
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'help_contact' }));
        break;
      case '5':
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const selection = input.trim();
    setInput('');

    if (state.currentMenu === 'pin' || state.currentMenu === 'register_pin') {
      handlePinValidation(selection);
    } else {
      handleMenuSelection(selection);
    }
  };

  // Add message to display
  const addMessage = (message: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  const showError = (error: string, isFatal: boolean = false) => {
    setErrorMessage(error);
    addMessage(`⚠️ ${error}`);
    if (isFatal) {
      addMessage('');
      addMessage('1 → Try again');
      addMessage('2 → Main menu');
      addMessage('0 → Exit');
      addMessage('');
      addMessage('Select option:');
    }
  };

  const clearError = () => {
    setErrorMessage(null);
  };

  // End session
  const endSession = () => {
    setState({
      isActive: false,
      mobileNumber: '',
      isRegistered: false,
      pinAttempts: 0,
      currentMenu: 'dial',
      menuStack: [],
      tempData: {},
      messages: [],
      alias: null,
      walletAddress: null,
      isAuthenticated: false,
    });
    setInput('');
    setIsLoading(false);
  };

  // Handle convert source token
  const handleConvertSourceToken = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ 
        ...prev, 
        currentMenu: 'convert_target_token',
        tempData: { ...prev.tempData, sourceToken: 'SOL' }
      }));
      addMessage('Select target token:\n1. DOT\n2. SOL');
    } else if (selection === '2') {
      setState(prev => ({ 
        ...prev, 
        currentMenu: 'convert_target_token',
        tempData: { ...prev.tempData, sourceToken: 'DOT' }
      }));
      addMessage('Select target token:\n1. SOL\n2. DOT');
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle convert target token
  const handleConvertTargetToken = (selection: string) => {
    const { sourceToken } = state.tempData;
    let targetToken = '';
    
    if (sourceToken === 'SOL') {
      targetToken = selection === '1' ? 'DOT' : 'SOL';
    } else {
      targetToken = selection === '1' ? 'SOL' : 'DOT';
    }
    
    if (sourceToken === targetToken) {
      addMessage('❌ Source and target tokens must be different. Try again:');
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMenu: 'convert_amount',
      tempData: { ...prev.tempData, targetToken }
    }));
    addMessage(`Enter amount of ${sourceToken} to convert:`);
  };

  // Handle convert amount
  const handleConvertAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }
    
    setState(prev => ({
      ...prev,
      tempData: { ...prev.tempData, amount: numAmount }
    }));
    
    fetchConversionQuote(numAmount);
  };

  // Fetch conversion quote
  const fetchConversionQuote = async (amount: number) => {
    setIsLoading(true);
    const { sourceToken, targetToken } = state.tempData;
    try {
      const response = await fetch(`/api/cross-chain-conversion?sourceChain=${sourceToken === 'SOL' ? 'solana' : 'polkadot'}&targetChain=${targetToken === 'SOL' ? 'solana' : 'polkadot'}&amount=${amount}`);
      const result = await response.json();
      setIsLoading(false);
      if (result.success) {
        const quote = result.data;
        setState(prev => ({
          ...prev,
          tempData: { ...prev.tempData, quote },
          currentMenu: 'convert_confirm'
        }));
        addMessage(`Convert ${amount} ${sourceToken} to ${targetToken}\nRate: 1 ${sourceToken} = ${quote.exchangeRate} ${targetToken}\nFee: ${quote.fees.totalFee} ${sourceToken}\nYou receive: ${quote.targetAmount} ${targetToken}\nProceed? (1-Yes, 2-No)`);
      } else {
        addMessage('❌ Failed to get quote. Try again later.');
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main' }));
    }
  };

  // Handle convert confirm
  const handleConvertConfirm = async (selection: string) => {
    if (selection === '1') {
      // Proceed with conversion
      setIsLoading(true);
      const { sourceToken, targetToken, amount } = state.tempData;
      try {
        const response = await fetch('/api/cross-chain-conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sim: state.mobileNumber,
            pin: '000000', // Use dummy PIN since authenticated
            sourceChain: sourceToken === 'SOL' ? 'solana' : 'polkadot',
            targetChain: targetToken === 'SOL' ? 'solana' : 'polkadot',
            amount,
            sourceToken,
            targetToken
          })
        });
        const result = await response.json();
        setIsLoading(false);
        if (result.success) {
          addMessage(`✅ Conversion successful!\nTx: ${result.data.sourceTx}\nReceived: ${result.data.targetAmount} ${targetToken}`);
        } else {
          addMessage(`❌ Conversion failed: ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        setIsLoading(false);
        addMessage('❌ Network error. Try again.');
      }
      setState(prev => ({ ...prev, currentMenu: 'main', tempData: {} }));
    } else {
      addMessage('Conversion cancelled. Returning to main menu.');
      setState(prev => ({ ...prev, currentMenu: 'main', tempData: {} }));
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-2 sm:p-4">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-2 sm:p-4">
      {/* iPhone 15 Frame - Responsive */}
      <div className="relative flex-shrink-0">
        {/* Phone Body - iPhone 15 */}
        <div className="w-80 h-[640px] sm:w-96 sm:h-[768px] md:w-[28rem] md:h-[896px] lg:w-[32rem] lg:h-[1024px] bg-black rounded-[2rem] sm:rounded-[3rem] shadow-xl sm:shadow-2xl border-4 sm:border-8 border-gray-800 relative overflow-hidden">
          {/* Dynamic Island */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 sm:w-32 h-6 sm:h-8 bg-black rounded-b-2xl sm:rounded-b-3xl z-10"></div>
          
          {/* Screen */}
          <div className="absolute top-8 sm:top-10 left-2 sm:left-3 right-2 sm:right-3 bottom-8 sm:bottom-12 bg-black rounded-[1.5rem] sm:rounded-[2rem]">
            {/* Status Bar */}
            <div className="flex justify-between items-center text-white text-xs sm:text-sm px-4 py-2">
              <span className="font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-sm"></div>
                  <div className="w-0.5 sm:w-1 h-2 sm:h-3 bg-white rounded-sm"></div>
                </div>
                <span className="text-xs ml-1">100%</span>
              </div>
            </div>
            
            {!state.isActive ? (
              /* Phone Number Input Screen */
              <div className="h-full flex flex-col justify-center items-center px-3 sm:px-4 mt-8 sm:mt-10">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="mb-2 sm:mb-3">
                    <Image 
                      src="/Logo.png" 
                      alt="Simchain Logo" 
                      width={48} 
                      height={48} 
                      className="mx-auto sm:w-16 sm:h-16"
                      priority
                    />
                  </div>
                  <h1 className="text-white text-lg sm:text-xl font-bold mb-1 sm:mb-2">USSD Simulator Demo</h1>
                  <p className="text-gray-400 text-xs sm:text-sm">Simchain Wallet</p>
                </div>
                
                <div className="w-full space-y-3 sm:space-y-4">
                  <input
                    type="tel"
                    value={state.mobileNumber}
                    onChange={(e) => setState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="Enter mobile number"
                    className="w-full p-3 sm:p-4 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-center text-sm sm:text-base"
                  />
                  <button
                    onClick={handleDial}
                    className="w-full bg-blue-600 text-white py-3 sm:py-4 px-6 rounded hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Dial *123#
                  </button>
                </div>
              </div>
            ) : (
              /* USSD Session Screen */
              <div className="h-full flex flex-col">
                {/* Session Header */}
                <div className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-800 border-b border-gray-600 flex-shrink-0">
                  <div className="text-xs sm:text-sm text-gray-400">
                    <span>Number: {state.mobileNumber}</span>
                    <span className="float-right">{state.isRegistered ? 'Registered' : 'New'}</span>
                  </div>
                </div>

                {/* USSD Display - Scrollable area */}
                <div className="flex-1 p-2 sm:p-3 bg-black text-green-400 font-mono text-xs sm:text-sm overflow-y-auto min-h-0">
                  {state.messages.map((message, index) => (
                    <div key={index} className="mb-1 sm:mb-2 whitespace-pre-line leading-tight sm:leading-relaxed">
                      {message}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-yellow-400 animate-pulse">⏳</div>
                  )}
                  
                  {/* Input Area - Positioned after content */}
                  <div className="mt-4 p-2 sm:p-3 bg-gray-800 border border-gray-600 rounded">
                    <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-3">
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Enter choice..."
                        className="w-full p-2 sm:p-3 bg-black border border-gray-600 rounded text-green-400 font-mono focus:border-green-500 focus:outline-none text-center text-xs sm:text-sm"
                        disabled={isLoading}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="flex-1 bg-green-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold text-xs sm:text-sm"
                        >
                          Send
                        </button>
                        <button
                          type="button"
                          onClick={endSession}
                          className="flex-1 bg-red-600 text-white py-2 sm:py-3 px-3 sm:px-4 rounded hover:bg-red-700 transition-colors font-semibold text-xs sm:text-sm"
                        >
                          End
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phone Shadow */}
        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 transform -translate-x-1/2 w-64 sm:w-80 h-3 sm:h-4 bg-black opacity-20 rounded-full blur-lg"></div>
      </div>
    </div>
  );
} 