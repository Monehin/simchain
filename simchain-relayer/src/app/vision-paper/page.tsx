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
    <main className={`min-h-screen bg-white ${poppins.variable}`} style={{ fontFamily: 'var(--font-poppins)' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Image 
                  src="/Logo.png" 
                  alt="SIMChain Logo" 
                  width={32} 
                  height={32} 
                  className="rounded-lg"
                />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                SIMChain
              </span>
            </Link>
            <Link 
              href="/"
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SIMChain Vision Paper
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Democratizing Web3 Identity and Finance
          </p>
          <div className="text-sm text-gray-500 space-x-4">
            <span>Published: April 2025</span>
            <span>•</span>
            <span>SIMChain Team</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Executive Summary</h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              SIMChain is a revolutionary decentralized payment and identity protocol designed specifically for low-connectivity environments, leveraging the ubiquity of SIM cards and USSD technology. Our mission is to make Web3 identity and finance universally accessible, starting with some parts of Africa where mobile money adoption has already surpassed traditional banking systems. Winner of the UX Bounty sponsored by the Polkadot team, SIMChain demonstrates the potential of blockchain technology to drive financial inclusion.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              By transforming any mobile number into a secure blockchain wallet, SIMChain bridges the gap between traditional mobile money and decentralized finance, enabling billions of banked and unbanked individuals to participate in the global digital economy without requiring smartphones, internet access, or complex onboarding processes.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Problem Statement</h2>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-4">The Global Financial Accessibility Challenge</h3>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              While mobile money has been revolutionary in Africa (with services like M-Pesa processing over $1 billion daily), current financial systems remain fragmented, expensive, and limited by infrastructure requirements. Even in developed markets, blockchain and Web3 technologies remain inaccessible to the majority due to technical barriers and infrastructure dependencies.
            </p>
            <p className="text-base text-gray-700 leading-relaxed mb-6">
              <strong>Universal Need</strong>: SIMChain addresses accessibility challenges for everyone from the unbanked seeking financial inclusion to the banked seeking better cross-border services, from rural communities with limited connectivity to urban users wanting seamless Web3 access.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Limitations</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Mobile Money Silos</h4>
                <p className="text-base text-gray-700">
                  While mobile money has been revolutionary in Africa, these systems remain closed, proprietary, and lack interoperability across borders and providers.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Blockchain Accessibility Gap</h4>
                <p className="text-base text-gray-700">
                  Existing Web3 solutions require high-speed internet, smartphones, complex wallet management, and technical knowledge.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Universal Infrastructure Barriers</h4>
                <p className="text-base text-gray-700">
                  Current blockchain solutions are limited by internet connectivity, smartphone dependency, digital literacy barriers, and power infrastructure constraints.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Traditional Banking Limitations</h4>
                <p className="text-base text-gray-700">
                  Even established banking users face high cross-border fees, slow settlement times, and limited access to emerging financial technologies.
                </p>
              </div>
            </div>
          </section>
          
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Vision Statement</h2>
            <p className="text-lg font-semibold text-gray-800 mb-6 italic">
              To build a SIM native and USSD protocol that transforms any mobile number into a secure blockchain identity and wallet, enabling peer-to-peer transactions, savings, and services on-chain without apps or smartphones.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-4">Core Principles</h3>
            <ul className="space-y-2">
              <li className="text-base text-gray-700">• Universal Accessibility: Works on any mobile phone with a SIM card</li>
              <li className="text-base text-gray-700">• Blockchain-Level Security: Leverages Solana&apos;s high-performance blockchain</li>
              <li className="text-base text-gray-700">• Financial Inclusion: Democratizes access to global financial services</li>
              <li className="text-base text-gray-700">• Interoperability: Bridges traditional mobile money with Web3 ecosystems</li>
              <li className="text-base text-gray-700">• Privacy by Design: Optional anonymity and selective disclosure</li>
              <li className="text-base text-gray-700">• Community Governance: Decentralized decision-making through token voting</li>
              <li className="text-base text-gray-700">• Future-Proof Identity: Extensible identity framework for emerging standards</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">4. The SIMChain Solution</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">4.1 SIM Wallet Identity</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Deterministic Address Generation</strong>: Each mobile number becomes a deterministic Solana PDA (Program Derived Address) and Polkadot account, acting as the user&apos;s wallet and account identifier across both blockchains. This ensures consistent wallet addresses across all interactions, no private key management required, and seamless integration with existing mobile infrastructure.
                </p>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Identity Verification</strong>: SIM numbers serve as the foundation for digital identity, enabling KYC/AML compliance through existing mobile operator partnerships, cross-border identity verification, and integration with government digital identity systems.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">4.2 USSD Interaction Layer</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>USSD Access Code: *906#</strong> - Universal Shortcode Access provides intuitive menu-driven interface, language localization support, offline-capable interaction model, and familiar user experience similar to existing mobile money.
                </p>
                
                <h4 className="font-semibold text-gray-800 mb-3">Key Capabilities:</h4>
                <ul className="space-y-2">
                  <li className="text-base text-gray-700">• Wallet Management: Check balance, view transaction history, access wallet information</li>
                  <li className="text-base text-gray-700">• Peer-to-Peer Transactions: Send and receive funds with phone numbers or aliases</li>
                  <li className="text-base text-gray-700">• Cross-Border Transfers: International payments with competitive fees</li>
                  <li className="text-base text-gray-700">• Savings & Services: Digital savings accounts and third-party service marketplace</li>
                  <li className="text-base text-gray-700">• Privacy Controls: Optional aliases and privacy settings for user protection</li>
                  <li className="text-base text-gray-700">• Fiat Integration: Seamless conversion between stablecoins and local currencies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">4.3 PIN-Based Access Control</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Factor Security</strong>: All wallet interactions are secured using hashed PINs stored on-chain, rate limiting and fraud detection, biometric integration where available, and multi-signature capabilities for high-value transactions.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">4.4 Relayer Network Architecture</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Decentralized Transaction Processing</strong>: SIMChain uses a network of relayer nodes that submit signed transactions on behalf of users, handle gas fee optimization and bundling, provide redundancy and failover capabilities, and enable cross-chain interoperability.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">4.5 Fiat Conversion and Settlement</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Channel Fiat Integration</strong>: SIMChain provides seamless conversion between digital assets and fiat currencies through mobile money integration, banking partnerships, cash networks, and cross-border settlement mechanisms.
                </p>
                
                <p className="text-base text-gray-700 leading-relaxed">
                  <strong>Looking Ahead: The Role of National Stablecoins</strong> - We anticipate a future where most countries will issue their own digital stablecoins, fully backed by their national currencies. As stablecoin adoption becomes widespread, the need for traditional fiat conversion will diminish. Users will be able to transact, save, and exchange value directly in their local digital currency on-chain, reducing friction, costs, and delays associated with fiat off-ramps.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Technical Architecture</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">5.1 Blockchain Layer (Solana & Polkadot)</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>High Performance</strong>: Solana&apos;s 65,000 TPS capacity ensures instant transaction confirmation, minimal gas fees (often under $0.01), scalability for mass adoption, and cross-border transaction efficiency. Polkadot&apos;s interoperability and shared security model enables seamless cross-chain communication and enhanced security for multichain operations.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">5.2 Mobile Network Integration</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>USSD Gateway</strong>: Direct integration with mobile operators enables real-time balance queries, instant transaction processing, offline transaction queuing, and multi-operator compatibility.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">5.3 Security Framework</h3>
                <p className="text-base text-gray-700 leading-relaxed mb-4">
                  <strong>Multi-Layer Protection</strong>: SIM-level authentication, PIN-based authorization, blockchain-level immutability, and relayer network redundancy.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Market Opportunity</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Primary Markets</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• Sub-Saharan Africa: 1.2 billion people</li>
                  <li className="text-base text-gray-700">• South Asia: 1.8 billion people</li>
                  <li className="text-base text-gray-700">• Southeast Asia: 650 million people</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Secondary Markets</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• Latin America: 650 million people</li>
                  <li className="text-base text-gray-700">• Middle East: 450 million people</li>
                  <li className="text-base text-gray-700">• Rural communities globally</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Market Size</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• TAM: $1.2 trillion annually</li>
                  <li className="text-base text-gray-700">• SAM: $180 billion</li>
                  <li className="text-base text-gray-700">• Target: 5% market share</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Revenue Streams</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Transaction Fees</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• Micro-fees: 0.1-0.5% on peer-to-peer transactions</li>
                  <li className="text-base text-gray-700">• Cross-border fees: 1-2% on international transfers</li>
                  <li className="text-base text-gray-700">• Premium services: 0.5-1% for expedited processing</li>
                  <li className="text-base text-gray-700">• Fiat conversion fees: 0.2-0.8% on currency conversions</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Service Subscriptions</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• Enterprise partnerships</li>
                  <li className="text-base text-gray-700">• API access and white-label solutions</li>
                  <li className="text-base text-gray-700">• Premium features and analytics</li>
                  <li className="text-base text-gray-700">• Banking partnerships</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Competitive Advantage</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Technology Advantages</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• No smartphone requirement</li>
                  <li className="text-base text-gray-700">• Offline capability</li>
                  <li className="text-base text-gray-700">• Universal compatibility</li>
                  <li className="text-base text-gray-700">• Blockchain security</li>
                  <li className="text-base text-gray-700">• Fiat integration</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Market Advantages</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• First-mover advantage</li>
                  <li className="text-base text-gray-700">• Regulatory compliance</li>
                  <li className="text-base text-gray-700">• Partnership network</li>
                  <li className="text-base text-gray-700">• Global expertise</li>
                  <li className="text-base text-gray-700">• Universal accessibility</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Network Effects</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• Interoperability</li>
                  <li className="text-base text-gray-700">• Cross-border ready</li>
                  <li className="text-base text-gray-700">• Ecosystem integration</li>
                  <li className="text-base text-gray-700">• Developer platform</li>
                  <li className="text-base text-gray-700">• Banking disruption</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Implementation Roadmap</h2>
            
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
                <div key={index} className="border-b border-gray-200 pb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{phase.phase}</h3>
                    <span className="text-sm text-gray-500">{phase.duration}</span>
                  </div>
                  <ul className="grid md:grid-cols-2 gap-2">
                    {phase.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-base text-gray-700">• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">10. Success Metrics</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">User Adoption</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• 1 million active users within 2 years</li>
                  <li className="text-base text-gray-700">• $100 million monthly transaction volume</li>
                  <li className="text-base text-gray-700">• 10 countries within 3 years</li>
                  <li className="text-base text-gray-700">• 80% monthly active user retention</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Financial Performance</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• 300% year-over-year growth</li>
                  <li className="text-base text-gray-700">• $50 million annual fee revenue</li>
                  <li className="text-base text-gray-700">• $30 million annual partnership revenue</li>
                  <li className="text-base text-gray-700">• Positive unit economics within 18 months</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Network Effects</h3>
                <ul className="space-y-1">
                  <li className="text-base text-gray-700">• 5+ mobile money system integrations</li>
                  <li className="text-base text-gray-700">• 100+ third-party applications</li>
                  <li className="text-base text-gray-700">• 50+ institutional clients</li>
                  <li className="text-base text-gray-700">• 10+ traditional bank integrations</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Conclusion</h2>
            <p className="text-base text-gray-700 leading-relaxed mb-4">
              SIMChain represents a paradigm shift in financial accessibility, leveraging the ubiquity of mobile phones and SIM cards to bring blockchain technology to everyone regardless of their current financial status, location, or technical expertise. By eliminating the barriers of internet access, smartphone requirements, and technical complexity, SIMChain democratizes access to Web3 identity and financial services for all users.
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              Our vision is not just to create another payment system, but to build the foundational infrastructure that connects traditional mobile money with the global digital economy. In doing so, we can unlock unprecedented economic opportunities for all communities while providing a bridge between existing financial infrastructure and emerging blockchain technologies.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
} 