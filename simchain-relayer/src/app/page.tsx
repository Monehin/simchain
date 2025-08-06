import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Image 
                src="/Logo.png" 
                alt="SIMChain Logo" 
                width={120} 
                height={120} 
                className="rounded-2xl shadow-lg"
                priority
              />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              SIMChain
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              <span className="font-semibold text-blue-600">USSD-First</span> Multichain Wallet Platform
            </p>
            <p className="text-lg text-gray-700 mb-12 max-w-2xl mx-auto">
              Bringing blockchain accessibility to feature phones through USSD technology. 
              Winner of 3rd Place in UX Bounty - Now in active development.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link 
                href="/ussd" 
                className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
              >
                🚀 Try SIMChain USSD
              </Link>
              <a 
                href="#product-details" 
                className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors"
              >
                📋 Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Product Summary Section */}
      <section id="product-details" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Project Summary</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              SIMChain revolutionizes blockchain accessibility by leveraging USSD technology to bring 
              multichain wallet functionality to any mobile device, regardless of smartphone capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">USSD-First Design</h3>
              <p className="text-gray-600">
                Primary interface through USSD (*906#), ensuring accessibility for all mobile users, 
                including feature phones and low-end smartphones.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-semibold mb-2">Multichain Support</h3>
              <p className="text-gray-600">
                Seamless integration with Solana, Polkadot, and cross-chain transfers via Hyperbridge, 
                providing users with comprehensive blockchain access.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🛡️</div>
              <h3 className="text-xl font-semibold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">
                Bank-grade encryption, PIN-based authentication, and secure wallet management 
                ensuring user funds and data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Flow Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">User Onboarding Journey</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Simple, intuitive flow designed for users of all technical levels
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4 text-blue-600">1</div>
              <h3 className="text-lg font-semibold mb-2">Dial USSD Code</h3>
              <p className="text-gray-600 text-sm">
                User dials *906# from any mobile device to access SIMChain
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4 text-blue-600">2</div>
              <h3 className="text-lg font-semibold mb-2">Quick Registration</h3>
              <p className="text-gray-600 text-sm">
                New users register with phone number and 6-digit PIN
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4 text-blue-600">3</div>
              <h3 className="text-lg font-semibold mb-2">Wallet Creation</h3>
              <p className="text-gray-600 text-sm">
                System automatically creates multichain wallet with unique alias
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="text-3xl mb-4 text-blue-600">4</div>
              <h3 className="text-lg font-semibold mb-2">Start Using</h3>
              <p className="text-gray-600 text-sm">
                Users can send, receive, and manage funds across multiple blockchains
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Statement */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-8">Impact Statement</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-4">Financial Inclusion</h3>
              <p className="text-lg opacity-90">
                SIMChain bridges the digital divide by making blockchain technology accessible 
                to the 3.8 billion people who still use feature phones, enabling financial 
                inclusion in emerging markets.
              </p>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-4">Technology Democratization</h3>
              <p className="text-lg opacity-90">
                By leveraging existing USSD infrastructure, SIMChain eliminates the need for 
                expensive smartphones or internet connectivity, democratizing access to 
                decentralized finance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones & Timeline */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Development Milestones</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our roadmap to bringing SIMChain to users worldwide
            </p>
          </div>

          <div className="space-y-8">
            <div className="flex items-center">
              <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-6">✓</div>
              <div>
                <h3 className="text-xl font-semibold">Hackathon MVP (Completed)</h3>
                <p className="text-gray-600">Core USSD functionality, Solana integration, basic wallet operations</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-6">2</div>
              <div>
                <h3 className="text-xl font-semibold">UX Bounty Integration (Current)</h3>
                <p className="text-gray-600">UX audit, design improvements, user flow optimization</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-6">3</div>
              <div>
                <h3 className="text-xl font-semibold">PWA Development (Q1 2024)</h3>
                <p className="text-gray-600">Progressive Web App for enhanced smartphone experience</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-6">4</div>
              <div>
                <h3 className="text-xl font-semibold">Beta Launch (Q2 2024)</h3>
                <p className="text-gray-600">Limited beta testing with select user groups</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="bg-gray-300 text-gray-600 rounded-full w-8 h-8 flex items-center justify-center font-bold mr-6">5</div>
              <div>
                <h3 className="text-xl font-semibold">Public Launch (Q3 2024)</h3>
                <p className="text-gray-600">Full public release with comprehensive features</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* UX Improvements Roadmap */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">UX Improvements Roadmap</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Strategic enhancements based on UX bounty feedback and user research
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">🎯 PWA Development</h3>
              <p className="text-gray-600 mb-4">
                Progressive Web App to extend accessibility beyond USSD, serving as a companion 
                interface for smartphone users with richer interactivity.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Enhanced onboarding experience</li>
                <li>• Rich transaction history</li>
                <li>• Advanced wallet management</li>
                <li>• Push notifications</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">⚡ Simplified Flows</h3>
              <p className="text-gray-600 mb-4">
                Streamlined step-by-step processes for wallet creation, transfers, and account 
                management to reduce friction and improve user success rates.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• One-tap wallet creation</li>
                <li>• Smart recipient detection</li>
                <li>• Automated error recovery</li>
                <li>• Contextual help system</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">�� USSD-First Design</h3>
              <p className="text-gray-600 mb-4">
                Maintaining USSD as the primary interface while optimizing for the unique 
                constraints and opportunities of USSD technology.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Optimized menu structures</li>
                <li>• Reduced navigation steps</li>
                <li>• Clear error messaging</li>
                <li>• Offline functionality</li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <h3 className="text-2xl font-semibold mb-4 text-blue-600">🔧 Technical Enhancements</h3>
              <p className="text-gray-600 mb-4">
                Backend improvements to ensure reliability, speed, and scalability for 
                production deployment.
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Enhanced error handling</li>
                <li>• Improved transaction speed</li>
                <li>• Better security measures</li>
                <li>• Analytics integration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience the Future?</h2>
          <p className="text-xl mb-8 opacity-90">
            Try SIMChain today and see how we're making blockchain accessible to everyone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/ussd" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              🚀 Try SIMChain USSD
            </Link>
            <Link 
              href="/admin" 
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
            >
              📊 View System Status
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center mb-6">
            <Image 
              src="/Logo.png" 
              alt="SIMChain Logo" 
              width={60} 
              height={60} 
              className="rounded-lg"
            />
          </div>
          <h3 className="text-2xl font-bold mb-4">SIMChain</h3>
          <p className="text-gray-400 mb-6">
            USSD-First Multichain Wallet Platform
          </p>
          <div className="text-sm text-gray-500">
            <p>Winner of 3rd Place in UX Bounty</p>
            <p>Currently in active development</p>
            <p className="mt-2">© 2024 SIMChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
