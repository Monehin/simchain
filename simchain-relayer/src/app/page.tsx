"use client";

import React, { useState } from 'react';

const USSD_MENUS = {
  phoneInput: {
    prompt: 'SIMChain USSD Service\nEnter your phone number:',
    options: [],
  },
  main: {
    prompt: 'Welcome to SIMChain\n1. Create Wallet\n2. Check Balance\n3. Send Funds\n4. Set Alias',
    options: ['1', '2', '3', '4'],
  },
  createWallet: {
    prompt: 'Create Wallet\nEnter 4-digit PIN:',
    options: [],
  },
  sendFunds: {
    prompt: 'Send Funds\nEnter receiver phone:',
    options: [],
  },
  sendAmount: {
    prompt: 'Enter amount:',
    options: [],
  },
  setAlias: {
    prompt: 'Set Alias\nEnter alias (max 12 chars):',
    options: [],
  },
  loading: {
    prompt: 'Processing...\nPlease wait.',
    options: [],
  },
};

export default function Home() {
  const [screen, setScreen] = useState('input');
  const [input, setInput] = useState('');
  const [session, setSession] = useState({ menu: 'phoneInput', step: 0, data: {} });
  const [display, setDisplay] = useState('Enter USSD code (e.g., *906#):');
  const [userPhone, setUserPhone] = useState('');
  const [tempData, setTempData] = useState({});

  const resetSession = () => {
    setScreen('input');
    setInput('');
    setSession({ menu: 'phoneInput', step: 0, data: {} });
    setDisplay('Enter USSD code (e.g., *906#):');
    setUserPhone('');
    setTempData({});
  };

  // Reset session on page reload
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      resetSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const callAPI = async (endpoint: string, data?: any) => {
    setSession({ menu: 'loading', step: 0, data: {} });
    setDisplay(USSD_MENUS.loading.prompt);
    
    try {
      const response = await fetch(endpoint, {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setDisplay(`Success!\n${result.message || 'Operation completed.'}`);
      } else {
        setDisplay(`Error: ${result.error || 'Operation failed.'}`);
      }
    } catch (error) {
      setDisplay('Error: Network error. Please try again.');
    }
    
    setScreen('done');
  };

  const handleKey = (val: string) => {
    if (screen === 'input') {
      if (val === 'OK') {
        if (input === '*906#') {
          setSession({ menu: 'phoneInput', step: 0, data: {} });
          setDisplay(USSD_MENUS.phoneInput.prompt);
          setScreen('menu');
          setInput('');
        } else {
          setDisplay('Invalid USSD code. Try *906#');
          setInput('');
        }
      } else if (val === 'CLR') {
        setInput('');
      } else {
        setInput(input + val);
      }
    } else if (screen === 'menu') {
      if (session.menu === 'phoneInput') {
        if (val === 'OK' && input.trim()) {
          setUserPhone(input.trim());
          setSession({ menu: 'main', step: 0, data: {} });
          setDisplay(USSD_MENUS.main.prompt);
          setInput('');
        } else if (val === 'CLR') {
          setInput('');
        } else if (val !== 'OK') {
          setInput(input + val);
        }
      } else if (session.menu === 'main') {
        if (val === '1') {
          setSession({ menu: 'createWallet', step: 0, data: {} });
          setDisplay(USSD_MENUS.createWallet.prompt);
          setScreen('input');
          setInput('');
        } else if (val === '2') {
          // Check balance - call API directly
          callAPI(`/api/check-balance?sim=${userPhone}`);
        } else if (val === '3') {
          setSession({ menu: 'sendFunds', step: 0, data: {} });
          setDisplay(USSD_MENUS.sendFunds.prompt);
          setScreen('input');
          setInput('');
        } else if (val === '4') {
          setSession({ menu: 'setAlias', step: 0, data: {} });
          setDisplay(USSD_MENUS.setAlias.prompt);
          setScreen('input');
          setInput('');
        } else {
          setDisplay('Invalid option.');
        }
      } else if (session.menu === 'createWallet') {
        if (val === 'OK' && input.trim() && input.length === 4) {
          callAPI('/api/create-wallet', {
            sim: userPhone,
            pin: input
          });
        } else if (val === 'CLR') {
          setInput('');
        } else if (val !== 'OK') {
          setInput(input + val);
        }
      } else if (session.menu === 'sendFunds') {
        if (val === 'OK' && input.trim()) {
          setTempData({ ...tempData, receiver: input });
          setSession({ menu: 'sendAmount', step: 0, data: {} });
          setDisplay(USSD_MENUS.sendAmount.prompt);
          setInput('');
        } else if (val === 'CLR') {
          setInput('');
        } else if (val !== 'OK') {
          setInput(input + val);
        }
      } else if (session.menu === 'sendAmount') {
        if (val === 'OK' && input.trim()) {
          const amount = parseFloat(input);
          if (!isNaN(amount) && amount > 0) {
            callAPI('/api/send-funds', {
              from_sim: userPhone,
              to_sim: tempData.receiver,
              amount: amount
            });
          } else {
            setDisplay('Invalid amount. Please try again.');
            setInput('');
          }
        } else if (val === 'CLR') {
          setInput('');
        } else if (val !== 'OK') {
          setInput(input + val);
        }
      } else if (session.menu === 'setAlias') {
        if (val === 'OK' && input.trim() && input.length <= 12) {
          callAPI('/api/set-alias', {
            sim: userPhone,
            alias: input
          });
        } else if (val === 'CLR') {
          setInput('');
        } else if (val !== 'OK') {
          setInput(input + val);
        }
      }
    } else if (screen === 'done') {
      setDisplay('Enter USSD code (e.g., *906#):');
      setScreen('input');
      setInput('');
    }
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
    ['OK', 'CLR'],
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      {/* Reset Button */}
      <button
        onClick={resetSession}
        className="mb-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Reset Session
      </button>
      
      {/* Phone-like USSD Display */}
      <div className="bg-black text-green-400 rounded-3xl shadow-2xl p-6 w-80 mb-6 border-4 border-gray-800">
        <div className="min-h-32 whitespace-pre-line text-lg leading-relaxed">{display}</div>
        {(screen === 'input' || session.menu === 'phoneInput' || session.menu === 'createWallet' || session.menu === 'sendFunds' || session.menu === 'sendAmount' || session.menu === 'setAlias') && (
          <div className="bg-gray-900 text-white rounded p-2 mt-2 font-mono">{input}</div>
        )}
      </div>
      
      {/* USSD Keypad */}
      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
        <div className="grid grid-cols-3 gap-3 w-72">
          {keypad.slice(0, 4).flat().map((key) => (
            <button
              key={key}
              className="bg-gray-700 text-white rounded-full p-4 text-xl hover:bg-green-600 transition-colors h-16 w-16 flex items-center justify-center font-bold"
              onClick={() => handleKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
        
        {/* Bottom row with OK and CLR */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <button
            className="bg-green-600 text-white rounded-full p-4 text-lg hover:bg-green-700 transition-colors h-16 flex items-center justify-center font-bold"
            onClick={() => handleKey('OK')}
          >
            OK
          </button>
          <button
            className="bg-red-600 text-white rounded-full p-4 text-lg hover:bg-red-700 transition-colors h-16 flex items-center justify-center font-bold"
            onClick={() => handleKey('CLR')}
          >
            CLR
          </button>
        </div>
      </div>
    </div>
  );
}
