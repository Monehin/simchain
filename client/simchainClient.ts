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
   * Normalize SIM number to E.164 format for consistent PDA derivation
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
   * Get the E.164 normalized version of a SIM number
   * @param sim - Raw SIM number in any format
   * @param countryArg - Optional country code (e.g., 'US', 'NG', 'GB'). Defaults to client's default country.
   * @returns E.164 formatted phone number or cleaned raw string
   */
  public getNormalizedSimNumber(sim: string, countryArg?: string): string {
    return this.normalize(sim, countryArg);
  }

  /**
   * Derive PDA from a normalized SIM number (does not re-normalize)
   */
  public deriveWalletPDA(normalizedSim: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from("wallet"), Buffer.from(normalizedSim)],
      this.program.programId
    );
  }

  private hashPin(pin: string): Uint8Array {
    return Uint8Array.from(crypto.createHash("sha256").update(pin).digest());
  }

  /** Create the on-chain wallet (0 SOL start) - SIM number will be normalized to E.164 */
  async initializeWallet(sim: string, pin: string, countryArg?: string): Promise<TransactionSignature> {
    const country = this.resolveCountry(countryArg);
    const normalized = this.normalize(sim, country);
    const [walletPda] = this.deriveWalletPDA(normalized);
    const pinHash = this.hashPin(pin);
    return this.program.methods
      .initializeWallet(normalized, Array.from(pinHash))
      .accounts({
        wallet: walletPda,
        authority: this.config.wallet.publicKey, // matches IDL
        systemProgram: SystemProgram.programId, // matches IDL
      })
      .signers([this.config.wallet])
      .rpc();
  }

  /** Add SOL (converted to lamports) — must be owner - SIM number will be normalized to E.164 */
  async addFunds(sim: string, amountSol: number, countryArg?: string): Promise<TransactionSignature> {
    const country = this.resolveCountry(countryArg);
    const normalized = this.normalize(sim, country);
    const [walletPda] = this.deriveWalletPDA(normalized);
    const lamports = Math.round(amountSol * LAMPORTS_PER_SOL);
    return this.program.methods
      .addFunds(new anchor.BN(lamports))
      .accounts({
        wallet: walletPda,
        owner: this.config.wallet.publicKey,         // renamed to `owner`
      })
      .signers([this.config.wallet])
      .rpc();
  }

  /** Returns balance in SOL - SIM number will be normalized to E.164 */
  async checkBalance(sim: string, countryArg?: string): Promise<number> {
    const country = this.resolveCountry(countryArg);
    const normalized = this.normalize(sim, country);
    const [walletPda] = this.deriveWalletPDA(normalized);
    // optional on-chain log:
    await this.program.methods
      .checkBalance()
      .accounts({ wallet: walletPda })
      .rpc();
    // @ts-ignore - Dynamic account access
    const acct = await this.program.account.wallet.fetch(walletPda);
    return Number(acct.balance) / LAMPORTS_PER_SOL;
  }

  /** Send SOL from one SIM to another (must be owner of fromSim) - SIM numbers will be normalized to E.164 */
  async send(
    fromSim: string,
    toSim: string,
    amountSol: number,
    countryFromArg?: string,
    countryToArg?: string
  ): Promise<TransactionSignature> {
    const countryFrom = this.resolveCountry(countryFromArg);
    const countryTo = this.resolveCountry(countryToArg);
    const normalizedFrom = this.normalize(fromSim, countryFrom);
    const normalizedTo = this.normalize(toSim, countryTo);
    const [fromPda] = this.deriveWalletPDA(normalizedFrom);
    const [toPda]   = this.deriveWalletPDA(normalizedTo);
    const lamports  = Math.round(amountSol * LAMPORTS_PER_SOL);

    return this.program.methods
      .send(new anchor.BN(lamports))
      .accounts({
        senderWallet:   fromPda,
        receiverWallet: toPda,
        owner:          this.config.wallet.publicKey,
      })
      .signers([this.config.wallet])
      .rpc();
  }
}