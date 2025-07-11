import * as anchor from "@coral-xyz/anchor";
import type { SimchainWallet } from "../target/types/simchain_wallet";
import {
  PublicKey,
  Keypair,
  Connection,
  Commitment,
  TransactionSignature,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  getAccount,
  Account as SplTokenAccount,
} from "@solana/spl-token";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { validateSolanaEnv } from "../utils/env";
import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

export interface SimchainClientConfig {
  connection: Connection;
  wallet: Keypair;
  programId: PublicKey;
  commitment?: Commitment;
  country?: string; // Default country code
}

export interface HealthStatus {
  registry: {
    admin: PublicKey;
    approved: PublicKey[];
    bump: number;
    walletCount: number;
  };
  version: string;
  programId: PublicKey;
}

export class SimchainClient {
  private program: anchor.Program<SimchainWallet>;
  private phoneUtil = PhoneNumberUtil.getInstance();
  private defaultCountry: string;
  private readonly PROGRAM_VERSION = "1.1.0";

  constructor(private config: SimchainClientConfig) {
    validateSolanaEnv();
    const provider = new anchor.AnchorProvider(
      config.connection,
      new anchor.Wallet(config.wallet),
      { commitment: config.commitment || "confirmed" }
    );
    anchor.setProvider(provider);
    this.program = anchor.workspace.SimchainWallet as anchor.Program<SimchainWallet>;
    this.defaultCountry = config.country || "RW";
  }

  private resolveCountry(countryArg?: string) {
    return countryArg || this.defaultCountry;
  }

  private normalize(sim: string, countryArg?: string): string {
    const region = this.resolveCountry(countryArg);
    try {
      const p = this.phoneUtil.parseAndKeepRawInput(sim, region);
      if (this.phoneUtil.isValidNumber(p)) {
        return this.phoneUtil.format(p, PhoneNumberFormat.E164);
      }
    } catch {}
    let cleansed = sim.replace(/[^+\d]/g, "");
    cleansed = cleansed.replace(/^\++/, "+");
    // region-specific fallbacks...
    return cleansed;
  }

  private async hashSimNumber(sim: string, countryArg?: string): Promise<Uint8Array> {
    const normalized = this.normalize(sim, countryArg);
    const config = await this.getConfig();
    const data = Buffer.concat([
      Buffer.from(config.salt),
      Buffer.from(normalized),
    ]);
    return Uint8Array.from(crypto.createHash("sha256").update(data).digest());
  }

  // DRY up phone normalization + hashing
  private async prepSim(sim: string, countryArg?: string) {
    const normalized = this.normalize(sim, countryArg);
    const hash = await this.hashSimNumber(sim, countryArg);
    return { normalized, hash };
  }

  public getNormalizedSimNumber(sim: string, countryArg?: string): string {
    return this.normalize(sim, countryArg);
  }

  public async getHashedSimNumber(sim: string, countryArg?: string): Promise<Uint8Array> {
    return await this.hashSimNumber(sim, countryArg);
  }

  // Update wallet derivation to use on-chain salt
  public async deriveWalletPDA(sim: string, countryArg?: string): Promise<[PublicKey, number]> {
    const normalized = this.normalize(sim, countryArg);
    const config = await this.getConfig();
    const simHash = Uint8Array.from(
      crypto.createHash("sha256").update(Buffer.concat([
        Buffer.from(normalized),
        Buffer.from(config.salt),
      ])).digest()
    );
    return PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), Buffer.from(simHash)],
      this.program.programId
    );
  }

  public deriveMintRegistryPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("mint_registry")],
      this.program.programId
    );
  }

  public deriveConfigPDA(): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      this.program.programId
    );
  }

  private hashPin(pin: string): Uint8Array {
    return Uint8Array.from(crypto.createHash("sha256").update(pin).digest());
  }

  // Enhanced PIN validation with stronger rules
  private validatePin(pin: string): void {
    if (pin.length < 8) {
      throw new Error("PIN must be at least 8 characters long");
    }
    
    // Check for numeric and alphabetic characters
    const hasNumeric = /\d/.test(pin);
    const hasAlpha = /[a-zA-Z]/.test(pin);
    
    if (!hasNumeric || !hasAlpha) {
      throw new Error("PIN must contain both numeric and alphabetic characters");
    }
    
    // Check for common weak patterns
    if (/^(\d)\1+$/.test(pin) || /^(.)\1+$/.test(pin)) {
      throw new Error("PIN cannot be a repeated character");
    }
    
    if (/^(.)(.)(\1\2)*\1?$/.test(pin)) {
      throw new Error("PIN cannot be a repeated pattern");
    }
    
    // Additional entropy checks
    const uniqueChars = new Set(pin.toLowerCase()).size;
    if (uniqueChars < 4) {
      throw new Error("PIN must contain at least 4 unique characters");
    }
  }

  // Consolidate ATA creation logic
  private async ensureAta(
    mint: PublicKey, 
    owner: PublicKey, 
    payer: Keypair
  ): Promise<PublicKey> {
    const ata = await getAssociatedTokenAddress(mint, owner, true);
    
    try {
      await getAccount(this.config.connection, ata);
      return ata;
    } catch {
      // ATA doesn't exist, create it
      const createAtaIx = createAssociatedTokenAccountInstruction(
        payer.publicKey,
        ata,
        owner,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      const tx = new anchor.web3.Transaction().add(createAtaIx);
      await this.config.connection.sendTransaction(tx, [payer]);
      return ata;
    }
  }

  // Health check helper
  async health(): Promise<HealthStatus> {
    const registry = await this.getMintRegistry();
    return {
      registry,
      version: this.PROGRAM_VERSION,
      programId: this.program.programId,
    };
  }

  // Initialize wallet on-chain
  public async initializeWallet(sim: string, pin: string, countryArg?: string): Promise<TransactionSignature> {
    this.validatePin(pin);
    const normalized = this.normalize(sim, countryArg);
    const pinHash = this.hashPin(pin);
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    const [configPda] = this.deriveConfigPDA();
    return this.program.methods
      .initializeWallet(normalized, Array.from(pinHash))
      .accounts({
        wallet: walletPda,
        authority: this.config.wallet.publicKey,
        config: configPda,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Deposit native SOL
  async depositNative(sim: string, amountSol: number, countryArg?: string): Promise<TransactionSignature> {
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    return this.program.methods
      .depositNative(new anchor.BN(lamports))
      .accounts({
        wallet: walletPda,
        payer: this.config.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Withdraw native SOL
  async withdrawNative(
    sim: string,
    amountSol: number,
    to: PublicKey,
    countryArg?: string
  ): Promise<TransactionSignature> {
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    return this.program.methods
      .withdrawNative(new anchor.BN(lamports))
      .accounts({
        wallet: walletPda,
        owner: this.config.wallet.publicKey,
        to: to,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Send native SOL between wallets
  async sendNative(
    fromSim: string,
    toSim: string,
    amountSol: number,
    countryFromArg?: string,
    countryToArg?: string
  ): Promise<TransactionSignature> {
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    const [fromPda] = await this.deriveWalletPDA(fromSim, countryFromArg);
    const [toPda] = await this.deriveWalletPDA(toSim, countryToArg);
    return this.program.methods
      .sendNative(new anchor.BN(lamports))
      .accounts({
        senderWallet: fromPda,
        receiverWallet: toPda,
        owner: this.config.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Transfer SPL tokens between wallets
  async transferToken(
    fromSim: string,
    toSim: string,
    mint: PublicKey,
    amount: number,
    relayer: Keypair,
    countryFromArg?: string,
    countryToArg?: string
  ): Promise<TransactionSignature> {
    const [fromPda] = await this.deriveWalletPDA(fromSim, countryFromArg);
    const [toPda] = await this.deriveWalletPDA(toSim, countryToArg);
    const [registryPda] = this.deriveMintRegistryPDA();

    const fromAta = await getAssociatedTokenAddress(mint, fromPda, true);
    const toAta = await getAssociatedTokenAddress(mint, toPda, true);

    return this.program.methods
      .transferToken(new anchor.BN(amount))
      .accounts({
        senderWallet: fromPda,
        receiverWallet: toPda,
        senderAta: fromAta,
        receiverAta: toAta,
        mint: mint,
        registry: registryPda,
        owner: this.config.wallet.publicKey,
        relayer: relayer.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet, relayer])
      .rpc();
  }

  // Create SIM mint
  async createSimMint(): Promise<{ mint: PublicKey; sig: string }> {
    const mintKeypair = Keypair.generate();
    const [registryPda] = this.deriveMintRegistryPDA();
    const sig = await this.program.methods
      .createSimMint(6)
      .accounts({
        admin: this.config.wallet.publicKey,
        simMint: mintKeypair.publicKey,
        registry: registryPda,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet, mintKeypair])
      .rpc();
    return { mint: mintKeypair.publicKey, sig };
  }

  // Add mint to registry
  async addMint(mint: PublicKey): Promise<string> {
    const [registryPda] = this.deriveMintRegistryPDA();
    return this.program.methods
      .addMint(mint)
      .accounts({
        admin: this.config.wallet.publicKey,
        registry: registryPda,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Initialize registry
  async initializeRegistry(): Promise<string> {
    const [registryPda] = this.deriveMintRegistryPDA();
    return this.program.methods
      .initializeRegistry()
      .accounts({
        registry: registryPda,
        admin: this.config.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Get mint registry
  async getMintRegistry(): Promise<{ admin: PublicKey; approved: PublicKey[]; bump: number; walletCount: number }> {
    const [registryPda] = this.deriveMintRegistryPDA();
    const registry = await this.program.account.mintRegistry.fetch(registryPda);
    return {
      admin: registry.admin,
      approved: registry.approved,
      bump: registry.bump,
      walletCount: registry.walletCount.toNumber(),
    };
  }

  // Get config
  async getConfig(): Promise<{ salt: Uint8Array }> {
    const [configPda] = this.deriveConfigPDA();
    const config = await this.program.account.config.fetch(configPda);
    return { salt: config.salt };
  }

  // Initialize config
  async initializeConfig(salt: Uint8Array): Promise<TransactionSignature> {
    const [configPda] = this.deriveConfigPDA();
    return this.program.methods
      .initializeConfig(Buffer.from(salt))
      .accounts({
        config: configPda,
        admin: this.config.wallet.publicKey,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Rotate salt
  async rotateSalt(newSalt: Uint8Array): Promise<TransactionSignature> {
    const [configPda] = this.deriveConfigPDA();
    return this.program.methods
      .rotateSalt(Buffer.from(newSalt))
      .accounts({
        config: configPda,
        admin: this.config.wallet.publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Transfer admin
  async transferAdmin(newAdmin: PublicKey): Promise<TransactionSignature> {
    const [registryPda] = this.deriveMintRegistryPDA();
    return this.program.methods
      .transferAdmin(newAdmin)
      .accounts({
        registry: registryPda,
        admin: this.config.wallet.publicKey,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Close registry
  async closeRegistry(destination: PublicKey): Promise<TransactionSignature> {
    const [registryPda] = this.deriveMintRegistryPDA();
    return this.program.methods
      .closeRegistry()
      .accounts({
        registry: registryPda,
        admin: this.config.wallet.publicKey,
        destination: destination,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Close wallet
  async closeWallet(sim: string, destination: PublicKey, countryArg?: string): Promise<TransactionSignature> {
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    
    return this.program.methods
      .closeWallet()
      .accounts({
        wallet: walletPda,
        owner: this.config.wallet.publicKey,
        registry: this.deriveMintRegistryPDA()[0],
        destination: destination,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Close alias index PDA to free up the alias
  // This should be called after closing a wallet to prevent aliases from remaining "taken"
  // IMPORTANT: The MintRegistry can only hold up to 16 approved mints due to space constraints
  async closeAliasIndex(alias: Uint8Array, destination: PublicKey): Promise<TransactionSignature> {
    const [aliasIndexPda] = this.deriveAliasIndexPDA(alias);
    
    return this.program.methods
      .closeAliasIndex()
      .accounts({
        aliasIndex: aliasIndexPda,
        destination: destination,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Get token balance
  async getTokenBalance(
    sim: string,
    mint: PublicKey,
    countryArg?: string
  ): Promise<number> {
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    const ata = await getAssociatedTokenAddress(mint, walletPda, true);
    
    try {
      const account = await getAccount(this.config.connection, ata);
      return Number(account.amount);
    } catch {
      return 0;
    }
  }

  // Check native SOL balance
  async checkBalance(sim: string, countryArg?: string): Promise<number> {
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    const balance = await this.config.connection.getBalance(walletPda);
    return balance / LAMPORTS_PER_SOL;
  }

  // Derive alias index PDA for scalable alias uniqueness checking
  public deriveAliasIndexPDA(alias: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("alias"), Buffer.from(alias)],
      this.program.programId
    );
  }

  // Set wallet alias (scalable O(1) uniqueness checking)
  async setAlias(sim: string, alias: string, countryArg?: string): Promise<TransactionSignature> {
    // Validate alias on client side
    if (alias.length > 32) {
      throw new Error("Alias must be 32 characters or less");
    }
    
    const aliasBytes = Buffer.alloc(32);
    Buffer.from(alias).copy(aliasBytes);
    
    const [walletPda] = await this.deriveWalletPDA(sim, countryArg);
    const [aliasIndexPda] = this.deriveAliasIndexPDA(aliasBytes);
    
    return this.program.methods
      .setAlias(Array.from(aliasBytes))
      .accounts({
        wallet: walletPda,
        owner: this.config.wallet.publicKey,
        aliasIndex: aliasIndexPda,
        systemProgram: SystemProgram.programId,
        instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  // Health check
  async healthCheck(): Promise<string> {
    const [registryPda] = this.deriveMintRegistryPDA();
    return this.program.methods
      .healthCheck()
      .accounts({
        registry: registryPda,
      })
      .rpc();
  }
}
