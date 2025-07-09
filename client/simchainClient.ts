import * as anchor from "@coral-xyz/anchor";
import type { SimchainWallet } from "../target/types/simchain_wallet";
import {
  PublicKey,
  Keypair,
  Connection,
  Commitment,
  TransactionSignature,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { validateSolanaEnv } from "../utils/env";
import { PhoneNumberUtil, PhoneNumberFormat } from "google-libphonenumber";

export interface SimchainClientConfig {
  connection: Connection;
  wallet: Keypair;
  programId: PublicKey;
  commitment?: Commitment;
  country?: string; // Default country for phone number normalization (e.g., 'US', 'NG', 'KE')
}

export class SimchainClient {
  private program: anchor.Program;
  private phoneUtil: PhoneNumberUtil;
  private defaultCountry: string;
  
  // Secret salt for hashing SIM numbers - must match on-chain salt
  private readonly SIM_HASH_SALT = "SIMChain_v1_secure_salt_2024";

  constructor(private config: SimchainClientConfig) {
    validateSolanaEnv(); // throws if missing env

    const provider = new anchor.AnchorProvider(
      config.connection,
      new anchor.Wallet(config.wallet),
      { commitment: config.commitment || "confirmed" }
    );
    anchor.setProvider(provider);

    // Use workspace program to avoid type issues
    this.program = anchor.workspace.SimchainWallet;
    
    // Initialize phone number utility
    this.phoneUtil = PhoneNumberUtil.getInstance();
    
    // Set default country
    this.defaultCountry = config.country || "RW";
  }

  private resolveCountry(countryArg?: string): string {
    return countryArg || this.defaultCountry;
  }

  /**
   * Normalize SIM number to E.164 format for consistent hashing
   * @param sim - Raw SIM number in any format
   * @param countryArg - Optional country code (e.g., 'US', 'NG', 'GB'). Defaults to client's default country.
   * @returns E.164 formatted phone number (e.g., "+1234567890") or cleaned raw string
   */
  private normalize(sim: string, countryArg?: string): string {
    const targetCountry = this.resolveCountry(countryArg);
    // First try with original string
    try {
      const parsed = this.phoneUtil.parseAndKeepRawInput(sim, targetCountry);
      if (this.phoneUtil.isValidNumber(parsed)) {
        return this.phoneUtil.format(parsed, PhoneNumberFormat.E164);
      }
    } catch {}

    // Clean: remove all but one leading plus, and non-digits
    let cleaned = sim.replace(/[^+\d]/g, "");
    cleaned = cleaned.replace(/^\++/, "+"); // Only one leading plus

    // Smart fallback for US
    if (targetCountry === "US") {
      // If 10 digits, prepend +1
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length === 10) {
        return "+1" + digits;
      }
    }
    // Smart fallback for Nigeria
    if (targetCountry === "NG") {
      // If 11 digits and starts with 0, replace 0 with +234
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length === 11 && digits.startsWith("0")) {
        return "+234" + digits.slice(1);
      }
      // If 10 digits, prepend +234
      if (digits.length === 10) {
        return "+234" + digits;
      }
    }
    // Smart fallback for Rwanda
    if (targetCountry === "RW") {
      // If 9 digits, prepend +250
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length === 9) {
        return "+250" + digits;
      }
      // If 10 digits and starts with 0, replace 0 with +250
      if (digits.length === 10 && digits.startsWith("0")) {
        return "+250" + digits.slice(1);
      }
    }
    // fallback for UK (GB)
    if (targetCountry === "GB") {
      const digits = cleaned.replace(/\D/g, "");
      if (digits.length === 11 && digits.startsWith("0")) {
        return "+44" + digits.slice(1);
      }
    }
    // Fallback: use the cleaned raw string as-is
    return cleaned;
  }

  /**
   * Hash SIM number consistently with on-chain logic for privacy
   * @param sim - Raw SIM number in any format
   * @param countryArg - Optional country code for normalization
   * @returns 32-byte hash of the normalized SIM number
   */
  private hashSimNumber(sim: string, countryArg?: string): Uint8Array {
    const normalized = this.normalize(sim, countryArg);
    const data = Buffer.concat([
      Buffer.from(this.SIM_HASH_SALT),
      Buffer.from(normalized)
    ]);
    return Uint8Array.from(crypto.createHash("sha256").update(data).digest());
  }

  /**
   * Get the E.164 normalized version of a SIM number
   * @param sim - Raw SIM number in any format
   * @param countryArg - Optional country code (e.g., 'US', 'NG', 'GB'). Defaults to client's default country.
   * @returns E.164 formatted phone number or cleaned raw string
   */
  public getNormalizedSimNumber(sim: string, countryArg?: string): string {
    return this.normalize(sim, countryArg);
  }

  /**
   * Get the hashed version of a SIM number for privacy
   * @param sim - Raw SIM number in any format
   * @param countryArg - Optional country code for normalization
   * @returns 32-byte hash array
   */
  public getHashedSimNumber(sim: string, countryArg?: string): Uint8Array {
    return this.hashSimNumber(sim, countryArg);
  }

  /**
   * Derive PDA from a hashed SIM number for privacy
   * @param sim - Raw SIM number (will be normalized and hashed)
   * @param countryArg - Optional country code for normalization
   * @returns [PDA, bump]
   */
  public deriveWalletPDA(sim: string, countryArg?: string): [PublicKey, number] {
    const simHash = this.hashSimNumber(sim, countryArg);
    return PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), Buffer.from(simHash)],
      this.program.programId
    );
  }

  private hashPin(pin: string): Uint8Array {
    return Uint8Array.from(crypto.createHash("sha256").update(pin).digest());
  }

  /** Create the on-chain wallet (0 SOL start) - SIM number will be hashed for privacy */
  async initializeWallet(sim: string, pin: string, countryArg?: string): Promise<TransactionSignature> {
    if (pin.length < 6) {
      throw new Error("PIN/passphrase must be at least 6 characters long");
    }
    const simHash = this.hashSimNumber(sim, countryArg);
    const [walletPda] = this.deriveWalletPDA(sim, countryArg);
    const pinHash = this.hashPin(pin);
    
    return this.program.methods
      .initializeWallet(Array.from(simHash), Array.from(pinHash))
      .accounts({
        wallet: walletPda,
        authority: this.config.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  /** Add SOL (converted to lamports) — must be owner - SIM number will be hashed for privacy */
  async addFunds(sim: string, amountSol: number, countryArg?: string): Promise<TransactionSignature> {
    const [walletPda] = this.deriveWalletPDA(sim, countryArg);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    
    return this.program.methods
      .addFunds(new anchor.BN(lamports))
      .accounts({
        wallet: walletPda,
        owner: this.config.wallet.publicKey,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  /** Returns balance in SOL - SIM number will be hashed for privacy */
  async checkBalance(sim: string, countryArg?: string): Promise<number> {
    const [walletPda] = this.deriveWalletPDA(sim, countryArg);
    
    // optional on-chain log:
    await this.program.methods
      .checkBalance()
      .accounts({ wallet: walletPda })
      .rpc();
    
    // @ts-ignore - Dynamic account access
    const acct = await this.program.account.wallet.fetch(walletPda);
    return Number(acct.balance) / LAMPORTS_PER_SOL;
  }

  /** Send SOL from one SIM to another (must be owner of fromSim) - SIM numbers will be hashed for privacy */
  async send(
    fromSim: string,
    toSim: string,
    amountSol: number,
    countryFromArg?: string,
    countryToArg?: string
  ): Promise<TransactionSignature> {
    const [fromPda] = this.deriveWalletPDA(fromSim, countryFromArg);
    const [toPda] = this.deriveWalletPDA(toSim, countryToArg);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);

    return this.program.methods
      .send(new anchor.BN(lamports))
      .accounts({
        senderWallet: fromPda,
        receiverWallet: toPda,
        owner: this.config.wallet.publicKey,
      })
      .signers([this.config.wallet])
      .rpc();
  }

  /**
   * Set or update the alias (nickname) for a wallet. Only the owner can set.
   */
  async setAlias(simNumber: string, alias: string, country?: string) {
    if (alias.length > 32) throw new Error("Alias must be at most 32 bytes");
    const aliasBytes = Buffer.alloc(32);
    aliasBytes.write(alias, 0, "utf8");
    const [walletPDA] = this.deriveWalletPDA(simNumber, country);
    await this.program.methods.setAlias([...aliasBytes])
      .accounts({ wallet: walletPDA, owner: this.config.wallet.publicKey })
      .signers([this.config.wallet])
      .rpc();
  }

  /**
   * Get the alias (nickname) for a wallet.
   */
  async getAlias(simNumber: string, country?: string): Promise<string> {
    const [walletPDA] = this.deriveWalletPDA(simNumber, country);
    // @ts-ignore - Dynamic account access
    const wallet = await this.program.account.wallet.fetch(walletPDA);
    const aliasBytes: Uint8Array = wallet.alias;
    // Convert bytes to string and remove null padding
    return Buffer.from(aliasBytes).toString('utf8').replace(/\0+$/, '');
  }
}