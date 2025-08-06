import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Subtle Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-28 pb-24">
          <div className="text-center">
            {/* Modern Logo Design */}
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-all duration-700 animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-all duration-700 animate-pulse" style={{animationDelay: '1.5s'}}></div>
                <Image 
                  src="/Logo.png" 
                  alt="SIMChain Logo" 
                  width={80} 
                  height={80} 
                  className="relative rounded-2xl shadow-xl border border-white/20 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-700 backdrop-blur-sm"
                  priority
                />
              </div>
            </div>

            {/* Modern Typography */}
            <h1 className="text-5xl md:text-6xl font-extralight text-gray-900 mb-8 tracking-tight">
              <span className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
                SIMChain
              </span>
            </h1>

            {/* Modern Subtitle */}
            <p className="text-2xl md:text-3xl text-gray-700 mb-10 max-w-5xl mx-auto font-light leading-tight">
              <span className="font-semibold text-blue-600">USSD-First</span> Multichain Wallet Platform
            </p>

            {/* Modern Achievement Text */}
            <div className="mb-14 max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Revolutionizing blockchain accessibility through USSD technology.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm">
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 font-semibold border border-amber-200">
                  🏆 1st Place Solana Bounty
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 font-semibold border border-purple-200">
                  🎨 3rd Place UX Bounty
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 font-semibold border border-gray-200">
                  🚀 Blockspace Synergy Hackathon
                </span>
              </div>
              <p className="text-base text-gray-500 mt-4 font-medium">
                Now in active development
              </p>
            </div>
            
            {/* Modern CTA Buttons */}
            <div className="flex justify-center mb-20">
              <Link 
                href="/ussd" 
                className="group relative px-8 py-3 rounded-xl font-semibold text-base overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 hover:from-blue-700 hover:via-purple-700 hover:to-cyan-700 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:scale-105 text-white"
              >
                <span className="relative z-10 flex items-center justify-center">
                  <span className="mr-2 text-lg">🚀</span>
                  Try SIMChain Demo
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Link>
            </div>

            {/* Modern Stats Design */}
            <div className="grid grid-cols-3 gap-12 max-w-3xl mx-auto">
              <div className="text-center group">
                <div className="text-4xl font-black text-blue-600 mb-3 group-hover:scale-110 transition-transform duration-300">3.8B+</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Feature Phone Users</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-black text-purple-600 mb-3 group-hover:scale-110 transition-transform duration-300">3</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Blockchain Networks</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-black text-cyan-600 mb-3 group-hover:scale-110 transition-transform duration-300">*906#</div>
                <div className="text-sm text-gray-500 uppercase tracking-widest font-bold">Future USSD Code</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Summary Section */}
      <section id="product-details" className="relative z-10 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Project Summary
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              SIMChain revolutionizes blockchain accessibility by leveraging USSD technology to bring 
              multichain wallet functionality to any mobile device, regardless of smartphone capabilities.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="group relative p-6 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100 hover:border-blue-200 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-3 text-blue-700">USSD-First Vision</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Designed with USSD (*906#) as the primary interface, ensuring accessibility for all mobile users, 
                including feature phones and low-end smartphones.
              </p>
            </div>

            <div className="group relative p-6 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl mb-4">🔗</div>
              <h3 className="text-lg font-semibold mb-3 text-purple-700">Multichain Support</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Seamless integration with Solana, Polkadot, and cross-chain transfers via Hyperbridge, 
                providing users with comprehensive blockchain access.
              </p>
            </div>

            <div className="group relative p-6 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100 hover:border-cyan-200 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-3xl mb-4">🛡️</div>
              <h3 className="text-lg font-semibold mb-3 text-cyan-700">Enterprise Security</h3>
              <p className="text-base text-gray-600 leading-relaxed">
                Bank-grade encryption, PIN-based authentication, and secure wallet management 
                ensuring user funds and data protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* User Flow Section */}
      <section className="relative z-10 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                User Onboarding Journey
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Simple, intuitive flow designed for users of all technical levels
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Access Platform", desc: "Users access SIMChain through web interface (mobile app coming soon)", color: "blue" },
              { step: "2", title: "Quick Registration", desc: "New users register with phone number and 6-digit PIN", color: "purple" },
              { step: "3", title: "Wallet Creation", desc: "System automatically creates multichain wallet with unique alias", color: "cyan" },
              { step: "4", title: "Start Using", desc: "Users can send, receive, and manage funds across multiple blockchains", color: "blue" }
            ].map((item, index) => (
              <div key={index} className="group relative p-5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:transform hover:scale-105 shadow-sm hover:shadow-md">
                <div className={`text-2xl mb-3 font-semibold text-${item.color}-600`}>{item.step}</div>
                <h3 className="text-base font-semibold mb-2 text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Statement */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light text-white mb-10">Impact Statement</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="group p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 text-white">Financial Inclusion</h3>
              <p className="text-base text-blue-100 leading-relaxed">
                SIMChain bridges the digital divide by making blockchain technology accessible 
                to the 3.8 billion people who still use feature phones, enabling financial 
                inclusion in emerging markets.
              </p>
            </div>
            <div className="group p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:border-white/30 transition-all duration-300">
              <h3 className="text-xl font-semibold mb-4 text-white">Technology Democratization</h3>
              <p className="text-base text-blue-100 leading-relaxed">
                By leveraging existing USSD infrastructure, SIMChain eliminates the need for 
                expensive smartphones or internet connectivity, democratizing access to 
                decentralized finance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Milestones & Timeline */}
      <section className="relative z-10 py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              <span className="font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Development Milestones
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Our roadmap to bringing SIMChain to users worldwide
            </p>
          </div>

          <div className="space-y-6">
            {[
              { status: "✓", title: "Hackathon MVP (Completed)", desc: "Core web interface, Solana integration, basic wallet operations", color: "green", bg: "green-500" },
              { status: "2", title: "UX Bounty Integration (Current)", desc: "UX audit, design improvements, user flow optimization", color: "blue", bg: "blue-500" },
              { status: "3", title: "Polkadot Integration", desc: "Polkadot blockchain integration for expanded multichain support", color: "gray", bg: "gray-400" },
              { status: "4", title: "Web/Mobile App Development", desc: "Strategic enhancements based on UX bounty feedback and user research", color: "gray", bg: "gray-400" },
              { status: "5", title: "USSD Integration", desc: "USSD service integration for feature phone accessibility", color: "gray", bg: "gray-400" },
              { status: "6", title: "Public Launch", desc: "Full public release with comprehensive features", color: "gray", bg: "gray-400" }
            ].map((item, index) => (
              <div key={index} className="flex items-center group">
                <div className={`bg-${item.bg} text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold mr-6 text-sm shadow-sm`}>
                  {item.status}
                </div>
                <div className="flex-1 p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all duration-300">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UX Improvements Roadmap */}
      <section className="relative z-10 py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-light text-gray-900 mb-4">
              <span className="font-semibold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                Development Roadmap
              </span>
            </h2>
            <p className="text-base text-gray-600 max-w-2xl mx-auto">
              Our plan proposal for the UX team - strategic enhancements based on UX bounty feedback and user research
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: "📱",
                title: "Web/Mobile App Development",
                desc: "Build web application with responsive design and improved UX, with potential for mobile app development based on user needs.",
                features: ["Enhanced onboarding experience", "Rich transaction history", "Advanced wallet management", "Push notifications"],
                gradient: "from-blue-50 to-purple-50",
                border: "blue-200"
              },
              {
                icon: "⚡",
                title: "Simplified Flows",
                desc: "Streamlined step-by-step processes for wallet creation, transfers, and account management to reduce friction and improve user success rates.",
                features: ["One-tap wallet creation", "Smart recipient detection", "Automated error recovery", "Contextual help system"],
                gradient: "from-purple-50 to-pink-50",
                border: "purple-200"
              }
            ].map((item, index) => (
              <div key={index} className={`group p-6 rounded-xl bg-gradient-to-br ${item.gradient} border border-${item.border} hover:border-${item.border.replace('200', '300')} transition-all duration-300 hover:transform hover:scale-105`}>
                <h3 className="text-lg font-semibold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {item.icon} {item.title}
                </h3>
                <p className="text-base text-gray-600 mb-4 leading-relaxed">{item.desc}</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {item.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <span className="text-blue-500 mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative z-10 py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-light text-white mb-6">Ready to Experience the Future?</h2>
          <p className="text-lg mb-8 text-blue-100">
            Try SIMChain today and see how we&apos;re making blockchain accessible to everyone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/ussd" 
              className="group relative px-8 py-3 rounded-lg font-medium text-base overflow-hidden bg-white text-blue-600 hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center">
                <span className="mr-2">🚀</span>
                Try SIMChain Demo
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-md opacity-30"></div>
              <Image 
                src="/Logo.png" 
                alt="SIMChain Logo" 
                width={50} 
                height={50} 
                className="relative rounded-lg border border-gray-700"
              />
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-3 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            SIMChain
          </h3>
          <p className="text-gray-400 mb-4 text-base">
            USSD-First Multichain Wallet Platform
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p className="text-amber-400 font-medium">Winner of 1st Place in Solana Bounty & 3rd Place in UX Bounty at Blockspace Synergy Hackathon</p>
            <p>Currently in active development</p>
            <p className="mt-3">© 2024 SIMChain. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
