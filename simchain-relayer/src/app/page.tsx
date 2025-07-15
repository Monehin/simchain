"use client";

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          SIMChain
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Mobile money platform built on Solana blockchain
        </p>
      </div>
      
      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* USSD Simulator Card */}
        <Link href="/ussd" className="group">
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                USSD Simulator
              </h2>
              <p className="text-gray-600 mb-6">
                Experience mobile money transactions through a realistic USSD interface. Create wallets, check balances, send funds, and manage aliases.
              </p>
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-medium">
                Real Blockchain Transactions
              </div>
            </div>
          </div>
        </Link>

        {/* Admin Dashboard Card */}
        <Link href="/admin" className="group">
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 mb-6">
                Monitor system health, view all registered wallets, track transactions, and manage the SIMChain platform.
              </p>
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                System Management
              </div>
            </div>
          </div>
        </Link>
        </div>
        
      {/* Footer */}
      <div className="mt-12 text-center text-gray-500">
        <p className="text-sm">
          Built with Solana, Next.js, and TypeScript
        </p>
        <p className="text-xs mt-2">
          Production Ready • Real Blockchain Transactions • Encrypted Storage
        </p>
      </div>
    </div>
  );
}
