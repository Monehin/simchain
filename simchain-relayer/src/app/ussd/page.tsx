"use client";

import React from "react";
import Image from 'next/image';

import { useState } from 'react';

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

export default function USSDSimulator() {
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
  const [isTemporaryScreen, setIsTemporaryScreen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
      showError('Please enter a mobile number first');
      return;
    }

    // Basic phone number validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(state.mobileNumber.replace(/\s/g, ''))) {
      showError('Invalid mobile number format');
      return;
    }

    setState(prev => ({ ...prev, mobileNumber: state.mobileNumber, isActive: true }));
    startSession(state.mobileNumber);
  };

  // Start USSD session
  const startSession = async (mobileNumber: string) => {
    setIsLoading(true);
    // Clear previous messages and show welcome
    setState(prev => ({ ...prev, messages: [] }));
    addMessage('Welcome to SIMChain');
    addMessage('*906# → Access SIMChain');
    addMessage('');
    addMessage('Checking registration status...');
    addMessage('⏳ Please wait...');
    
    const exists = await checkWalletExists(mobileNumber);
    
    setState(prev => ({ 
      ...prev, 
      isRegistered: exists,
      currentMenu: exists ? 'pin' : 'registration_choice',
      menuStack: ['main']
    }));
    
    setIsLoading(false);
    
    if (exists) {
      // Clear screen and show login prompt
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Welcome back!');
      addMessage('Enter your PIN: ******');
    } else {
      showRegistrationChoice();
    }
  };

  // Show registration choice
  const showRegistrationChoice = () => {
    // Clear screen and show registration choice
    setState(prev => ({ ...prev, messages: [] }));
    addMessage('Phone number not registered.');
    addMessage('');
    addMessage('1 → Register');
    addMessage('2 → Exit');
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
      // Clear screen and show processing
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('PIN created successfully!');
      addMessage('');
      addMessage('Creating wallet...');
      addMessage('⏳ Processing...');
      
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
          // Clear screen and show success briefly
          setState(prev => ({ ...prev, messages: [] }));
          addMessage('✅ Registration successful!');
          addMessage('Wallet created on Solana');
          addMessage(`Address: ${result.data.walletAddress}`);
          addMessage(`Alias: ${result.data.alias}`);
          
          // Disable buttons during temporary screen
          setIsTemporaryScreen(true);
          
          // Auto-advance to main menu after 3 seconds
          setTimeout(() => {
            setState(prev => ({ 
              ...prev, 
              currentMenu: 'main',
              isAuthenticated: true,
              alias: result.data.alias,
              walletAddress: result.data.walletAddress
            }));
            setIsTemporaryScreen(false);
            showMainMenu();
          }, 3000);
        } else {
          // Clear screen and show error
          setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show error
        setState(prev => ({ ...prev, messages: [] }));
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
          // Clear screen and show lockout
          setState(prev => ({ ...prev, messages: [] }));
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
        
        // Clear screen and show retry
        setState(prev => ({ ...prev, messages: [] }));
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
      // Clear screen and show success
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('✅ Login successful!');
      addMessage('');
      showMainMenu();
    } catch (error) {
      const attempts = state.pinAttempts + 1;
      setState(prev => ({ ...prev, pinAttempts: attempts }));
      
      if (attempts >= 3) {
        // Clear screen and show lockout
        setState(prev => ({ ...prev, messages: [] }));
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
      
      // Clear screen and show retry
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('❌ Network error. Try again.');
      addMessage(`Attempts remaining: ${3 - attempts}`);
      addMessage('');
      addMessage('Enter PIN: ******');
    }
  };

  // Show main menu
  const showMainMenu = () => {
    // Clear screen and show main menu
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
    // Clear screen and show wallet menu
    setState(prev => ({ ...prev, messages: [] }));
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
    // Clear screen and show SOL wallet
    setState(prev => ({ ...prev, messages: [] }));
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
    // Clear screen and show DOT wallet
    setState(prev => ({ ...prev, messages: [] }));
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
    if (state.currentMenu === 'registration_choice') {
      handleRegistrationChoice(selection);
    } else if (state.currentMenu === 'registration') {
      handleRegistrationSelection(selection);

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

  // Handle registration choice
  const handleRegistrationChoice = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
      // Clear screen and show PIN creation
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Create PIN:');
      addMessage('Enter 6-digit PIN: ******');
    } else if (selection === '2') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle registration selection
  const handleRegistrationSelection = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
      // Clear screen and show PIN creation
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Create PIN:');
      addMessage('Enter 6-digit PIN: ******');
    } else if (selection === '2') {
      setState(prev => ({ ...prev, currentMenu: 'dial' }));
      // Clear screen and show number input
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Please enter a new mobile number:');
    } else if (selection === '3') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };



  // Handle registration error
  const handleRegistrationError = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'pin' }));
      // Clear screen and show PIN input
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Enter your PIN: ******');
    } else if (selection === '2') {
      setState(prev => ({ ...prev, currentMenu: 'dial' }));
      // Clear screen and show number input
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Please enter a new mobile number:');
    } else if (selection === '3') {
      // Clear screen and show contact info
      setState(prev => ({ ...prev, messages: [] }));
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
      // Clear screen and show PIN input
      setState(prev => ({ ...prev, messages: [] }));
      addMessage('Enter your PIN: ******');
    } else if (selection === '2') {
      // Clear screen and show contact info
      setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show alias menu
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('USDC (Solana) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to wallet menu');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'usdc_solana' }));
        break;
      case '4':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show send prompt
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Send SOL:');
        addMessage('Enter recipient SIM: +1234567890');
        break;
      case '3':
        // Clear screen and show receive info
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Send DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to DOT wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'send_dot' }));
        break;
      case '3':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Receive DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to DOT wallet');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'receive_dot' }));
        break;
      case '4':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
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
    // Clear screen and show loading
    setState(prev => ({ ...prev, messages: [] }));
    addMessage('⏳ Checking balance...');
    
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
        // Clear screen and show balance
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show error
        setState(prev => ({ ...prev, messages: [] }));
        addMessage(`❌ Error: ${result.error || 'Failed to check balance'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      // Clear screen and show error
      setState(prev => ({ ...prev, messages: [] }));
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
    // Clear screen and show services menu
    setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('View Interest Rates - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'interest_rates' }));
        break;
      case '2':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Withdraw from Vault - DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'withdraw_vault' }));
        break;
      case '3':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Loan Request - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'loan_request' }));
        break;
      case '4':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Loan Repayment - SOL - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'loan_repayment' }));
        break;
      case '5':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Stake Tokens - DOT - Coming Soon');
        addMessage('');
        addMessage('1 → Back to services');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'stake_tokens' }));
        break;
      case '6':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
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
    // Clear screen and show swap tokens menu
    setState(prev => ({ ...prev, messages: [] }));
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
Solana: Connected
Services: Operational

1. Back to Services
0. Back to Main Menu
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'health_result' }));
      } else {
        addMessage(`❌ System Status: Issues detected\n${result.error || 'Unknown error'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main' }));
    }
  };

  // Show help
  const showHelp = () => {
    // Clear screen and show help menu
    setState(prev => ({ ...prev, messages: [] }));
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

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (state.currentMenu === 'pin' || state.currentMenu === 'register_pin') {
      handlePinValidation(input);
    } else {
      handleMenuSelection(input);
    }
    setInput('');
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
  };

  // Cross-chain conversion handlers
  const handleConvertSourceToken = (selection: string) => {
    let sourceToken = '';
    if (selection === '1') sourceToken = 'SOL';
    else if (selection === '2') sourceToken = 'DOT';
    else {
      addMessage('❌ Invalid selection. Try again:');
      return;
    }
    setState(prev => ({
      ...prev,
      currentMenu: 'convert_target_token',
      tempData: { ...prev.tempData, sourceToken }
    }));
    addMessage('Select target token:\n1. SOL\n2. DOT');
  };

  const handleConvertTargetToken = (selection: string) => {
    let targetToken = '';
    if (selection === '1') targetToken = 'SOL';
    else if (selection === '2') targetToken = 'DOT';
    else {
      addMessage('❌ Invalid selection. Try again:');
      return;
    }
    // Prevent same token
    if (targetToken === state.tempData.sourceToken) {
      addMessage('❌ Source and target tokens must be different.');
      setState(prev => ({ ...prev, currentMenu: 'convert_source_token' }));
      return;
    }
    setState(prev => ({
      ...prev,
      currentMenu: 'convert_amount',
      tempData: { ...prev.tempData, targetToken }
    }));
    addMessage('Enter amount to convert:');
  };

  const handleConvertAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }
    setState(prev => ({
      ...prev,
      currentMenu: 'convert_quote',
      tempData: { ...prev.tempData, amount: numAmount }
    }));
    fetchConversionQuote(numAmount);
  };

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

  // Handle help selection
  const handleHelpSelection = (selection: string) => {
    switch (selection) {
      case '1':
        // Clear screen and show help topic
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show help topic
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show help topic
        setState(prev => ({ ...prev, messages: [] }));
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
        // Clear screen and show help topic
        setState(prev => ({ ...prev, messages: [] }));
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

  // Handle swap tokens selection
  const handleSwapTokensSelection = (selection: string) => {
    switch (selection) {
      case '1':
        setState(prev => ({ ...prev, currentMenu: 'convert_source_token' }));
        // Clear screen and show token selection
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('Select source token:');
        addMessage('1. SOL');
        addMessage('2. DOT');
        addMessage('');
        addMessage('Select option:');
        break;
      case '2':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('SOL ↔ USDC (Solana) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to swap tokens');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'swap_sol_usdc' }));
        break;
      case '3':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
        addMessage('DOT ↔ USDC (Polkadot) - Coming Soon');
        addMessage('');
        addMessage('1 → Back to swap tokens');
        addMessage('2 → Main menu');
        addMessage('');
        addMessage('Select option:');
        setState(prev => ({ ...prev, currentMenu: 'swap_dot_usdc' }));
        break;
      case '4':
        // Clear screen and show coming soon
        setState(prev => ({ ...prev, messages: [] }));
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Instructions Panel - Left Side */}
      <div className="mr-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg p-6 max-w-sm border border-blue-200">
        <h3 className="font-semibold text-gray-800 mb-3">📱 USSD Instructions:</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li>• Enter mobile number and dial *906#</li>
          <li>• New users: Register with 6-digit PIN</li>
          <li>• Existing users: Enter your PIN</li>
          <li>• Navigate with number keys (1, 2, 3...)</li>
          <li>• Use "0" to exit or go back</li>
        </ul>
      </div>

      {/* Feature Phone Frame - Centered */}
      <div className="relative flex-shrink-0">
        {/* Phone Body - Nokia-style feature phone */}
        <div className="w-96 h-[650px] bg-gray-800 rounded-2xl shadow-2xl border-4 border-gray-700 relative overflow-hidden">
          {/* Antenna */}
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-1 h-3 bg-gray-600"></div>
          
          {/* Speaker */}
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-600 rounded-full"></div>
          
          {/* Screen */}
          <div className="absolute top-8 left-2 right-2 bottom-40 bg-gray-900 border-2 border-gray-600 rounded-lg">
            {!state.isActive ? (
              /* Phone Number Input Screen */
              <div className="h-full flex flex-col justify-center items-center px-4">
                <div className="text-center mb-6">
                  <div className="mb-3">
                    <Image 
                      src="/Logo.png" 
                      alt="Simchain Logo" 
                      width={64} 
                      height={64} 
                      className="mx-auto"
                      priority
                    />
                  </div>
                  <h1 className="text-white text-xl font-bold mb-2">USSD Simulator</h1>
                  <p className="text-gray-400 text-sm">Simchain Wallet</p>
                </div>
                
                <div className="w-full space-y-4">
                  <input
                    type="tel"
                    value={state.mobileNumber}
                    onChange={(e) => setState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="Enter mobile number"
                    disabled={isLoading}
                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-center text-base disabled:opacity-50"
                  />
                                      <button
                      onClick={handleDial}
                      disabled={isLoading}
                      className="w-full bg-blue-600 text-white py-4 px-6 rounded hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold text-base"
                    >
                      {isLoading ? '⏳' : 'Dial *906#'}
                    </button>
                </div>
              </div>
            ) : (
              /* USSD Session Screen */
              <div className="h-full flex flex-col">
                {/* Session Header */}
                <div className="px-3 py-2 bg-gray-800 border-b border-gray-600">
                  <div className="text-sm text-gray-400">
                    <span>Number: {state.mobileNumber}</span>
                    <span className="float-right">{state.isRegistered ? 'Registered' : 'New'}</span>
                  </div>
                </div>

                {/* USSD Display */}
                <div className="flex-1 p-3 bg-black text-green-400 font-mono text-sm overflow-y-auto">
                  {state.messages.map((message, index) => (
                    <div key={index} className="mb-2 whitespace-pre-line leading-relaxed">
                      {message}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="text-yellow-400 animate-pulse">⏳</div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-3 bg-gray-800 border-t border-gray-600">
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter choice..."
                      className="w-full p-3 bg-black border border-gray-600 rounded text-green-400 font-mono focus:border-green-500 focus:outline-none text-center text-sm"
                      disabled={isLoading || isTemporaryScreen}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={isLoading || isTemporaryScreen}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold text-sm"
                      >
                        {isLoading ? '⏳' : isTemporaryScreen ? '⏳' : 'Send'}
                      </button>
                      <button
                        type="button"
                        onClick={endSession}
                        disabled={isLoading || isTemporaryScreen}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded hover:bg-red-700 transition-colors disabled:opacity-50 font-semibold text-sm"
                      >
                        {isLoading || isTemporaryScreen ? 'Disabled' : 'End'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* Physical Keypad */}
          <div className="absolute bottom-3 left-3 right-3 h-36 bg-gray-700 rounded-lg p-3">
            <div className="grid grid-cols-3 gap-2 h-full">
              {/* Number keys 1-9 */}
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <div key={num} className="bg-gray-600 rounded flex items-center justify-center text-white text-lg font-bold">
                  {num}
                </div>
              ))}
              {/* Bottom row: *, 0, # */}
              <div className="bg-gray-600 rounded flex items-center justify-center text-white text-lg font-bold">*</div>
              <div className="bg-gray-600 rounded flex items-center justify-center text-white text-lg font-bold">0</div>
              <div className="bg-gray-600 rounded flex items-center justify-center text-white text-lg font-bold">#</div>
            </div>
          </div>
        </div>

        {/* Phone Shadow */}
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-80 h-4 bg-black opacity-20 rounded-full blur-lg"></div>
      </div>
    </div>
  );
} 