"use client";

import { useState } from 'react';

interface WalletInfo {
  address: string;
  balance: number;
  exists: boolean;
  alias?: string;
}

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
  isAuthenticated: boolean; // Track if user is authenticated without storing PIN
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
              isAuthenticated: true // Mark as authenticated after successful registration
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
        isAuthenticated: true // Mark as authenticated without storing PIN
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
6. Help
0. Exit
    `.trim()]
    }));
  };

  // Handle menu selection
  const handleMenuSelection = (selection: string) => {
    switch (selection) {
      case '1':
        handleMainMenuSelection('balance');
        break;
      case '2':
        handleMainMenuSelection('send');
        break;
      case '3':
        handleMainMenuSelection('deposit');
        break;
      case '4':
        handleMainMenuSelection('alias');
        break;
      case '5':
        handleMainMenuSelection('services');
        break;
      case '6':
        handleMainMenuSelection('help');
        break;
      case '0':
        endSession();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle registration selection
  const handleRegistrationSelection = (selection: string) => {
    switch (selection) {
      case '1':
        setState(prev => ({ ...prev, currentMenu: 'register_pin' }));
        addMessage('Enter a 6-digit PIN for your wallet:');
        break;
      case '2':
        endSession();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Handle main menu selection
  const handleMainMenuSelection = (action: string) => {
    switch (action) {
      case 'balance':
        checkBalance();
        break;
      case 'send':
        setState(prev => ({ ...prev, currentMenu: 'send_amount' }));
        addMessage('Enter amount to send (SOL):');
        break;
      case 'deposit':
        setState(prev => ({ ...prev, currentMenu: 'deposit_amount' }));
        addMessage('Enter amount to deposit (SOL):');
        break;
      case 'alias':
        setState(prev => ({ ...prev, currentMenu: 'alias_input' }));
        addMessage('Enter your preferred alias:');
        break;
      case 'services':
        showServicesMenu();
        break;
      case 'help':
        showHelp();
        break;
    }
  };

  // Check balance
  const checkBalance = async () => {
    if (!state.isAuthenticated) {
      addMessage('❌ Session expired. Please dial *906# again.');
      endSession();
      return;
    }

    setIsLoading(true);
    addMessage('⏳ Checking balance...');
    
    try {
      const response = await fetch('/api/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          pin: '000000', // Use dummy PIN since user is already authenticated
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        const balance = result.data.balance;
        const alias = result.data.alias || 'No alias set';
        const walletAddress = state.walletAddress || result.data.walletAddress || 'Unknown';
        addMessage(`
Balance: ${balance.toFixed(4)} SOL
Alias: ${alias}
Address: ${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}

Press any key to continue...
        `.trim());
      } else {
        addMessage('❌ Failed to check balance. Please try again.');
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Please try again.');
    }
  };

  // Handle send amount input
  const handleSendAmount = (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMenu: 'send_recipient',
      tempData: { ...prev.tempData, sendAmount: numAmount }
    }));
    addMessage('Enter recipient phone number:');
  };

  // Handle send recipient input
  const handleSendRecipient = async (recipient: string) => {
    if (!state.isAuthenticated) {
      addMessage('❌ Session expired. Please dial *906# again.');
      endSession();
      return;
    }

    setIsLoading(true);
    addMessage('⏳ Sending money...');
    
    try {
      const response = await fetch('/api/send-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromSim: state.mobileNumber,
          toSim: recipient,
          amount: state.tempData.sendAmount,
          pin: '000000', // Use dummy PIN since user is already authenticated
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Money sent successfully!
Amount: ${state.tempData.sendAmount} SOL
To: ${recipient}
Transaction: ${result.data.signature.slice(0, 8)}...${result.data.signature.slice(-8)}

Press any key to continue...
        `.trim());
      } else {
        addMessage(`❌ Send failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Please try again.');
    }
    
    setState(prev => ({ 
      ...prev, 
      currentMenu: 'main',
      tempData: {}
    }));
  };

  // Handle deposit amount input
  const handleDepositAmount = async (amount: string) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      addMessage('❌ Invalid amount. Enter a positive number:');
      return;
    }
    
    setIsLoading(true);
    addMessage('⏳ Depositing money...');
    
    try {
      const response = await fetch('/api/deposit-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          amount: numAmount,
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Money deposited successfully!
Amount: ${numAmount} SOL
Transaction: ${result.data.signature.slice(0, 8)}...${result.data.signature.slice(-8)}

Press any key to continue...
        `.trim());
      } else {
        addMessage(`❌ Deposit failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Please try again.');
    }
    
    setState(prev => ({ ...prev, currentMenu: 'main' }));
  };

  // Handle alias input
  const handleAliasInput = async (alias: string) => {
    if (!state.isAuthenticated) {
      addMessage('❌ Session expired. Please dial *906# again.');
      endSession();
      return;
    }

    if (alias.length < 3 || alias.length > 20) {
      addMessage('❌ Alias must be 3-20 characters. Try again:');
      return;
    }
    
    setIsLoading(true);
    addMessage('⏳ Setting alias...');
    
    try {
      const response = await fetch('/api/set-alias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sim: state.mobileNumber,
          alias: alias,
          pin: '000000', // Use dummy PIN since user is already authenticated
          country: 'RW'
        })
      });
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ Alias set successfully!
New alias: ${alias}

Press any key to continue...
        `.trim());
        setState(prev => ({ ...prev, alias: alias }));
      } else {
        addMessage(`❌ Failed to set alias: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Network error. Please try again.');
    }
    
    setState(prev => ({ ...prev, currentMenu: 'main' }));
  };

  // Show services menu
  const showServicesMenu = () => {
    setState(prev => ({
      ...prev,
      messages: [`
Services
1. Health Check
2. Back to Main Menu
0. Exit
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
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
        break;
      case '0':
        endSession();
        break;
      default:
        addMessage('❌ Invalid selection. Try again:');
    }
  };

  // Perform health check
  const performHealthCheck = async () => {
    setIsLoading(true);
    addMessage('⏳ Performing health check...');
    
    try {
      const response = await fetch('/api/test-connection');
      const result = await response.json();
      setIsLoading(false);
      
      if (result.success) {
        addMessage(`
✅ System Status: Healthy
Validator: Connected
Program: Deployed
Program ID: ${result.data.programId.slice(0, 8)}...${result.data.programId.slice(-8)}

Press any key to continue...
        `.trim());
      } else {
        addMessage('❌ System Status: Unhealthy');
      }
    } catch (error) {
      setIsLoading(false);
      addMessage('❌ Health check failed');
    }
  };

  // Show help
  const showHelp = () => {
    setState(prev => ({
      ...prev,
      messages: [`
Help & Support
- Dial *906# to access Simchain
- PIN must be 6 digits
- Keep your PIN secure
- Contact support for issues

Press any key to continue...
    `.trim()]
    }));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLoading) return;
    
    const trimmedInput = input.trim();
    if (!trimmedInput) return;
    
    setInput('');
    
    switch (state.currentMenu) {
      case 'pin':
      case 'register_pin':
        handlePinValidation(trimmedInput);
        break;
      case 'registration':
        handleRegistrationSelection(trimmedInput);
        break;
      case 'main':
        handleMenuSelection(trimmedInput);
        break;
      case 'send_amount':
        handleSendAmount(trimmedInput);
        break;
      case 'send_recipient':
        handleSendRecipient(trimmedInput);
        break;
      case 'deposit_amount':
        handleDepositAmount(trimmedInput);
        break;
      case 'alias_input':
        handleAliasInput(trimmedInput);
        break;
      case 'services':
        handleServicesSelection(trimmedInput);
        break;
      default:
        // Continue to main menu for any other input
        setState(prev => ({ ...prev, currentMenu: 'main' }));
        showMainMenu();
    }
  };

  // Add message to the conversation
  const addMessage = (message: string) => {
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, message]
    }));
  };

  // End USSD session
  const endSession = () => {
    setState(prev => ({
      ...prev,
      isActive: false,
      currentMenu: 'dial',
      menuStack: [],
      tempData: {},
      messages: [],
      pinAttempts: 0,
      isAuthenticated: false // Clear authentication state
    }));
    addMessage('Session ended. Thank you for using Simchain!');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4">
            <h1 className="text-xl font-bold">USSD Simulator</h1>
            <p className="text-sm opacity-90">Simchain Mobile Money</p>
          </div>

          {/* Phone Number Input */}
          {!state.isActive && (
            <div className="p-4 border-b">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Mobile Number:
              </label>
                              <input
                  type="tel"
                  value={state.mobileNumber}
                  onChange={(e) => setState(prev => ({ ...prev, mobileNumber: e.target.value }))}
                  placeholder="+1234567890"
                  className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                />
              <button
                onClick={handleDial}
                className="mt-2 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Dial *906#
              </button>
            </div>
          )}

          {/* USSD Session */}
          {state.isActive && (
            <>
              {/* Session Info */}
              <div className="p-4 bg-gray-50 border-b">
                <div className="text-sm text-gray-600">
                  <p><strong>Number:</strong> {state.mobileNumber}</p>
                  <p><strong>Status:</strong> {state.isRegistered ? 'Registered' : 'New User'}</p>
                  {state.walletAddress && (
                    <p><strong>Wallet:</strong> {state.walletAddress.slice(0, 8)}...{state.walletAddress.slice(-8)}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="p-4 h-96 overflow-y-auto bg-black text-green-400 font-mono text-sm">
                {state.messages.map((message, index) => (
                  <div key={index} className="mb-2 whitespace-pre-line">
                    {message}
                  </div>
                ))}
                {isLoading && (
                  <div className="text-yellow-400">⏳ Processing...</div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Enter your choice..."
                    className="flex-1 p-2 border border-gray-300 rounded focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
                <button
                  type="button"
                  onClick={endSession}
                  className="mt-2 w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition-colors"
                >
                  End Session
                </button>
              </form>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Instructions:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Enter a mobile number and click "Dial *906#"</li>
            <li>• For new users: Register with a 6-digit PIN</li>
            <li>• For existing users: Enter your PIN</li>
            <li>• Navigate menus using number keys (1, 2, 3, etc.)</li>
            <li>• Use "0" to exit or go back</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 