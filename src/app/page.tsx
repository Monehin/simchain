'use client';

import { useState } from 'react';

interface USSDResponse {
  success: boolean;
  message: string;
  error?: string;
}

export default function USSDInterface() {
  const [currentMenu, setCurrentMenu] = useState<'main' | 'create' | 'balance' | 'send' | 'alias'>('main');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sim: '',
    pin: '',
    to_sim: '',
    amount: '',
    alias: ''
  });

  const handleMenuSelection = (option: string) => {
    setResponse('');
    switch (option) {
      case '1':
        setCurrentMenu('create');
        break;
      case '2':
        setCurrentMenu('balance');
        break;
      case '3':
        setCurrentMenu('send');
        break;
      case '4':
        setCurrentMenu('alias');
        break;
      default:
        setResponse('Invalid option. Please try again.');
    }
  };

  const handleInput = async (input: string) => {
    if (loading) return;

    setLoading(true);
    setResponse('');

    try {
      switch (currentMenu) {
        case 'create':
          await createWallet(input);
          break;
        case 'balance':
          await checkBalance(input);
          break;
        case 'send':
          await handleSendFunds(input);
          break;
        case 'alias':
          await setAlias(input);
          break;
        default:
          setResponse('Invalid menu state.');
      }
    } catch (error) {
      setResponse('Error: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createWallet = async (input: string) => {
    const [sim, pin] = input.split('*');
    if (!sim || !pin) {
      setResponse('Format: SIM*PIN\nExample: +2348012345678*MyPin123');
      return;
    }

    const res = await fetch('/api/create-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sim, pin })
    });

    const data: USSDResponse = await res.json();
    setResponse(data.success ? data.message : `Error: ${data.error}`);
    if (data.success) {
      setTimeout(() => setCurrentMenu('main'), 3000);
    }
  };

  const checkBalance = async (sim: string) => {
    const res = await fetch(`/api/check-balance?sim=${encodeURIComponent(sim)}`);
    const data: USSDResponse = await res.json();
    setResponse(data.success ? data.message : `Error: ${data.error}`);
    setTimeout(() => setCurrentMenu('main'), 3000);
  };

  const handleSendFunds = async (input: string) => {
    const [from_sim, to_sim, amount] = input.split('*');
    if (!from_sim || !to_sim || !amount) {
      setResponse('Format: FROM_SIM*TO_SIM*AMOUNT\nExample: +2348012345678*+2348098765432*0.1');
      return;
    }

    const res = await fetch('/api/send-funds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_sim, to_sim, amount })
    });

    const data: USSDResponse = await res.json();
    setResponse(data.success ? data.message : `Error: ${data.error}`);
    if (data.success) {
      setTimeout(() => setCurrentMenu('main'), 3000);
    }
  };

  const setAlias = async (input: string) => {
    const [sim, alias] = input.split('*');
    if (!sim || !alias) {
      setResponse('Format: SIM*ALIAS\nExample: +2348012345678*mywallet');
      return;
    }

    const res = await fetch('/api/set-alias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sim, alias })
    });

    const data: USSDResponse = await res.json();
    setResponse(data.success ? data.message : `Error: ${data.error}`);
    if (data.success) {
      setTimeout(() => setCurrentMenu('main'), 3000);
    }
  };

  const renderMenu = () => {
    switch (currentMenu) {
      case 'main':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">SIMChain USSD Menu</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>1. Create Wallet</span>
                <span className="text-gray-500">→</span>
              </div>
              <div className="flex justify-between">
                <span>2. Check Balance</span>
                <span className="text-gray-500">→</span>
              </div>
              <div className="flex justify-between">
                <span>3. Send Funds</span>
                <span className="text-gray-500">→</span>
              </div>
              <div className="flex justify-between">
                <span>4. Set Alias</span>
                <span className="text-gray-500">→</span>
              </div>
            </div>
            <p className="text-sm text-gray-600">Enter option (1-4):</p>
          </div>
        );
      case 'create':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Create Wallet</h2>
            <p className="text-sm text-gray-600">
              Format: SIM*PIN<br/>
              Example: +2348012345678*MyPin123<br/>
              PIN must be 8+ chars with letters & numbers
            </p>
          </div>
        );
      case 'balance':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Check Balance</h2>
            <p className="text-sm text-gray-600">
              Enter SIM number:<br/>
              Example: +2348012345678
            </p>
          </div>
        );
      case 'send':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Send Funds</h2>
            <p className="text-sm text-gray-600">
              Format: FROM_SIM*TO_SIM*AMOUNT<br/>
              Example: +2348012345678*+2348098765432*0.1
            </p>
          </div>
        );
      case 'alias':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Set Alias</h2>
            <p className="text-sm text-gray-600">
              Format: SIM*ALIAS<br/>
              Example: +2348012345678*mywallet
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        {/* USSD Header */}
        <div className="text-center mb-6">
          <div className="text-2xl font-bold text-blue-600">*906#</div>
          <div className="text-sm text-gray-500">SIMChain Wallet Service</div>
        </div>

        {/* Menu Content */}
        <div className="mb-6">
          {renderMenu()}
        </div>

        {/* Response Display */}
        {response && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-mono whitespace-pre-line">{response}</div>
          </div>
        )}

        {/* Input Section */}
        <div className="space-y-4">
          {currentMenu === 'main' ? (
            <div className="grid grid-cols-2 gap-2">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => handleMenuSelection(num.toString())}
                  className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {num}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter input..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    const target = e.target as HTMLInputElement;
                    handleInput(target.value);
                    target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.querySelector('input') as HTMLInputElement;
                  if (input) {
                    handleInput(input.value);
                    input.value = '';
                  }
                }}
                disabled={loading}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Send'}
              </button>
            </div>
          )}

          {/* Back Button */}
          {currentMenu !== 'main' && (
            <button
              onClick={() => {
                setCurrentMenu('main');
                setResponse('');
              }}
              className="w-full p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Menu
            </button>
          )}
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Demo Mode</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <div>• This is a simulation of the USSD interface</div>
            <div>• No actual transactions are performed</div>
            <div>• Use demo SIM numbers: +2348012345678, +2348098765432</div>
          </div>
        </div>
      </div>
    </div>
  );
} 