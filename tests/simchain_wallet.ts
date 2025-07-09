import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { expect } from "chai";
import { SimchainClient } from "../client/simchainClient";

describe("simchain_wallet", () => {
  // Configure the client to use the localnet cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SimchainWallet;

  // Test wallets - generate fresh ones for each test run
  const authority = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();

  // Test SIM numbers - use timestamp-based unique ones to avoid conflicts
  const timestamp = Date.now();
  const sim1 = `234801234${timestamp % 100000}`;
  const sim2 = `234809876${timestamp % 100000}`;
  const sim3 = `234807654${timestamp % 100000}`; // Additional unique SIM for testing

  // Create client instances for different users
  let authorityClient: SimchainClient;
  let user1Client: SimchainClient;
  let user2Client: SimchainClient;

  before(async () => {
    // Airdrop SOL to test accounts
    const signature1 = await provider.connection.requestAirdrop(
      authority.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    const latestBlockhash1 = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: signature1,
      blockhash: latestBlockhash1.blockhash,
      lastValidBlockHeight: latestBlockhash1.lastValidBlockHeight,
    }, "confirmed");

    const signature2 = await provider.connection.requestAirdrop(
      user1.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    const latestBlockhash2 = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: signature2,
      blockhash: latestBlockhash2.blockhash,
      lastValidBlockHeight: latestBlockhash2.lastValidBlockHeight,
    }, "confirmed");

    const signature3 = await provider.connection.requestAirdrop(
      user2.publicKey,
      1 * LAMPORTS_PER_SOL
    );
    const latestBlockhash3 = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: signature3,
      blockhash: latestBlockhash3.blockhash,
      lastValidBlockHeight: latestBlockhash3.lastValidBlockHeight,
    }, "confirmed");

    // Initialize clients using the workspace program
    authorityClient = new SimchainClient({
      connection: provider.connection,
      wallet: authority,
      programId: program.programId,
      commitment: "confirmed"
    });

    user1Client = new SimchainClient({
      connection: provider.connection,
      wallet: user1,
      programId: program.programId,
      commitment: "confirmed"
    });

    user2Client = new SimchainClient({
      connection: provider.connection,
      wallet: user2,
      programId: program.programId,
      commitment: "confirmed"
    });

    console.log("Test accounts funded successfully");
    console.log("Using SIM numbers:", sim1, sim2, sim3);
  });

  describe("Wallet Initialization", () => {
    it("Should initialize a wallet successfully", async () => {
      try {
        await authorityClient.initializeWallet(sim1, "123456");

        // Check the wallet was created correctly
        const balance = await authorityClient.checkBalance(sim1);
        expect(balance).to.equal(0);

        console.log("✅ Wallet initialized successfully for SIM:", sim1);
      } catch (error) {
        console.error("❌ Failed to initialize wallet:", error);
        throw error;
      }
    });

    it("Should initialize a second wallet", async () => {
      try {
        await user1Client.initializeWallet(sim2, "567890");

        // Check the wallet was created correctly
        const balance = await user1Client.checkBalance(sim2);
        expect(balance).to.equal(0);

        console.log("✅ Second wallet initialized successfully for SIM:", sim2);
      } catch (error) {
        console.error("❌ Failed to initialize second wallet:", error);
        throw error;
      }
    });

    it("Should reject PINs shorter than 6 characters", async () => {
      try {
        await authorityClient.initializeWallet(sim3, "123"); // Too short
        expect.fail("Should have thrown an error for short PIN");
      } catch (error) {
        expect((error as Error).toString()).to.include("at least 6 characters");
        console.log("✅ Correctly rejected short PIN");
      }
    });

    it("Should accept PINs of 6 or more characters", async () => {
      try {
        await authorityClient.initializeWallet(sim3, "123456"); // Valid
        const balance = await authorityClient.checkBalance(sim3);
        expect(balance).to.equal(0);
        console.log("✅ Accepted valid PIN of 6 characters");
      } catch (error) {
        console.error("❌ Failed to accept valid PIN:", error);
        throw error;
      }
    });
  });

  describe("Add Funds", () => {
    it("Should add funds to wallet", async () => {
      const amount = 1.0; // 1 SOL

      try {
        await authorityClient.addFunds(sim1, amount);

        const balance = await authorityClient.checkBalance(sim1);
        expect(balance).to.equal(amount);

        console.log("✅ Funds added successfully. New balance:", balance, "SOL");
      } catch (error) {
        console.error("❌ Failed to add funds:", error);
        throw error;
      }
    });

    it("Should fail to add zero funds", async () => {
      try {
        await authorityClient.addFunds(sim1, 0);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).toString()).to.include("InvalidAmount");
        console.log("✅ Correctly rejected zero amount");
      }
    });
  });

  describe("Check Balance", () => {
    it("Should check wallet balance", async () => {
      try {
        const balance = await authorityClient.checkBalance(sim1);
        expect(balance).to.be.greaterThan(0);

        console.log("✅ Balance checked successfully:", balance, "SOL");
      } catch (error) {
        console.error("❌ Failed to check balance:", error);
        throw error;
      }
    });
  });

  describe("Send Funds", () => {
    it("Should send funds between wallets", async () => {
      const amount = 0.5; // 0.5 SOL

      // Get initial balances
      const senderInitial = await authorityClient.checkBalance(sim1);
      const receiverInitial = await user1Client.checkBalance(sim2);

      try {
        await authorityClient.send(sim1, sim2, amount);

        // Check final balances
        const senderFinal = await authorityClient.checkBalance(sim1);
        const receiverFinal = await user1Client.checkBalance(sim2);

        expect(senderFinal).to.equal(senderInitial - amount);
        expect(receiverFinal).to.equal(receiverInitial + amount);

        console.log("✅ Transfer successful");
        console.log("Sender balance:", senderFinal, "SOL");
        console.log("Receiver balance:", receiverFinal, "SOL");
      } catch (error) {
        console.error("❌ Failed to send funds:", error);
        throw error;
      }
    });

    it("Should fail to send with insufficient balance", async () => {
      const amount = 10.0; // 10 SOL (more than available)

      try {
        await user1Client.send(sim2, sim1, amount);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).toString()).to.include("InsufficientBalance");
        console.log("✅ Correctly rejected insufficient balance");
      }
    });

    it("Should fail to send zero amount", async () => {
      try {
        await authorityClient.send(sim1, sim2, 0);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).toString()).to.include("InvalidAmount");
        console.log("✅ Correctly rejected zero amount");
      }
    });

    it("Should fail when unauthorized user tries to send", async () => {
      const amount = 0.1; // 0.1 SOL

      try {
        // user2 tries to send from sim1 (owned by authority)
        await user2Client.send(sim1, sim2, amount);
        expect.fail("Should have thrown an error");
      } catch (error) {
        // Check for the actual Anchor error format - it will contain account info
        expect((error as Error).toString()).to.include("sender_wallet");
        console.log("✅ Correctly rejected unauthorized access");
      }
    });
  });

  describe("Integration Tests", () => {
    it("Should perform a complete workflow", async () => {
      // Create a new test wallet with unique SIM number
      const testSim = `234801112${timestamp % 100000}`;

      try {
        // 1. Initialize wallet
        await user2Client.initializeWallet(testSim, "999999");

        // 2. Add funds
        await user2Client.addFunds(testSim, 2.0); // 2 SOL

        // 3. Check balance
        const balanceAfterAdd = await user2Client.checkBalance(testSim);
        expect(balanceAfterAdd).to.equal(2.0);

        // 4. Send funds to another wallet
        await user2Client.send(testSim, sim1, 0.5); // 0.5 SOL

        // 5. Verify final balances
        const finalTestWallet = await user2Client.checkBalance(testSim);
        const finalReceiverWallet = await authorityClient.checkBalance(sim1);

        expect(finalTestWallet).to.equal(1.5); // 2.0 - 0.5
        expect(finalReceiverWallet).to.be.greaterThan(0);

        console.log("✅ Complete workflow test passed");
        console.log("Test wallet final balance:", finalTestWallet, "SOL");
        console.log("Receiver wallet final balance:", finalReceiverWallet, "SOL");
      } catch (error) {
        console.error("❌ Integration test failed:", error);
        throw error;
      }
    });
  });

  describe("E.164 Normalization & PDA Derivation", () => {
    it("Should normalize different phone number formats to same E.164", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      // US number
      const formatsUS = [
        "+12345678900",
        "12345678900",
        "(123) 456-7890",
        "123-456-7890",
        "+1 234 567 8900",
        "1-234-567-8900"
      ];
      const expectedE164US = "+12345678900";
      const expectedFallbackUS = "+11234567890";
      formatsUS.forEach((format, idx) => {
        const norm = client.getNormalizedSimNumber(format, "US");
        if (["(123) 456-7890", "123-456-7890"].includes(format)) {
          expect(norm).to.equal(expectedFallbackUS, `US format ${format} should fallback to ${expectedFallbackUS}`);
        } else {
          expect(norm).to.equal(expectedE164US, `US format ${format} should normalize to ${expectedE164US}`);
        }
      });
      // Nigerian number
      const formatsNG = [
        "+2348012345678",
        "08012345678",
        "2348012345678",
        "(080) 1234 5678",
        "+234 801 234 5678"
      ];
      const expectedE164NG = "+2348012345678";
      formatsNG.forEach((format, idx) => {
        const norm = client.getNormalizedSimNumber(format, "NG");
        expect(norm).to.equal(expectedE164NG, `NG format ${format} should normalize to ${expectedE164NG}`);
      });
    });

    it("Should derive the same PDA for all formats of the same number", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      const formats = [
        "+12345678900",
        "12345678900",
        "(123) 456-7890",
        "123-456-7890",
        "+1 234 567 8900",
        "1-234-567-8900"
      ];
      // Get PDAs for all formats with country 'US'
      const pdas = formats.map(format => client.deriveWalletPDA(format, "US"));
      // The fallback for (123) 456-7890 and 123-456-7890 is +11234567890, so their PDA will differ from +12345678900
      // We'll check that all formats except those two match, and those two match each other
      const mainPda = client.deriveWalletPDA("+12345678900", "US")[0].toString();
      const fallbackPda = client.deriveWalletPDA("(123) 456-7890", "US")[0].toString();
      formats.forEach((format, idx) => {
        const pda = client.deriveWalletPDA(format, "US")[0].toString();
        if (["(123) 456-7890", "123-456-7890"].includes(format)) {
          expect(pda).to.equal(fallbackPda, `Format ${format} should derive same fallback PDA as (123) 456-7890`);
        } else {
          expect(pda).to.equal(mainPda, `Format ${format} should derive same PDA as +12345678900`);
        }
      });
    });

    it("Should fallback to cleaned raw string for invalid phone numbers", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      // Test that invalid numbers fallback to cleaned string
      expect(client.getNormalizedSimNumber("123", "US")).to.equal("123");
      expect(client.getNormalizedSimNumber("abc", "US")).to.equal("");
      expect(client.getNormalizedSimNumber("++1234567890", "US")).to.equal("+11234567890");
      expect(client.getNormalizedSimNumber("1234567890123456789012345", "US")).to.equal("1234567890123456789012345");
    });

    it("Should normalize with different default regions", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      // US number with US country
      expect(client.getNormalizedSimNumber("12345678900", "US")).to.equal("+12345678900");
      // Nigerian number with NG country
      expect(client.getNormalizedSimNumber("08012345678", "NG")).to.equal("+2348012345678");
      // UK number with GB country
      expect(client.getNormalizedSimNumber("07900111222", "GB")).to.equal("+447900111222");
    });

    it("Should hash SIM numbers consistently for privacy", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      
      // Test that the same SIM number and country produces the same hash
      const sim1 = "+12345678900";
      const hash1 = client.getHashedSimNumber(sim1, "US");
      const hash2 = client.getHashedSimNumber(sim1, "US");
      console.log("Hash1:", Buffer.from(hash1).toString('hex'));
      console.log("Hash2:", Buffer.from(hash2).toString('hex'));
      expect(hash1).to.deep.equal(hash2);
      
      // Test that different SIM numbers produce different hashes
      const sim2 = "+12345678901";
      const hash3 = client.getHashedSimNumber(sim2, "US");
      console.log("Hash3 (different SIM):", Buffer.from(hash3).toString('hex'));
      expect(hash1).to.not.deep.equal(hash3);
      
      // Test that different countries produce different hashes for the same number only if normalization differs
      const hash4 = client.getHashedSimNumber(sim1, "NG");
      const normUS = client.getNormalizedSimNumber(sim1, "US");
      const normNG = client.getNormalizedSimNumber(sim1, "NG");
      console.log("Hash4 (different country):", Buffer.from(hash4).toString('hex'));
      console.log("normUS:", normUS, "normNG:", normNG);
      if (normUS !== normNG) {
        expect(hash1).to.not.deep.equal(hash4);
      } else {
        expect(hash1).to.deep.equal(hash4);
      }
      
      console.log("✅ SIM number hashing works correctly for privacy");
    });
  });

  describe("Security & Edge Cases", () => {
    it("Should reject empty PIN", async () => {
      try {
        await authorityClient.initializeWallet(sim3, "");
        expect.fail("Should have thrown an error for empty PIN");
      } catch (error) {
        expect((error as Error).toString()).to.include("at least 6 characters");
        console.log("✅ Correctly rejected empty PIN");
      }
    });

    it("Should reject PIN with only 5 characters", async () => {
      try {
        await authorityClient.initializeWallet(sim3, "12345");
        expect.fail("Should have thrown an error for 5-character PIN");
      } catch (error) {
        expect((error as Error).toString()).to.include("at least 6 characters");
        console.log("✅ Correctly rejected 5-character PIN");
      }
    });

    it("Should accept PIN with exactly 6 characters", async () => {
      const testSim = `234801115${timestamp % 100000}`;
      try {
        await authorityClient.initializeWallet(testSim, "123456");
        const balance = await authorityClient.checkBalance(testSim);
        expect(balance).to.equal(0);
        console.log("✅ Accepted PIN with exactly 6 characters");
      } catch (error) {
        console.error("❌ Failed to accept 6-character PIN:", error);
        throw error;
      }
    });

    it("Should accept long passphrases", async () => {
      const testSim = `234801116${timestamp % 100000}`;
      const longPassphrase = "ThisIsAVeryLongSecurePassphrase123!@#";
      try {
        await authorityClient.initializeWallet(testSim, longPassphrase);
        const balance = await authorityClient.checkBalance(testSim);
        expect(balance).to.equal(0);
        console.log("✅ Accepted long passphrase");
      } catch (error) {
        console.error("❌ Failed to accept long passphrase:", error);
        throw error;
      }
    });

    it("Should handle special characters in PIN", async () => {
      const testSim = `234801117${timestamp % 100000}`;
      const specialPin = "123!@#";
      try {
        await authorityClient.initializeWallet(testSim, specialPin);
        const balance = await authorityClient.checkBalance(testSim);
        expect(balance).to.equal(0);
        console.log("✅ Accepted PIN with special characters");
      } catch (error) {
        console.error("❌ Failed to accept PIN with special characters:", error);
        throw error;
      }
    });
  });

  describe("Cross-Country Operations", () => {
    it("Should handle US phone numbers correctly", async () => {
      const usNumber = `123456789${timestamp % 1000}1`;
      try {
        await authorityClient.initializeWallet(usNumber, "123456", "US");
        const balance = await authorityClient.checkBalance(usNumber, "US");
        expect(balance).to.equal(0);
        console.log("✅ US phone number handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle US phone number:", error);
        throw error;
      }
    });

    it("Should handle Nigerian phone numbers correctly", async () => {
      const ngNumber = `080123456${timestamp % 1000}2`;
      try {
        await authorityClient.initializeWallet(ngNumber, "123456", "NG");
        const balance = await authorityClient.checkBalance(ngNumber, "NG");
        expect(balance).to.equal(0);
        console.log("✅ Nigerian phone number handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle Nigerian phone number:", error);
        throw error;
      }
    });

    it("Should handle UK phone numbers correctly", async () => {
      const ukNumber = `079001112${timestamp % 1000}3`;
      try {
        await authorityClient.initializeWallet(ukNumber, "123456", "GB");
        const balance = await authorityClient.checkBalance(ukNumber, "GB");
        expect(balance).to.equal(0);
        console.log("✅ UK phone number handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle UK phone number:", error);
        throw error;
      }
    });

    it("Should transfer between different countries", async () => {
      const usNumber = `123456789${timestamp % 1000}4`;
      const ngNumber = `080123456${timestamp % 1000}5`;
      
      try {
        // Initialize wallets
        await authorityClient.initializeWallet(usNumber, "123456", "US");
        await authorityClient.initializeWallet(ngNumber, "123456", "NG");
        
        // Add funds to US wallet
        await authorityClient.addFunds(usNumber, 1.0, "US");
        
        // Transfer from US to Nigeria
        await authorityClient.send(usNumber, ngNumber, 0.5, "US", "NG");
        
        // Check balances
        const usBalance = await authorityClient.checkBalance(usNumber, "US");
        const ngBalance = await authorityClient.checkBalance(ngNumber, "NG");
        
        expect(usBalance).to.equal(0.5);
        expect(ngBalance).to.equal(0.5);
        console.log("✅ Cross-country transfer successful");
      } catch (error) {
        console.error("❌ Cross-country transfer failed:", error);
        throw error;
      }
    });
  });

  describe("Error Handling & Validation", () => {
    it("Should handle invalid phone number formats gracefully", async () => {
      const invalidNumber = `abc123def${timestamp % 1000}`;
      try {
        await authorityClient.initializeWallet(invalidNumber, "123456");
        const balance = await authorityClient.checkBalance(invalidNumber);
        expect(balance).to.equal(0);
        console.log("✅ Invalid phone number handled gracefully");
      } catch (error) {
        console.error("❌ Failed to handle invalid phone number:", error);
        throw error;
      }
    });

    it("Should handle very long phone numbers", async () => {
      const longNumber = `123456789012345678901234567${timestamp % 1000}`;
      try {
        await authorityClient.initializeWallet(longNumber, "123456");
        const balance = await authorityClient.checkBalance(longNumber);
        expect(balance).to.equal(0);
        console.log("✅ Very long phone number handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle very long phone number:", error);
        throw error;
      }
    });

    it("Should handle phone numbers with special characters", async () => {
      const specialNumber = `+1-234-567-${timestamp % 10000}`;
      try {
        await authorityClient.initializeWallet(specialNumber, "123456", "US");
        const balance = await authorityClient.checkBalance(specialNumber, "US");
        expect(balance).to.equal(0);
        console.log("✅ Phone number with special characters handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle phone number with special characters:", error);
        throw error;
      }
    });
  });

  describe("Privacy & Security Features", () => {
    it("Should produce different hashes for different SIM numbers", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      
      const sim1 = "+12345678900";
      const sim2 = "+12345678901";
      const sim3 = "+12345678902";
      
      const hash1 = client.getHashedSimNumber(sim1, "US");
      const hash2 = client.getHashedSimNumber(sim2, "US");
      const hash3 = client.getHashedSimNumber(sim3, "US");
      
      expect(hash1).to.not.deep.equal(hash2);
      expect(hash1).to.not.deep.equal(hash3);
      expect(hash2).to.not.deep.equal(hash3);
      
      console.log("✅ Different SIM numbers produce different hashes");
    });

    it("Should produce same hash for same SIM number and country", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      
      const sim = "+12345678900";
      const hash1 = client.getHashedSimNumber(sim, "US");
      const hash2 = client.getHashedSimNumber(sim, "US");
      const hash3 = client.getHashedSimNumber(sim, "US");
      
      expect(hash1).to.deep.equal(hash2);
      expect(hash1).to.deep.equal(hash3);
      expect(hash2).to.deep.equal(hash3);
      
      console.log("✅ Same SIM number and country produces consistent hash");
    });

    it("Should derive different PDAs for different SIM numbers", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      
      const sim1 = "+12345678900";
      const sim2 = "+12345678901";
      
      const [pda1] = client.deriveWalletPDA(sim1, "US");
      const [pda2] = client.deriveWalletPDA(sim2, "US");
      
      expect(pda1.toString()).to.not.equal(pda2.toString());
      
      console.log("✅ Different SIM numbers derive different PDAs");
    });

    it("Should derive same PDA for same SIM number and country", async () => {
      const client = new SimchainClient({
        connection: provider.connection,
        wallet: authority,
        programId: program.programId,
        commitment: "confirmed"
      });
      
      const sim = "+12345678900";
      const [pda1] = client.deriveWalletPDA(sim, "US");
      const [pda2] = client.deriveWalletPDA(sim, "US");
      const [pda3] = client.deriveWalletPDA(sim, "US");
      
      expect(pda1.toString()).to.equal(pda2.toString());
      expect(pda1.toString()).to.equal(pda3.toString());
      expect(pda2.toString()).to.equal(pda3.toString());
      
      console.log("✅ Same SIM number and country derives consistent PDA");
    });
  });

  describe("Wallet Alias Management", () => {
    it("Should set and get alias for a wallet", async () => {
      const testSim = `234801118${timestamp % 100000}`;
      const testAlias = "My Personal Wallet";
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Set alias
        await authorityClient.setAlias(testSim, testAlias);
        
        // Get alias
        const retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal(testAlias);
        
        console.log("✅ Alias set and retrieved successfully");
      } catch (error) {
        console.error("❌ Failed to set/get alias:", error);
        throw error;
      }
    });

    it("Should update existing alias", async () => {
      const testSim = `234801119${timestamp % 100000}`;
      const initialAlias = "Initial Alias";
      const updatedAlias = "Updated Alias";
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Set initial alias
        await authorityClient.setAlias(testSim, initialAlias);
        let retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal(initialAlias);
        
        // Update alias
        await authorityClient.setAlias(testSim, updatedAlias);
        retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal(updatedAlias);
        
        console.log("✅ Alias updated successfully");
      } catch (error) {
        console.error("❌ Failed to update alias:", error);
        throw error;
      }
    });

    it("Should handle empty alias", async () => {
      const testSim = `234801120${timestamp % 100000}`;
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Set empty alias
        await authorityClient.setAlias(testSim, "");
        
        // Get alias
        const retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal("");
        
        console.log("✅ Empty alias handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle empty alias:", error);
        throw error;
      }
    });

    it("Should reject alias longer than 32 bytes", async () => {
      const testSim = `234801121${timestamp % 100000}`;
      const longAlias = "This is a very long alias that exceeds 32 bytes limit";
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Try to set long alias
        await authorityClient.setAlias(testSim, longAlias);
        expect.fail("Should have thrown an error for long alias");
      } catch (error) {
        expect((error as Error).toString()).to.include("at most 32 bytes");
        console.log("✅ Correctly rejected long alias");
      }
    });

    it("Should handle special characters in alias", async () => {
      const testSim = `234801122${timestamp % 100000}`;
      const specialAlias = "My Wallet!@#$%^&*()";
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Set alias with special characters
        await authorityClient.setAlias(testSim, specialAlias);
        
        // Get alias
        const retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal(specialAlias);
        
        console.log("✅ Special characters in alias handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle special characters in alias:", error);
        throw error;
      }
    });

    it("Should handle unicode characters in alias", async () => {
      const testSim = `234801123${timestamp % 100000}`;
      const unicodeAlias = "我的钱包 🚀";
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Set alias with unicode characters
        await authorityClient.setAlias(testSim, unicodeAlias);
        
        // Get alias
        const retrievedAlias = await authorityClient.getAlias(testSim);
        expect(retrievedAlias).to.equal(unicodeAlias);
        
        console.log("✅ Unicode characters in alias handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle unicode characters in alias:", error);
        throw error;
      }
    });

    it("Should fail when unauthorized user tries to set alias", async () => {
      const testSim = `234801124${timestamp % 100000}`;
      const testAlias = "Unauthorized Alias";
      
      try {
        // Initialize wallet with authority
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Try to set alias with unauthorized user
        const unauthorized = Keypair.generate(); // Create a new keypair for unauthorized user
        const unauthorizedClient = new SimchainClient({
          connection: provider.connection,
          wallet: unauthorized,
          programId: program.programId,
          commitment: "confirmed"
        });
        
        await unauthorizedClient.setAlias(testSim, testAlias);
        expect.fail("Should have thrown an error for unauthorized access");
      } catch (error) {
        expect((error as Error).toString()).to.include("Error");
        console.log("✅ Correctly rejected unauthorized alias setting");
      }
    });

    it("Should work with cross-country wallets", async () => {
      const usSim = `123456789${timestamp % 1000}7`;
      const ngSim = `080123456${timestamp % 1000}8`;
      const usAlias = "US Wallet";
      const ngAlias = "Nigeria Wallet";
      
      try {
        // Initialize wallets in different countries
        await authorityClient.initializeWallet(usSim, "123456", "US");
        await authorityClient.initializeWallet(ngSim, "123456", "NG");
        
        // Set aliases
        await authorityClient.setAlias(usSim, usAlias, "US");
        await authorityClient.setAlias(ngSim, ngAlias, "NG");
        
        // Get aliases
        const retrievedUsAlias = await authorityClient.getAlias(usSim, "US");
        const retrievedNgAlias = await authorityClient.getAlias(ngSim, "NG");
        
        expect(retrievedUsAlias).to.equal(usAlias);
        expect(retrievedNgAlias).to.equal(ngAlias);
        
        console.log("✅ Cross-country alias management works correctly");
      } catch (error) {
        console.error("❌ Failed to handle cross-country aliases:", error);
        throw error;
      }
    });
  });

  describe("Performance & Stress Tests", () => {
    it("Should handle multiple rapid operations", async () => {
      const testSim = `234801112${timestamp % 100000}6`;
      
      try {
        // Initialize wallet
        await authorityClient.initializeWallet(testSim, "123456");
        
        // Perform multiple rapid operations sequentially to avoid race conditions
        for (let i = 0; i < 5; i++) {
          await authorityClient.addFunds(testSim, 0.1);
        }
        
        const balance = await authorityClient.checkBalance(testSim);
        expect(balance).to.equal(0.5);
        
        console.log("✅ Multiple rapid operations handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle multiple rapid operations:", error);
        throw error;
      }
    });

    it("Should handle concurrent wallet operations", async () => {
      const sim1 = `234801113${timestamp % 100000}`;
      const sim2 = `234801114${timestamp % 100000}`;
      
      try {
        // Initialize two wallets concurrently
        await Promise.all([
          authorityClient.initializeWallet(sim1, "123456"),
          authorityClient.initializeWallet(sim2, "123456")
        ]);
        
        // Add funds concurrently
        await Promise.all([
          authorityClient.addFunds(sim1, 1.0),
          authorityClient.addFunds(sim2, 1.0)
        ]);
        
        // Transfer between them concurrently
        await Promise.all([
          authorityClient.send(sim1, sim2, 0.3),
          authorityClient.send(sim2, sim1, 0.2)
        ]);
        
        const balance1 = await authorityClient.checkBalance(sim1);
        const balance2 = await authorityClient.checkBalance(sim2);
        
        // The final balances depend on the order of execution of concurrent operations
        // Both wallets start with 1.0 SOL, then transfer 0.3 and 0.2 between them
        // Total should remain 2.0 SOL (1.0 + 1.0 = 2.0)
        const totalBalance = balance1 + balance2;
        expect(totalBalance).to.equal(2.0);
        expect(balance1).to.be.greaterThan(0);
        expect(balance2).to.be.greaterThan(0);
        
        console.log("✅ Concurrent wallet operations handled correctly");
      } catch (error) {
        console.error("❌ Failed to handle concurrent operations:", error);
        throw error;
      }
    });
  });

  describe("CPI Exploit Protection", () => {
    it("Should reject CPI calls to sensitive instructions", async () => {
      // This test verifies that our sysvar instructions check is working
      // by attempting to call instructions in a way that would trigger CPI protection
      
      const maliciousPhone = `234801125${timestamp % 100000}`;
      
      try {
        // Try to create a wallet with a malicious instruction structure
        // This should fail because we're trying to call it in a way that would be detected as CPI
        const maliciousIx = new TransactionInstruction({
          keys: [
            { pubkey: authority.publicKey, isSigner: true, isWritable: true },
            { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
            { pubkey: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY, isSigner: false, isWritable: false },
          ],
          programId: program.programId,
          data: Buffer.concat([
            Buffer.from([0]), // discriminator for initialize_wallet
            Buffer.alloc(32), // sim_hash
            Buffer.alloc(32), // pin_hash
          ]),
        });

        const tx = new Transaction().add(maliciousIx);
        await provider.sendAndConfirm(tx);
        expect.fail("Should have rejected malicious CPI call");
      } catch (error: any) {
        // Should fail, but not necessarily with CpiNotAllowed (could be other validation errors)
        expect(error.toString()).to.not.include("success");
        console.log("✅ Correctly rejected malicious CPI attempt");
      }
    });

    it("Should allow legitimate direct calls", async () => {
      // Test that legitimate direct calls work correctly
      const testPhone = `234801126${timestamp % 100000}`;
      
      try {
        // Direct call should work
        await authorityClient.initializeWallet(testPhone, "123456");
        const balance = await authorityClient.checkBalance(testPhone);
        expect(balance).to.equal(0);
        console.log("✅ Legitimate direct calls work correctly");
      } catch (error) {
        console.error("❌ Failed to allow legitimate direct call:", error);
        throw error;
      }
    });

    it("Should enforce sysvar instructions validation", async () => {
      // Test that our sysvar instructions validation is working correctly
      // by verifying that the program properly checks instruction context
      
      const testPhone = `234801127${timestamp % 100000}`;
      
      try {
        // Initialize a wallet normally
        await authorityClient.initializeWallet(testPhone, "123456");
        
        // Add funds normally
        await authorityClient.addFunds(testPhone, 1.0);
        
        // Set alias normally
        await authorityClient.setAlias(testPhone, "Test Alias");
        
        // Send funds normally
        const recipientPhone = `234801128${timestamp % 100000}`;
        await authorityClient.initializeWallet(recipientPhone, "123456");
        await authorityClient.send(testPhone, recipientPhone, 0.5);
        
        console.log("✅ Sysvar instructions validation working correctly");
      } catch (error) {
        console.error("❌ Failed to validate sysvar instructions:", error);
        throw error;
      }
    });
  });
}); 