import * as anchor from "@coral-xyz/anchor";
import { PublicKey, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
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
        await authorityClient.initializeWallet(sim1, "1234");

        // Check the wallet was created correctly
        const balance = await authorityClient.checkBalance(sim1);
        expect(balance).to.equal(0);

        console.log("✅ Wallet initialized successfully for SIM:", sim1);
      } catch (error) {
        console.error("❌ Failed to initialize wallet:", error);
        throw error;
      }
    });

    it("Should fail with invalid SIM number length", async () => {
      try {
        await authorityClient.initializeWallet("123", "1234"); // Too short
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as Error).toString()).to.include("InvalidSimNumber");
        console.log("✅ Correctly rejected invalid SIM number");
      }
    });

    it("Should initialize a second wallet", async () => {
      try {
        await user1Client.initializeWallet(sim2, "5678");

        // Check the wallet was created correctly
        const balance = await user1Client.checkBalance(sim2);
        expect(balance).to.equal(0);

        console.log("✅ Second wallet initialized successfully for SIM:", sim2);
      } catch (error) {
        console.error("❌ Failed to initialize second wallet:", error);
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
        await user2Client.initializeWallet(testSim, "9999");

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
      // Normalize all formats with country 'US'
      const normalized = formats.map(format => client.getNormalizedSimNumber(format, "US"));
      const pdas = normalized.map(norm => client.deriveWalletPDA(norm));
      // The fallback for (123) 456-7890 and 123-456-7890 is +11234567890, so their PDA will differ from +12345678900
      // We'll check that all formats except those two match, and those two match each other
      const mainPda = client.deriveWalletPDA(client.getNormalizedSimNumber("+12345678900", "US"))[0].toString();
      const fallbackPda = client.getNormalizedSimNumber("(123) 456-7890", "US");
      formats.forEach((format, idx) => {
        const norm = client.getNormalizedSimNumber(format, "US");
        const pda = client.deriveWalletPDA(norm)[0].toString();
        if (["(123) 456-7890", "123-456-7890"].includes(format)) {
          expect(pda).to.equal(client.deriveWalletPDA(fallbackPda)[0].toString(), `Format ${format} should derive same fallback PDA as (123) 456-7890`);
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
  });
}); 