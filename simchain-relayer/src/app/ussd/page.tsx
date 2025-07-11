"use client";

import { useState, useEffect } from 'react';
import { PhoneValidator, PinValidator, AliasValidator } from '../../lib/validation';

interface WalletInfo {
  address: string;
  balance: number;
  exists: boolean;
}

interface USSDState {
  isActive: boolean;
  mobileNumber: string;
  isRegistered: boolean;
  pinAttempts: number;
  currentMenu: string;
  menuStack: string[];
  tempData: any;
  messages: string[];
  alias: string | null;
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
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulate wallet existence check
  const checkWalletExists = async (mobileNumber: string) => {
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet-exists',
          sim: mobileNumber
        })
      });
      const result = await response.json();
      return result.success && result.data?.exists;
    } catch (error) {
      console.error('Error checking wallet:', error);
      return false;
    }
  };

  // Simulate wallet info fetch
  const getWalletInfo = async (mobileNumber: string) => {
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet-info',
          sim: mobileNumber
        })
      });
      const result = await response.json();
      return result.success ? result.data : null;
    } catch (error) {
      console.error('Error getting wallet info:', error);
      return null;
    }
  };

  // Handle dial code
  const handleDial = () => {
    if (!state.mobileNumber.trim()) {
      addMessage('❌ Please enter a mobile number first');
      return;
    }

    try {
      const normalizedNumber = PhoneValidator.normalizePhoneNumber(state.mobileNumber);
      setState(prev => ({ ...prev, mobileNumber: normalizedNumber, isActive: true }));
      startSession(normalizedNumber);
    } catch (error) {
      addMessage('❌ Invalid mobile number format');
    }
  };

  // Start USSD session
  const startSession = async (mobileNumber: string) => {
    setIsLoading(true);
    addMessage('Connecting to Simchain...');
    
    const exists = await checkWalletExists(mobileNumber);
    
    setState(prev => ({ 
      ...prev, 
      isRegistered: exists,
      currentMenu: exists ? 'pin' : 'registration',
      menuStack: ['main']
    }));
    
    setIsLoading(false);
    
    if (exists) {
      addMessage('Enter your 6-digit PIN:');
    } else {
      showRegistrationMenu();
    }
  };

  // Show registration menu
  const showRegistrationMenu = () => {
    setState(prev => ({
      ...prev,
      messages: [`
Welcome to Simchain!
You are not registered yet.
1. Register Now
2. Exit
    `.trim()]
    }));
  };

  // Handle PIN validation
  const handlePinValidation = async (pin: string) => {
    // First validate PIN format
    if (!PinValidator.validatePin(pin)) {
      addMessage('❌ PIN must be exactly 6 digits. Try again:');
      return;
    }

    // Verify PIN against stored wallet data
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-pin',
          sim: state.mobileNumber,
          pin
        })
      });
      const result = await response.json();
      
      if (!result.success) {
        const attempts = state.pinAttempts + 1;
        setState(prev => ({ ...prev, pinAttempts: attempts }));
        
        if (attempts >= 3) {
          addMessage('Session expired. Dial *906# again.');
          endSession();
          return;
        }
        
        addMessage(`❌ Incorrect PIN. Try again: (${3 - attempts} attempts left)`);
        return;
      }
    } catch (error) {
      const attempts = state.pinAttempts + 1;
      setState(prev => ({ ...prev, pinAttempts: attempts }));
      
      if (attempts >= 3) {
        addMessage('Session expired. Dial *906# again.');
        endSession();
        return;
      }
      
      addMessage(`❌ Network error. Try again: (${3 - attempts} attempts left)`);
      return;
    }

    // If in registration, call real on-chain registration
    if (state.currentMenu === 'register_pin') {
      setIsLoading(true);
      addMessage('⏳ Registering wallet on-chain...');
      try {
        const response = await fetch('/api/relay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'initialize-wallet',
            sim: state.mobileNumber,
            pin
          })
        });
        const result = await response.json();
        setIsLoading(false);
        
        if (result.success && result.data && result.data.success) {
          // Show success message with transaction signature
          const txSig = result.data.signature;
          const shortTx = txSig ? `${txSig.slice(0, 4)}...${txSig.slice(-4)}` : '';
          addMessage(`
✅ Registration successful!
Wallet created on-chain.
Transaction: ${shortTx}

Redirecting to main menu...
          `.trim());
          
          // Auto-advance to main menu after 3 seconds
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              pinAttempts: 0,
              currentMenu: 'main',
              isRegistered: true
            }));
            showMainMenu();
          }, 3000);
        } else {
          // Show user-friendly error message
          const errorMsg = result.data?.error?.message || result.error || 'Unknown error';
          let userFriendlyError = '⚠️ Registration failed.';
          
          if (errorMsg.includes('already exists')) {
            userFriendlyError = '⚠️ Wallet already exists for this number.';
          } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
            userFriendlyError = '⚠️ Network error. Please check your connection.';
          } else if (errorMsg.includes('insufficient')) {
            userFriendlyError = '⚠️ Insufficient funds for registration.';
          } else {
            userFriendlyError = `⚠️ Registration failed: ${errorMsg}`;
          }
          
          addMessage(userFriendlyError);
        }
      } catch (error) {
        setIsLoading(false);
        addMessage('⚠️ Network error. Please try again later.');
      }
      return;
    }

    // PIN is valid, proceed to main menu (existing user)
    setState(prev => ({ 
      ...prev, 
      pinAttempts: 0,
      currentMenu: 'main'
    }));
    showMainMenu();
  };

  // Show main menu
  const showMainMenu = async () => {
    // Check if alias exists
    const walletInfo = await getWalletInfo(state.mobileNumber);
    const hasAlias = walletInfo?.alias && walletInfo.alias !== '00000000000000000000000000000000';
    
    setState(prev => ({ ...prev, alias: hasAlias ? walletInfo.alias : null }));

    if (hasAlias) {
      setState(prev => ({
        ...prev,
        messages: [`
Simchain Main Menu:
1. Wallets
2. View Address
3. Services
4. Exit
Select (1-4):
        `.trim()]
      }));
    } else {
      setState(prev => ({
        ...prev,
        messages: [`
Simchain Main Menu:
1. Wallets
2. Set Alias
3. View Address
4. Services
5. Exit
Select (1-5):
        `.trim()]
      }));
    }
  };

  // Handle menu selection
  const handleMenuSelection = (selection: string) => {
    const currentMenu = state.currentMenu;
    
    switch (currentMenu) {
      case 'registration':
        handleRegistrationSelection(selection);
        break;
      case 'main':
        handleMainMenuSelection(selection);
        break;
      case 'wallets':
        handleWalletSelection(selection);
        break;
      case 'wallet_detail':
        handleWalletDetailSelection(selection);
        break;
      case 'services':
        handleServicesSelection(selection);
        break;
      case 'set_alias':
        handleAliasSelection(selection);
        break;
      case 'send_amount':
        handleSendAmount(selection);
        break;
      case 'send_recipient':
        handleSendRecipient(selection);
        break;
      case 'deposit_amount':
        handleDepositAmount(selection);
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle registration menu
  const handleRegistrationSelection = (selection: string) => {
    switch (selection) {
      case '1':
        setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
        addMessage('Enter your 6-digit PIN:');
        break;
      case '2':
        endSession();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle main menu
  const handleMainMenuSelection = (selection: string) => {
    const hasAlias = state.alias !== null;
    const maxOptions = hasAlias ? 4 : 5;
    
    if (selection === maxOptions.toString()) {
      endSession();
      return;
    }

    switch (selection) {
      case '1':
        setState(prev => ({ ...prev, currentMenu: 'wallets' }));
        showWalletMenu();
        break;
      case '2':
        if (hasAlias) {
          showWalletAddress();
        } else {
          setState(prev => ({ ...prev, currentMenu: 'set_alias' }));
          addMessage('Choose a 2-12 character alias (letters, digits, underscore, hyphen):');
        }
        break;
      case '3':
        if (hasAlias) {
          setState(prev => ({ ...prev, currentMenu: 'services' }));
          showServicesMenu();
        } else {
          showWalletAddress();
        }
        break;
      case '4':
        if (hasAlias) {
          endSession();
        } else {
          setState(prev => ({ ...prev, currentMenu: 'services' }));
          showServicesMenu();
        }
        break;
      case '5':
        if (!hasAlias) {
          endSession();
        }
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Show wallet menu
  const showWalletMenu = () => {
    setState(prev => ({
      ...prev,
      messages: [`
Wallets:
1. SOL
2. USDC
3. SIM
4. Back
Select (1-4):
      `.trim()]
    }));
  };

  // Handle wallet selection
  const handleWalletSelection = (selection: string) => {
    switch (selection) {
      case '1':
      case '2':
      case '3':
        const tokens = ['SOL', 'USDC', 'SIM'];
        const token = tokens[parseInt(selection) - 1];
        setState(prev => ({ 
          ...prev, 
          currentMenu: 'wallet_detail',
          tempData: { ...prev.tempData, selectedToken: token }
        }));
        showWalletDetailMenu(token);
        break;
      case '4':
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Show wallet detail menu
  const showWalletDetailMenu = (token: string) => {
    const menu = `
${token} Wallet:
1. Check Balance
2. Send ${token}
3. Deposit ${token}
${token === 'SOL' ? '4. Convert to Fiat' : ''}
${token === 'SOL' ? '5' : '4'}. Back
Select (1-${token === 'SOL' ? '5' : '4'}):
    `.trim();
    addMessage(menu);
  };

  // Handle wallet detail selection
  const handleWalletDetailSelection = (selection: string) => {
    const token = state.tempData.selectedToken;
    const maxOptions = token === 'SOL' ? 5 : 4;

    if (selection === maxOptions.toString()) {
      setState(prev => ({ ...prev, currentMenu: 'wallets' }));
      showWalletMenu();
      return;
    }

    switch (selection) {
      case '1':
        checkBalance(token);
        break;
      case '2':
        setState(prev => ({ ...prev, currentMenu: 'send_amount' }));
        addMessage(`Enter amount to send (${token}):`);
        break;
      case '3':
        setState(prev => ({ ...prev, currentMenu: 'deposit_amount' }));
        addMessage(`Enter amount to deposit (${token}):`);
        break;
      case '4':
        if (token === 'SOL') {
          convertToFiat();
        }
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Check balance
  const checkBalance = async (token: string) => {
    setIsLoading(true);
    addMessage('Checking balance...');
    
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'wallet-balance',
          sim: state.mobileNumber
        })
      });
      const result = await response.json();
      
      if (result.success) {
        addMessage(`Your ${token} balance is ${result.data.balance} ${token}`);
      } else {
        addMessage(`⚠️ Failed to get ${token} balance`);
      }
    } catch (error) {
      addMessage('⚠️ Transaction failed. Try again later.');
    }
    
    setIsLoading(false);
    showWalletDetailMenu(token);
  };

  // Handle send amount
  const handleSendAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Try again:');
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMenu: 'send_recipient',
      tempData: { ...prev.tempData, sendAmount: numAmount }
    }));
    addMessage('Enter recipient phone number or alias:');
  };

  // Handle send recipient
  const handleSendRecipient = async (recipient: string) => {
    setIsLoading(true);
    addMessage('Sending transaction...');
    
    try {
      // Simulate send transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      addMessage(`✅ Sent ${state.tempData.sendAmount} ${state.tempData.selectedToken} to ${recipient}`);
    } catch (error) {
      addMessage('⚠️ Transaction failed. Try again later.');
    }
    
    setIsLoading(false);
    showWalletDetailMenu(state.tempData.selectedToken);
  };

  // Handle deposit amount
  const handleDepositAmount = async (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Try again:');
      return;
    }
    
    setIsLoading(true);
    addMessage('Processing deposit...');
    
    try {
      // Simulate deposit transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      addMessage(`✅ Deposited ${numAmount} ${state.tempData.selectedToken}`);
    } catch (error) {
      addMessage('⚠️ Transaction failed. Try again later.');
    }
    
    setIsLoading(false);
    showWalletDetailMenu(state.tempData.selectedToken);
  };

  // Convert to fiat
  const convertToFiat = () => {
    const rate = 50; // Simulated exchange rate
    const amount = state.tempData.sendAmount || 1;
    const fiatAmount = amount * rate;
    addMessage(`💱 ${amount} SOL = $${fiatAmount.toFixed(2)} USD`);
    showWalletDetailMenu('SOL');
  };

  // Show services menu
  const showServicesMenu = () => {
    addMessage(`
Services:
1. Health Check
2. Help
3. Back
Select (1-3):
    `.trim());
  };

  // Handle services selection
  const handleServicesSelection = (selection: string) => {
    switch (selection) {
      case '1':
        performHealthCheck();
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

  // Perform health check
  const performHealthCheck = async () => {
    setIsLoading(true);
    addMessage('Checking system health...');
    
    try {
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health-check' })
      });
      const result = await response.json();
      
      if (result.success) {
        addMessage('✅ System healthy - Connected to Simchain network');
      } else {
        addMessage('⚠️ System health check failed');
      }
    } catch (error) {
      addMessage('⚠️ Health check failed. Try again later.');
    }
    
    setIsLoading(false);
    showServicesMenu();
  };

  // Show help
  const showHelp = () => {
    addMessage(`
📞 Simchain USSD Help:
• Dial *906# to start
• Use 6-digit PIN for security
• Set alias for easy transfers
• Support: support@simchain.com
• Emergency: +1234567890
    `.trim());
    showServicesMenu();
  };

  // Show wallet address
  const showWalletAddress = async () => {
    const walletInfo = await getWalletInfo(state.mobileNumber);
    if (walletInfo) {
      addMessage(`
Your wallet address:
${walletInfo.address}

0. Main Menu
      `.trim());
    } else {
      addMessage('⚠️ Failed to get wallet address');
    }
  };

  // Handle alias selection
  const handleAliasSelection = (alias: string) => {
    if (!AliasValidator.validateAlias(alias)) {
      addMessage('❌ Alias must be 2-12 characters (letters, digits, underscore, hyphen). Try again:');
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMenu: 'alias_confirm',
      tempData: { ...prev.tempData, pendingAlias: alias }
    }));
    addMessage(`
Confirm alias "${alias}"?
1. Yes   2. No
    `.trim());
  };

  // Handle alias confirmation
  const handleAliasConfirmation = async (selection: string) => {
    switch (selection) {
      case '1':
        setIsLoading(true);
        addMessage('Setting alias...');
        
        try {
          // Call the real API to set alias
          const response = await fetch('/api/relay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'set-alias',
              sim: state.mobileNumber,
              alias: state.tempData.pendingAlias
            }),
          });

          const result = await response.json();
          
          if (result.success) {
            setState(prev => ({ 
              ...prev, 
              alias: prev.tempData.pendingAlias,
              currentMenu: 'main'
            }));
            addMessage('✅ Alias set successfully!');
            showMainMenu();
          } else {
            addMessage(`❌ ${result.error}`);
            setState(prev => ({ ...prev, currentMenu: 'set_alias' }));
          }
        } catch (error) {
          addMessage('⚠️ Network error. Please try again later.');
          setState(prev => ({ ...prev, currentMenu: 'set_alias' }));
        }
        
        setIsLoading(false);
        break;
      case '2':
        setState(prev => ({ ...prev, currentMenu: 'set_alias' }));
        addMessage('Choose a 2-12 character alias (letters, digits, underscore, hyphen):');
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (state.currentMenu === 'pin' || state.currentMenu === 'register_pin') {
      handlePinValidation(input);
    } else if (state.currentMenu === 'alias_confirm') {
      handleAliasConfirmation(input);
    } else if (state.currentMenu === 'set_alias') {
      handleAliasSelection(input);
    } else if (state.currentMenu === 'send_amount' || state.currentMenu === 'deposit_amount') {
      handleMenuSelection(input);
    } else if (state.currentMenu === 'send_recipient') {
      handleSendRecipient(input);
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

  // End session
  const endSession = () => {
    addMessage(`
Thank you for using Simchain!
Goodbye.
    `.trim());
    setState(prev => ({
      ...prev,
      isActive: false,
      currentMenu: 'dial',
      menuStack: [],
      tempData: {},
      pinAttempts: 0
    }));
  };

  // Auto-scroll to bottom
  useEffect(() => {
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }, [state.messages]);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white p-4">
            <h1 className="text-xl font-bold">📱 SIMChain USSD Simulator</h1>
            <p className="text-sm opacity-90">Dial *906# to start</p>
          </div>

          {/* Mobile Number Input */}
          {!state.isActive && (
            <div className="p-4 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile Number
              </label>
              <input
                type="tel"
                value={state.mobileNumber}
                onChange={(e) => setState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
              />
            </div>
          )}

          {/* Dial Button */}
          {!state.isActive && (
            <div className="p-4 border-b">
              <button
                onClick={handleDial}
                disabled={!state.mobileNumber.trim()}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                📞 Dial *906#
              </button>
            </div>
          )}

          {/* USSD Messages */}
          <div 
            id="messages"
            className="h-96 overflow-y-auto p-4 bg-gray-50 font-mono text-sm text-gray-900"
          >
            {state.messages.map((message, index) => (
              <div key={index} className="mb-2 whitespace-pre-wrap text-gray-900">
                {message}
              </div>
            ))}
            {isLoading && (
              <div className="text-gray-500">
                ⏳ Processing...
              </div>
            )}
          </div>

          {/* Input Field */}
          {state.isActive && (
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter your selection..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 bg-white"
                  disabled={isLoading}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? '⏳' : 'Send'}
                </button>
              </form>
            </div>
          )}

          {/* Session Info */}
          {state.isActive && (
            <div className="p-4 bg-gray-50 text-xs text-gray-600 border-t">
              <div>📱 {state.mobileNumber}</div>
              <div>🔐 {state.isRegistered ? 'Registered' : 'New User'}</div>
              {state.alias && <div>🏷️ Alias: {state.alias}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 