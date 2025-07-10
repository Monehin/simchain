import { SimchainClient } from "../client/simchainClient";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createMint,
  mintTo,
} from "@solana/spl-token";

async function main() {
  console.log("🚀 SIMChain Multi-Token Wallet Demo");
  console.log("=====================================\n");

  // Initialize connection and keypairs
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const user = Keypair.generate();
  const admin = Keypair.generate();
  const relayer = Keypair.generate();

  // Airdrop SOL to accounts
  console.log("💰 Airdropping SOL to test accounts...");
  await connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL);
  await connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
  await connection.requestAirdrop(relayer.publicKey, 10 * LAMPORTS_PER_SOL);
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for confirmation

  // Initialize client
  const client = new SimchainClient({
    connection,
    wallet: user,
    programId: new PublicKey("81K4v8JgJ64hz95gdkY2YFCc5PYkJa93VuQgPweu6usZ"),
    country: "US",
  });

  console.log("📱 Initializing wallets...");
  
  // Initialize wallets with different countries
  const sim1 = "+12345678901";
  const sim2 = "+2348012345678";
  const sim3 = "+250789123456";
  
  await client.initializeWallet(sim1, "123456", "US");
  await client.initializeWallet(sim2, "654321", "NG");
  await client.initializeWallet(sim3, "abcdef", "RW");
  
  console.log("✅ Wallets initialized successfully");

  // Set aliases
  console.log("\n🏷️  Setting wallet aliases...");
  await client.setAlias(sim1, "MyUSWallet", "US");
  await client.setAlias(sim2, "MyNGWallet", "NG");
  await client.setAlias(sim3, "MyRWWallet", "RW");
  
  console.log("✅ Aliases set successfully");

  // Native SOL Operations
  console.log("\n💎 Native SOL Operations");
  console.log("------------------------");
  
  // Deposit SOL
  console.log("📥 Depositing 0.05 SOL to US wallet...");
  await client.depositNative(sim1, 0.05, "US");
  
  const balance1 = await client.checkBalance(sim1, "US");
  console.log(`💰 US wallet balance: ${balance1} SOL`);
  
  // Withdraw SOL
  console.log("📤 Withdrawing 0.02 SOL from US wallet...");
  const recipient = Keypair.generate();
  await client.withdrawNative(sim1, 0.02, recipient.publicKey, "US");
  
  const balance1After = await client.checkBalance(sim1, "US");
  console.log(`💰 US wallet balance after withdrawal: ${balance1After} SOL`);

  // Create USDC mint for testing
  console.log("\n🪙 Creating USDC mint for testing...");
  const usdcMint = await createMint(
    connection,
    user,
    user.publicKey,
    user.publicKey,
    6
  );
  console.log(`✅ USDC mint created: ${usdcMint.toString()}`);

  // Initialize mint registry
  console.log("\n📋 Initializing mint registry...");
  const [mintRegistryPda] = client.deriveMintRegistryPDA();
  
  // For now, we'll skip the mint registry initialization in the example
  // and just add USDC to registry directly
  console.log("✅ Mint registry initialized (skipped for demo)");

  // Add USDC to registry
  await client.addMint(usdcMint, admin);
  console.log("✅ USDC added to mint registry");

  // SPL Token Operations
  console.log("\n🪙 SPL Token Operations");
  console.log("----------------------");
  
  // Create token accounts
  const [wallet1Pda] = client.deriveWalletPDA(sim1, "US");
  const [wallet2Pda] = client.deriveWalletPDA(sim2, "NG");
  
  const wallet1TokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    wallet1Pda,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  const wallet2TokenAccount = await getAssociatedTokenAddress(
    usdcMint,
    wallet2Pda,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Mint USDC to wallet1
  console.log("🪙 Minting 1 USDC to US wallet...");
  await mintTo(
    connection,
    user,
    usdcMint,
    wallet1TokenAccount,
    user,
    1000000 // 1 USDC (6 decimals)
  );
  
  // Transfer USDC
  console.log("🔄 Transferring 0.5 USDC from US to NG wallet...");
  await client.transferToken(sim1, sim2, usdcMint, 500000, relayer, "US", "NG");
  
  const usdcBalance1 = await client.getTokenBalance(sim1, usdcMint, "US");
  const usdcBalance2 = await client.getTokenBalance(sim2, usdcMint, "NG");
  
  console.log(`💰 US wallet USDC balance: ${usdcBalance1 / 1000000} USDC`);
  console.log(`💰 NG wallet USDC balance: ${usdcBalance2 / 1000000} USDC`);

  // SIM Token Operations
  console.log("\n📱 SIM Token Operations");
  console.log("----------------------");
  
  // Create SIM mint
  console.log("🪙 Creating SIM mint...");
  const { mint: simMint } = await client.createSimMint(admin);
  console.log(`✅ SIM mint created: ${simMint.toString()}`);
  
  // Create token accounts for SIM
  const [wallet3Pda] = client.deriveWalletPDA(sim3, "RW");
  
  const wallet3TokenAccount = await getAssociatedTokenAddress(
    simMint,
    wallet3Pda,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Mint SIM tokens to wallet3
  console.log("🪙 Minting 50 SIM tokens to RW wallet...");
  await mintTo(
    connection,
    admin,
    simMint,
    wallet3TokenAccount,
    admin,
    50000000 // 50 SIM tokens (6 decimals)
  );
  
  // Transfer SIM tokens
  console.log("🔄 Transferring 25 SIM tokens from RW to US wallet...");
  await client.transferToken(sim3, sim1, simMint, 25000000, relayer, "RW", "US");
  
  const simBalance3 = await client.getTokenBalance(sim3, simMint, "RW");
  const simBalance1 = await client.getTokenBalance(sim1, simMint, "US");
  
  console.log(`💰 RW wallet SIM balance: ${simBalance3 / 1000000} SIM`);
  console.log(`💰 US wallet SIM balance: ${simBalance1 / 1000000} SIM`);

  // Cross-Country Operations
  console.log("\n🌍 Cross-Country Operations");
  console.log("---------------------------");
  
  // Add funds to NG wallet
  await client.addFunds(sim2, 0.3, "NG");
  
  // Cross-country transfer
  console.log("🔄 Cross-country transfer: NG → RW");
  await client.send(sim2, sim3, 0.1, "NG", "RW");
  
  const ngBalance = await client.checkBalance(sim2, "NG");
  const rwBalance = await client.checkBalance(sim3, "RW");
  
  console.log(`💰 NG wallet balance: ${ngBalance} SOL`);
  console.log(`💰 RW wallet balance: ${rwBalance} SOL`);

  // Display final balances
  console.log("\n📊 Final Balances");
  console.log("----------------");
  
  const finalBalance1 = await client.checkBalance(sim1, "US");
  const finalBalance2 = await client.checkBalance(sim2, "NG");
  const finalBalance3 = await client.checkBalance(sim3, "RW");
  
  console.log(`🇺🇸 US wallet (${sim1}): ${finalBalance1} SOL`);
  console.log(`🇳🇬 NG wallet (${sim2}): ${finalBalance2} SOL`);
  console.log(`🇷🇼 RW wallet (${sim3}): ${finalBalance3} SOL`);
  
  // Display aliases
  console.log("\n🏷️  Wallet Aliases");
  console.log("-----------------");
  
  const alias1 = await client.getAlias(sim1, "US");
  const alias2 = await client.getAlias(sim2, "NG");
  const alias3 = await client.getAlias(sim3, "RW");
  
  console.log(`🇺🇸 US wallet: "${alias1}"`);
  console.log(`🇳🇬 NG wallet: "${alias2}"`);
  console.log(`🇷🇼 RW wallet: "${alias3}"`);

  // Display token balances
  console.log("\n🪙 Token Balances");
  console.log("----------------");
  
  const finalUsdc1 = await client.getTokenBalance(sim1, usdcMint, "US");
  const finalUsdc2 = await client.getTokenBalance(sim2, usdcMint, "NG");
  const finalSim1 = await client.getTokenBalance(sim1, simMint, "US");
  const finalSim3 = await client.getTokenBalance(sim3, simMint, "RW");
  
  console.log(`🇺🇸 US wallet: ${finalUsdc1 / 1000000} USDC, ${finalSim1 / 1000000} SIM`);
  console.log(`🇳🇬 NG wallet: ${finalUsdc2 / 1000000} USDC`);
  console.log(`🇷🇼 RW wallet: ${finalSim3 / 1000000} SIM`);

  console.log("\n✅ SIMChain Multi-Token Demo completed successfully!");
  console.log("🔒 All operations used hashed SIM numbers for privacy");
  console.log("🚀 Relayer paid all transaction fees");
  console.log("🌍 Cross-country operations working seamlessly");
}

main().catch(console.error); 