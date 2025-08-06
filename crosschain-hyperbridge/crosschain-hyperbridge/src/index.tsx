import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { getWalletBalance } from './relayerApi';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// Utility for crosschain-hyperbridge relayer API integration
export async function getWalletBalance(sim: string, pin: string) {
  const res = await fetch('http://localhost:3002/api/check-balance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sim, pin })
  });
  if (!res.ok) throw new Error('Failed to fetch balance');
  return res.json();
}
