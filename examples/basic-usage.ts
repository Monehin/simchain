import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, Connection } from "@solana/web3.js";
import { SimchainClient } from "../client/simchainClient";

/**
 * Basic usage example for SIMChain client with privacy features
 * This demonstrates the core functionality of the SIMChain system with hashed SIM numbers
 */

async function main() {
  console.log("🚀 SIMChain Client Example (Privacy Enhanced)\n");

  // 1. Setup connection and wallet
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const wallet = Keypair.generate();

  console.log("📡 Connected to Solana localnet");
  console.log("👤 Wallet:", wallet.publicKey.toString());

  // 2. Initialize the client with the deployed program ID
  const PROGRAM_ID = new PublicKey("81K4v8JgJ64hz95gdkY2YFCc5PYkJa93VuQgPweu6usZ");
  
  // Use workspace approach for program
  const provider = new anchor.AnchorProvider(
    connection,
    new anchor.Wallet(wallet),
    { commitment: "confirmed" }
  );
  anchor.setProvider(provider);

  const program = anchor.workspace.SimchainWallet;

  // Create SIMChain client
  const client = new SimchainClient({
    connection,
    wallet,
    programId: program.programId,
    country: "RW" // Default to Rwanda
  });

  console.log("🔧 SIMChain client initialized");
  console.log("📋 Program ID:", PROGRAM_ID.toString());
  console.log("🌍 Default country:", "RW");
  console.log("🔐 Privacy: SIM numbers are hashed on-chain");

  try {
    // 3. Request airdrop for testing
    try {
      const signature = await connection.requestAirdrop(
        wallet.publicKey,
        1 * LAMPORTS_PER_SOL
      );
      await connection.confirmTransaction(signature, "confirmed");
      console.log("💰 Airdrop received");
    } catch (error) {
      console.log("⚠️ Airdrop failed, continuing with existing balance...");
      const balance = await connection.getBalance(wallet.publicKey);
      if (balance < 0.1 * LAMPORTS_PER_SOL) {
        console.error("❌ Insufficient balance for testing");
        return;
      }
      console.log("💰 Using existing balance:", balance / LAMPORTS_PER_SOL, "SOL");
    }

    // 4. Generate unique SIM numbers and PIN
    const timestamp = Date.now();
    const simNumber = `789123${timestamp % 100000}`; // Rwandan format
    const simNumber2 = `789456${timestamp % 100000}`; // Second Rwandan number
    const pin = "123456";
    
    console.log("📱 SIM Number 1:", simNumber);
    console.log("📱 SIM Number 2:", simNumber2);
    console.log("🔐 PIN:", pin);

    // 5. Show normalization and hashing examples
    console.log("\n🔍 Phone Number Normalization Examples:");
    console.log("Rwandan number:", simNumber, "→", client.getNormalizedSimNumber(simNumber));
    console.log("US number:", "12345678900", "→", client.getNormalizedSimNumber("12345678900", "US"));
    console.log("Nigerian number:", "08012345678", "→", client.getNormalizedSimNumber("08012345678", "NG"));

    console.log("\n🔐 SIM Number Hashing Examples (Privacy):");
    const hash1 = client.getHashedSimNumber(simNumber);
    const hash2 = client.getHashedSimNumber("12345678900", "US");
    console.log("Rwandan SIM hash:", Buffer.from(hash1).toString('hex').substring(0, 16) + "...");
    console.log("US SIM hash:", Buffer.from(hash2).toString('hex').substring(0, 16) + "...");
    console.log("✅ Raw phone numbers are never stored on-chain!");

    // 6. Initialize first wallet
    console.log("\n🔧 Initializing first wallet...");
    await client.initializeWallet(simNumber, pin);
    console.log("✅ First wallet initialized successfully!");

    // 7. Add funds to first wallet
    console.log("\n💰 Adding funds to first wallet...");
    await client.addFunds(simNumber, 1.0); // 1 SOL
    console.log("✅ Funds added successfully!");

    // 8. Check balance
    console.log("\n📊 Checking balance...");
    const balance = await client.checkBalance(simNumber);
    console.log("✅ Balance:", balance, "SOL");

    // 9. Create a second wallet
    console.log("\n🔄 Creating second wallet...");
    await client.initializeWallet(simNumber2, pin);
    await client.addFunds(simNumber2, 0.5); // 0.5 SOL
    console.log("✅ Second wallet created and funded!");

    // 10. Send funds between wallets
    console.log("\n💸 Sending funds between wallets...");
    await client.send(simNumber, simNumber2, 0.2); // 0.2 SOL
    console.log("✅ Transfer completed successfully!");

    // 11. Check final balances
    const finalBalance1 = await client.checkBalance(simNumber);
    const finalBalance2 = await client.checkBalance(simNumber2);
    
    console.log("\n📈 Final Balances:");
    console.log(`SIM ${simNumber}: ${finalBalance1} SOL`);
    console.log(`SIM ${simNumber2}: ${finalBalance2} SOL`);
    
    // 12. Demonstrate cross-country transfer
    console.log("\n🌍 Cross-country transfer demo...");
    const usNumber = `123456789${timestamp % 1000}`;
    console.log("Creating US wallet:", usNumber);
    await client.initializeWallet(usNumber, pin, "US");
    await client.addFunds(usNumber, 0.1, "US");
    await client.send(simNumber, usNumber, 0.1, "RW", "US");
    const usBalance = await client.checkBalance(usNumber, "US");
    console.log(`US wallet balance: ${usBalance} SOL`);
    
    // 13. Demonstrate PDA derivation privacy
    console.log("\n🔒 PDA Derivation Privacy Demo:");
    const [pda1] = client.deriveWalletPDA(simNumber);
    const [pda2] = client.deriveWalletPDA("12345678900", "US");
    console.log("Rwandan SIM PDA:", pda1.toString());
    console.log("US SIM PDA:", pda2.toString());
    console.log("✅ PDAs are derived from hashed SIM numbers - no phone number leakage!");
    
    // 5. Demonstrate alias functionality
    console.log("\n=== 5. Wallet Alias Management ===");
    
    // Set aliases for the wallets
    await client.setAlias(simNumber, "My Primary Wallet");
    await client.setAlias(simNumber2, "My Secondary Wallet");
    
    // Get and display aliases
    const alias1 = await client.getAlias(simNumber);
    const alias2 = await client.getAlias(simNumber2);
    
    console.log(`Wallet 1 alias: "${alias1}"`);
    console.log(`Wallet 2 alias: "${alias2}"`);
    
    // Update an alias
    await client.setAlias(simNumber, "My Updated Primary Wallet");
    const updatedAlias = await client.getAlias(simNumber);
    console.log(`Updated Wallet 1 alias: "${updatedAlias}"`);
    
    // Demonstrate cross-country alias
    const usSim = `123456789${timestamp % 100000}9`;
    await client.initializeWallet(usSim, "123456", "US");
    await client.setAlias(usSim, "US Business Wallet", "US");
    const usAlias = await client.getAlias(usSim, "US");
    console.log(`US Wallet alias: "${usAlias}"`);

    console.log("\n🎉 Example completed successfully!");
    console.log("🔐 Privacy features implemented:");
    console.log("  • SIM numbers are hashed before being used as PDA seeds");
    console.log("  • Raw phone numbers are never stored on-chain");
    console.log("  • Only PDA addresses are passed in transactions");
    console.log("  • Consistent hashing across all operations");

  } catch (error) {
    console.error("💥 Example failed:", error);
  }
}

main().catch(console.error); 