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
    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      addMessage('❌ PIN must be exactly 6 digits. Try again:');
      return;
    }

    // If in registration, create wallet
    if (state.currentMenu === 'register_pin') {
      setIsLoading(true);
      addMessage('⏳ Registering wallet on-chain...');
      
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
          addMessage(`
✅ Registration successful!
Wallet created on-chain.
Address: ${result.data.walletAddress.slice(0, 8)}...${result.data.walletAddress.slice(-8)}
Alias: ${result.data.alias}

Redirecting to main menu...
          `.trim());
          
          // Auto-advance to main menu after 3 seconds
          setTimeout(() => {
            setState(prev => ({
              ...prev,
              pinAttempts: 0,
              currentMenu: 'main',
              isRegistered: true,
              walletAddress: result.data.walletAddress,
              alias: result.data.alias,
              isAuthenticated: true
            }));
            showMainMenu();
          }, 3000);
        } else {
          const errorMsg = result.error || 'Unknown error';
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
          addMessage('Session expired. Dial *906# again.');
          endSession();
          return;
        }
        
        addMessage(`❌ Incorrect PIN. Try again: (${3 - attempts} attempts left)`);
        return;
      }

      // PIN is valid, mark as authenticated and proceed to main menu
      setState(prev => ({ 
        ...prev, 
        pinAttempts: 0,
        currentMenu: 'main',
        isAuthenticated: true
      }));
      showMainMenu();
    } catch (error) {
      const attempts = state.pinAttempts + 1;
      setState(prev => ({ ...prev, pinAttempts: attempts }));
      
      if (attempts >= 3) {
        addMessage('Session expired. Dial *906# again.');
        endSession();
        return;
      }
      
      addMessage(`❌ Network error. Try again: (${3 - attempts} attempts left)`);
    }
  };

  // Show main menu
  const showMainMenu = () => {
    setState(prev => ({
      ...prev,
      messages: [`
Simchain Mobile Money
1. Check Balance
2. Send Money
3. Deposit Money
4. Set Alias
5. Services
6. Cross-Chain Convert
0. Exit
    `.trim()]
    }));
  };

  // Handle menu selection
  const handleMenuSelection = (selection: string) => {
    if (state.currentMenu === 'registration') {
      handleRegistrationSelection(selection);
    } else if (state.currentMenu === 'main') {
      handleMainMenuSelection(selection);
    } else if (state.currentMenu === 'services') {
      handleServicesSelection(selection);
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
    }
  };

  // Handle registration selection
  const handleRegistrationSelection = (selection: string) => {
    if (selection === '1') {
      setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
      addMessage('Enter a 6-digit PIN for your wallet:');
    } else if (selection === '2') {
      endSession();
    } else {
      addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle main menu selection
  const handleMainMenuSelection = (action: string) => {
    switch (action) {
      case '1':
        checkBalance();
        break;
      case '2':
        setState(prev => ({ ...prev, currentMenu: 'send_amount' }));
        addMessage('Enter amount to send:');
        break;
      case '3':
        setState(prev => ({ ...prev, currentMenu: 'deposit_amount' }));
        addMessage('Enter amount to deposit:');
        break;
      case '4':
        setState(prev => ({ ...prev, currentMenu: 'alias_input' }));
        addMessage('Enter your preferred alias:');
        break;
      case '5':
        showServicesMenu();
        break;
      case '6':
        setState(prev => ({ ...prev, currentMenu: 'convert_source_token' }));
        addMessage('Select source token:\n1. SOL\n2. DOT');
        break;
      case '0':
        endSession();
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
Balance: ${balance} SOL
Alias: ${result.data.alias || 'Not set'}

1. Back to Main Menu
0. Exit
        `.trim());
        setState(prev => ({ ...prev, currentMenu: 'balance_result' }));
      } else {
        addMessage(`❌ Error: ${result.error || 'Failed to check balance'}`);
        setState(prev => ({ ...prev, currentMenu: 'main' }));
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Try again.');
      setState(prev => ({ ...prev, currentMenu: 'main' }));
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
    setState(prev => ({
      ...prev,
      messages: [`
Services
1. Health Check
2. Help
0. Back to Main Menu
    `.trim()]
    }));
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
      case '0':
        showMainMenu();
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
    addMessage(`
Help & Support
- Dial *906# to access Simchain
- Use number keys to navigate menus
- Enter 0 to go back or exit
- Keep your PIN secure
- Contact support for issues

1. Back to Services
0. Back to Main Menu
    `.trim());
    setState(prev => ({ ...prev, currentMenu: 'help_result' }));
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
                  <p className="text-gray-400 text-sm">Simchain Mobile Money</p>
                </div>
                
                <div className="w-full space-y-4">
                  <input
                    type="tel"
                    value={state.mobileNumber}
                    onChange={(e) => setState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="Enter mobile number"
                    className="w-full p-4 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none text-center text-base"
                  />
                  <button
                    onClick={handleDial}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded hover:bg-blue-700 transition-colors font-semibold text-base"
                  >
                    Dial *906#
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
                    <div className="text-yellow-400 animate-pulse">⏳ Processing...</div>
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
                      disabled={isLoading}
                    />
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-green-600 text-white py-3 px-4 rounded hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold text-sm"
                      >
                        Send
                      </button>
                      <button
                        type="button"
                        onClick={endSession}
                        className="flex-1 bg-red-600 text-white py-3 px-4 rounded hover:bg-red-700 transition-colors font-semibold text-sm"
                      >
                        End
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