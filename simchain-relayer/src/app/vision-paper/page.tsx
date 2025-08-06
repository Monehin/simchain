import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export default function VisionPaper() {
  return (
    <main className={`min-h-screen bg-gradient-to-br from-blue-25 via-indigo-25 to-purple-25 relative ${poppins.variable}`}>
      {/* Paper texture overlay */}
      <div className="absolute inset-0 opacity-3">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-sm shadow-lg border-b-4 border-blue-100">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur-md opacity-30 group-hover:opacity-50 transition-all duration-300"></div>
                <Image 
                  src="/Logo.png" 
                  alt="SIMChain Logo" 
                  width={40} 
                  height={40} 
                  className="relative rounded-lg"
                />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SIMChain
              </span>
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors bg-white/50 rounded-lg border border-amber-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Paper container */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-4 border-blue-100 p-8 md:p-16 mb-8">
          {/* Paper fold effect */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent via-blue-50 to-blue-100 rounded-bl-3xl transform rotate-45 translate-x-8 -translate-y-8"></div>
          
          {/* Content wrapper */}
          <div className="relative z-10">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6" style={{ fontFamily: 'var(--font-poppins)' }}>
            <span className="font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent">
              SIMChain Vision Paper
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Democratizing Web3 Identity and Finance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-500">
            <span>Published: April 2025</span>
            <span>•</span>
            <span>SIMChain Team</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-blue-50/50 rounded-2xl shadow-lg p-8 md:p-12 mb-8 border-2 border-blue-100">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg mr-4">1</span>
              Executive Summary
            </h2>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
              SIMChain is a revolutionary decentralized payment and identity protocol designed specifically for low-connectivity environments, leveraging the ubiquity of SIM cards and USSD technology. Our mission is to make Web3 identity and finance universally accessible, starting with some parts of Africa where mobile money adoption has already surpassed traditional banking systems. Winner of the UX Bounty sponsored by the Polkadot team, SIMChain demonstrates the potential of blockchain technology to drive financial inclusion.
            </p>
            <p className="text-gray-700 leading-relaxed text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
              By transforming any mobile number into a secure blockchain wallet, SIMChain bridges the gap between traditional mobile money and decentralized finance, enabling billions of banked and unbanked individuals to participate in the global digital economy without requiring smartphones, internet access, or complex onboarding processes.
            </p>
          </div>

          <div className="bg-blue-50/50 rounded-2xl shadow-lg p-8 md:p-12 mb-8 border-2 border-blue-100">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
              <span className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg mr-4">2</span>
              Problem Statement
            </h2>
            
            <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>The Global Financial Accessibility Challenge</h3>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
              While mobile money has been revolutionary in Africa (with services like M-Pesa processing over $1 billion daily), current financial systems remain fragmented, expensive, and limited by infrastructure requirements. Even in developed markets, blockchain and Web3 technologies remain inaccessible to the majority due to technical barriers and infrastructure dependencies.
            </p>
            <p className="text-gray-700 leading-relaxed mb-6 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
              <strong>Universal Need</strong>: SIMChain addresses accessibility challenges for everyone from the unbanked seeking financial inclusion to the banked seeking better cross-border services, from rural communities with limited connectivity to urban users wanting seamless Web3 access.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>Current Limitations</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Mobile Money Silos</h4>
                <p className="text-gray-700 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                  While mobile money has been revolutionary in Africa, these systems remain closed, proprietary, and lack interoperability across borders and providers.
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Blockchain Accessibility Gap</h4>
                <p className="text-gray-700 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Existing Web3 solutions require high-speed internet, smartphones, complex wallet management, and technical knowledge.
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Universal Infrastructure Barriers</h4>
                <p className="text-gray-700 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Current blockchain solutions are limited by internet connectivity, smartphone dependency, digital literacy barriers, and power infrastructure constraints.
                </p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>Traditional Banking Limitations</h4>
                <p className="text-gray-700 text-sm" style={{ fontFamily: 'var(--font-poppins)' }}>
                  Even established banking users face high cross-border fees, slow settlement times, and limited access to emerging financial technologies.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50/50 rounded-2xl shadow-lg p-8 md:p-12 mb-8 border-2 border-amber-100">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <span className="w-8 h-8 bg-amber-200 rounded-full flex items-center justify-center text-amber-800 font-bold text-sm mr-3">3</span>
              Vision Statement
            </h2>
            <div className="bg-gradient-to-r from-slate-100 to-gray-100 p-8 rounded-xl border-2 border-slate-200 mb-6">
              <p className="text-xl font-semibold mb-4 text-gray-800" style={{ fontFamily: 'var(--font-poppins)' }}>
                To build a SIM native and USSD protocol that transforms any mobile number into a secure blockchain identity and wallet, enabling peer-to-peer transactions, savings, and services on-chain without apps or smartphones.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-800 mb-4">Core Principles</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                                                "Universal Accessibility: Works on any mobile phone with a SIM card",
                                "Blockchain-Level Security: Leverages Solana's high-performance blockchain",
                "Financial Inclusion: Democratizes access to global financial services",
                "Interoperability: Bridges traditional mobile money with Web3 ecosystems",
                "Privacy by Design: Optional anonymity and selective disclosure",
                "Community Governance: Decentralized decision-making through token voting",
                "Future-Proof Identity: Extensible identity framework for emerging standards"
              ].map((principle, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700 text-sm">{principle}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 mb-6 flex items-center" style={{ fontFamily: 'var(--font-poppins)' }}>
              <span className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 font-bold text-lg mr-4">4</span>
              The SIMChain Solution
            </h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>4.1 SIM Wallet Identity</h3>
                <p className="text-gray-700 leading-relaxed mb-4 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <strong>Deterministic Address Generation</strong>: Each mobile number becomes a deterministic Solana PDA (Program Derived Address) and Polkadot account, acting as the user's wallet and account identifier across both blockchains. This ensures consistent wallet addresses across all interactions, no private key management required, and seamless integration with existing mobile infrastructure.
                </p>
                <p className="text-gray-700 leading-relaxed mb-4 text-lg" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <strong>Identity Verification</strong>: SIM numbers serve as the foundation for digital identity, enabling KYC/AML compliance through existing mobile operator partnerships, cross-border identity verification, and integration with government digital identity systems.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4" style={{ fontFamily: 'var(--font-poppins)' }}>4.2 USSD Interaction Layer</h3>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 rounded-xl border border-green-100 mb-4">
                  <h4 className="font-semibold text-green-800 mb-2" style={{ fontFamily: 'var(--font-poppins)' }}>USSD Access Code: *906#</h4>
                  <p className="text-green-700 text-base" style={{ fontFamily: 'var(--font-poppins)' }}>
                    Universal Shortcode Access provides intuitive menu-driven interface, language localization support, offline-capable interaction model, and familiar user experience similar to existing mobile money.
                  </p>
                </div>
                
                <h4 className="font-semibold text-gray-800 mb-3">Key Capabilities:</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    "Wallet Management: Check balance, view transaction history, access wallet information",
                    "Peer-to-Peer Transactions: Send and receive funds with phone numbers or aliases",
                    "Cross-Border Transfers: International payments with competitive fees",
                    "Savings & Services: Digital savings accounts and third-party service marketplace",
                    "Privacy Controls: Optional aliases and privacy settings for user protection",
                    "Fiat Integration: Seamless conversion between stablecoins and local currencies"
                  ].map((capability, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 text-sm">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">4.3 PIN-Based Access Control</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Factor Security</strong>: All wallet interactions are secured using hashed PINs stored on-chain, rate limiting and fraud detection, biometric integration where available, and multi-signature capabilities for high-value transactions.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">4.4 Relayer Network Architecture</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Decentralized Transaction Processing</strong>: SIMChain uses a network of relayer nodes that submit signed transactions on behalf of users, handle gas fee optimization and bundling, provide redundancy and failover capabilities, and enable cross-chain interoperability.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">4.5 Fiat Conversion and Settlement</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Channel Fiat Integration</strong>: SIMChain provides seamless conversion between digital assets and fiat currencies through mobile money integration, banking partnerships, cash networks, and cross-border settlement mechanisms.
                </p>
                
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-blue-800 mb-3">Looking Ahead: The Role of National Stablecoins</h4>
                  <p className="text-blue-700 text-sm">
                    We anticipate a future where most countries will issue their own digital stablecoins, fully backed by their national currencies. As stablecoin adoption becomes widespread, the need for traditional fiat conversion will diminish. Users will be able to transact, save, and exchange value directly in their local digital currency on-chain, reducing friction, costs, and delays associated with fiat off-ramps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">5. Technical Architecture</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">5.1 Blockchain Layer (Solana & Polkadot)</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>High Performance</strong>: Solana's 65,000 TPS capacity ensures instant transaction confirmation, minimal gas fees (often under $0.01), scalability for mass adoption, and cross-border transaction efficiency. Polkadot's interoperability and shared security model enables seamless cross-chain communication and enhanced security for multichain operations.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">5.2 Mobile Network Integration</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>USSD Gateway</strong>: Direct integration with mobile operators enables real-time balance queries, instant transaction processing, offline transaction queuing, and multi-operator compatibility.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">5.3 Security Framework</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Layer Protection</strong>: SIM-level authentication, PIN-based authorization, blockchain-level immutability, and relayer network redundancy.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">6. Market Opportunity</h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Primary Markets</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• Sub-Saharan Africa: 1.2 billion people</li>
                  <li>• South Asia: 1.8 billion people</li>
                  <li>• Southeast Asia: 650 million people</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Secondary Markets</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• Latin America: 650 million people</li>
                  <li>• Middle East: 450 million people</li>
                  <li>• Rural communities globally</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Market Size</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• TAM: $1.2 trillion annually</li>
                  <li>• SAM: $180 billion</li>
                  <li>• Target: 5% market share</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">7. Revenue Streams</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Transaction Fees</h3>
                <ul className="text-gray-700 text-base space-y-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <li>• Micro-fees: 0.1-0.5% on peer-to-peer transactions</li>
                  <li>• Cross-border fees: 1-2% on international transfers</li>
                  <li>• Premium services: 0.5-1% for expedited processing</li>
                  <li>• Fiat conversion fees: 0.2-0.8% on currency conversions</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Subscriptions</h3>
                <ul className="text-gray-700 text-base space-y-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <li>• Enterprise partnerships</li>
                  <li>• API access and white-label solutions</li>
                  <li>• Premium features and analytics</li>
                  <li>• Banking partnerships</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">8. Competitive Advantage</h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Technology Advantages</h4>
                <ul className="text-gray-700 text-base space-y-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <li>• No smartphone requirement</li>
                  <li>• Offline capability</li>
                  <li>• Universal compatibility</li>
                  <li>• Blockchain security</li>
                  <li>• Fiat integration</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Market Advantages</h4>
                <ul className="text-gray-700 text-base space-y-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                  <li>• First-mover advantage</li>
                  <li>• Regulatory compliance</li>
                  <li>• Partnership network</li>
                  <li>• Global expertise</li>
                  <li>• Universal accessibility</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Network Effects</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• Interoperability</li>
                  <li>• Cross-border ready</li>
                  <li>• Ecosystem integration</li>
                  <li>• Developer platform</li>
                  <li>• Banking disruption</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">9. Implementation Roadmap</h2>
            
            <div className="space-y-6">
              {[
                {
                  phase: "Phase 1: Foundation",
                  duration: "Months 1-6",
                  items: ["Core protocol development", "Solana program deployment", "Polkadot integration", "Multichain support architecture", "USSD gateway integration", "Security audit and testing", "Regulatory compliance framework", "Fiat integration architecture"]
                },
                {
                  phase: "Phase 2: Pilot Launch",
                  duration: "Months 7-12",
                  items: ["Rwanda pilot program (1,000 users)", "Mobile operator partnerships", "User experience optimization", "Security hardening", "Performance optimization", "Mobile money integration"]
                },
                {
                  phase: "Phase 3: Market Expansion",
                  duration: "Months 13-24",
                  items: ["East Africa expansion", "Additional mobile operator integrations", "Enterprise partnership development", "Cross-border functionality", "Advanced service offerings", "Banking partnerships"]
                },
                {
                  phase: "Phase 4: Global Scale",
                  duration: "Months 25-36",
                  items: ["Pan-African expansion", "South Asia market entry", "Southeast Asia market entry", "Global remittance network", "Ecosystem platform launch", "International banking disruption"]
                }
              ].map((phase, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{phase.phase}</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{phase.duration}</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {phase.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-700 text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">10. Success Metrics</h2>
            
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">User Adoption</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• 1 million active users within 2 years</li>
                  <li>• $100 million monthly transaction volume</li>
                  <li>• 10 countries within 3 years</li>
                  <li>• 80% monthly active user retention</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Financial Performance</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• 300% year-over-year growth</li>
                  <li>• $50 million annual fee revenue</li>
                  <li>• $30 million annual partnership revenue</li>
                  <li>• Positive unit economics within 18 months</li>
                </ul>
              </div>
              
              <div className="p-6 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Network Effects</h4>
                <ul className="text-gray-700 text-sm space-y-2">
                  <li>• 5+ mobile money system integrations</li>
                  <li>• 100+ third-party applications</li>
                  <li>• 50+ institutional clients</li>
                  <li>• 10+ traditional bank integrations</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-white">
            <h2 className="text-2xl font-semibold mb-6">11. Conclusion</h2>
            <p className="text-blue-100 leading-relaxed mb-6">
              SIMChain represents a paradigm shift in financial accessibility, leveraging the ubiquity of mobile phones and SIM cards to bring blockchain technology to everyone regardless of their current financial status, location, or technical expertise. By eliminating the barriers of internet access, smartphone requirements, and technical complexity, SIMChain democratizes access to Web3 identity and financial services for all users.
            </p>
            <p className="text-blue-100 leading-relaxed">
              Our vision is not just to create another payment system, but to build the foundational infrastructure that connects traditional mobile money with the global digital economy. In doing so, we can unlock unprecedented economic opportunities for all communities while providing a bridge between existing financial infrastructure and emerging blockchain technologies.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <Link 
            href="/"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
          >
            ← Back to SIMChain Home
          </Link>
        </div>
          </div>
        </div>
      </div>
    </main>
  );
} 