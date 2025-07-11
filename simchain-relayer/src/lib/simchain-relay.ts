import { 
  Connection, 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  SYSVAR_INSTRUCTIONS_PUBKEY
} from '@solana/web3.js';
import { 
  getAssociatedTokenAddress, 
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import * as crypto from 'crypto';

// Types for the relay
export interface RelayConfig {
  connection: Connection;
  programId: PublicKey;
  provider: AnchorProvider;
  program: Program<unknown>; // Using unknown type for now
}

export interface WalletInfo {
  address: string;
  balance: number;
  exists: boolean;
}

export interface RelayError {
  code: string;
  message: string;
  details?: unknown;
}

export interface RelayResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: RelayError;
  signature?: string;
}

// Phone number normalization using a simple approach (can be enhanced with google-libphonenumber)
export class PhoneNormalizer {
  static normalize(sim: string): string {
    // Remove all non-digit characters except +
    let normalized = sim.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    // Basic validation
    if (normalized.length < 8 || normalized.length > 15) {
      throw new Error('Invalid phone number format');
    }
    
    return normalized;
  }
}

// PIN validation and hashing
export class PinManager {
  static validatePin(pin: string): boolean {
    if (pin.length < 8) return false;
    if (!/[a-zA-Z]/.test(pin)) return false;
    if (!/\d/.test(pin)) return false;
    if (/(.)\1{2,}/.test(pin)) return false; // No repeated characters
    if (new Set(pin).size < 4) return false; // At least 4 unique characters
    
    return true;
  }
  
  static hashPin(pin: string): Uint8Array {
    if (!this.validatePin(pin)) {
      throw new Error('PIN does not meet security requirements');
    }
    return crypto.createHash('sha256').update(pin).digest();
  }
  
  static zeroPin(pin: string): void {
    // In a real implementation, this would zero the memory
    // For now, we just clear the reference
    pin = '';
  }
}

// Alias validation
export class AliasValidator {
  static validateAlias(alias: string): boolean {
    if (alias.length > 32) return false;
    if (alias.length === 0) return false;
    if (!/^[\x20-\x7E]+$/.test(alias)) return false; // Printable ASCII
    if (/^0+$/.test(alias)) return false; // Not all zeros
    
    return true;
  }
  
  static normalizeAlias(alias: string): Uint8Array {
    if (!this.validateAlias(alias)) {
      throw new Error('Invalid alias format');
    }
    
    const bytes = new Uint8Array(32);
    const encoder = new TextEncoder();
    const aliasBytes = encoder.encode(alias);
    bytes.set(aliasBytes);
    return bytes;
  }
}

// Main SIMChain Relay class
export class SimchainRelay {
  private config: RelayConfig;
  private salt: Uint8Array | null = null;
  private saltFetched = false;

  constructor(config: RelayConfig) {
    this.config = config;
  }

  // Fetch salt from on-chain config (cached)
  private async getSalt(): Promise<Uint8Array> {
    if (this.saltFetched && this.salt) {
      return this.salt;
    }

    try {
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.config.programId
      );

      const configAccount = await this.config.program.account.config.fetch(configPda);
      this.salt = new Uint8Array(configAccount.salt);
      this.saltFetched = true;
      
      return this.salt;
    } catch (error) {
      throw new Error('Failed to fetch on-chain configuration');
    }
  }

  // Hash SIM number with salt
  private async hashSimNumber(sim: string): Promise<Uint8Array> {
    const normalizedSim = PhoneNormalizer.normalize(sim);
    const salt = await this.getSalt();
    
    const encoder = new TextEncoder();
    const simBytes = encoder.encode(normalizedSim);
    const combined = new Uint8Array(simBytes.length + salt.length);
    combined.set(simBytes);
    combined.set(salt, simBytes.length);
    
    return crypto.createHash('sha256').update(combined).digest();
  }

  // Derive wallet PDA
  private async deriveWalletPDA(sim: string): Promise<[PublicKey, number]> {
    const simHash = await this.hashSimNumber(sim);
    return PublicKey.findProgramAddressSync(
      [Buffer.from('wallet'), simHash],
      this.config.programId
    );
  }

  // Derive alias index PDA
  private deriveAliasIndexPDA(alias: Uint8Array): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('alias'), alias],
      this.config.programId
    );
  }

  // Health check
  async healthCheck(): Promise<RelayResult<{ connected: boolean; programId: string }>> {
    try {
      const programInfo = await this.config.connection.getAccountInfo(this.config.programId);
      
      return {
        success: true,
        data: {
          connected: true,
          programId: this.config.programId.toBase58()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Failed to connect to validator'
        }
      };
    }
  }

  // Initialize wallet
  async initializeWallet(
    sim: string, 
    pin: string, 
    authority: Keypair
  ): Promise<RelayResult<{ walletAddress: string }>> {
    try {
      // Validate inputs
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const pinHash = PinManager.hashPin(pin);
      
      // Derive PDAs
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const [configPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.config.programId
      );
      const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('mint_registry')],
        this.config.programId
      );

      // Check if wallet already exists
      const existingWallet = await this.config.connection.getAccountInfo(walletPda);
      if (existingWallet) {
        return {
          success: false,
          error: {
            code: 'WALLET_EXISTS',
            message: 'Wallet already exists for this SIM number'
          }
        };
      }

      // Initialize wallet
      const signature = await this.config.program.methods
        .initializeWallet(normalizedSim, Array.from(pinHash))
        .accounts({
          wallet: walletPda,
          authority: authority.publicKey,
          config: configPda,
          registry: registryPda,
          systemProgram: SystemProgram.programId,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([authority])
        .rpc();

      // Zero sensitive data
      PinManager.zeroPin(pin);
      
      return {
        success: true,
        signature,
        data: {
          walletAddress: walletPda.toBase58()
        }
      };
    } catch (error: any) {
      // Zero sensitive data on error
      PinManager.zeroPin(pin);
      
      return {
        success: false,
        error: {
          code: 'INITIALIZATION_ERROR',
          message: error.message || 'Failed to initialize wallet'
        }
      };
    }
  }

  // Set alias
  async setAlias(
    sim: string, 
    alias: string, 
    owner: Keypair
  ): Promise<RelayResult<{ alias: string }>> {
    try {
      // Validate inputs
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const aliasBytes = AliasValidator.normalizeAlias(alias);
      
      // Derive PDAs
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const [aliasIndexPda] = this.deriveAliasIndexPDA(aliasBytes);

      // Check if wallet exists
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      if (!walletAccount) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found for this SIM number'
          }
        };
      }

      // Set alias
      const signature = await this.config.program.methods
        .setAlias(Array.from(aliasBytes))
        .accounts({
          wallet: walletPda,
          owner: owner.publicKey,
          aliasIndex: aliasIndexPda,
          systemProgram: SystemProgram.programId,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([owner])
        .rpc();

      return {
        success: true,
        signature,
        data: { alias }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'ALIAS_ERROR',
          message: error.message || 'Failed to set alias'
        }
      };
    }
  }

  // Deposit native SOL
  async depositNative(
    sim: string, 
    amount: number, 
    payer: Keypair
  ): Promise<RelayResult<{ amount: number }>> {
    try {
      // Validate inputs
      if (amount <= 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Amount must be greater than 0'
          }
        };
      }

      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Check if wallet exists
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      if (!walletAccount) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found for this SIM number'
          }
        };
      }

      // Deposit
      const signature = await this.config.program.methods
        .depositNative(new BN(lamports))
        .accounts({
          wallet: walletPda,
          payer: payer.publicKey,
          systemProgram: SystemProgram.programId,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([payer])
        .rpc();

      return {
        success: true,
        signature,
        data: { amount }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'DEPOSIT_ERROR',
          message: error.message || 'Failed to deposit'
        }
      };
    }
  }

  // Withdraw native SOL
  async withdrawNative(
    sim: string, 
    amount: number, 
    owner: Keypair, 
    destination: PublicKey
  ): Promise<RelayResult<{ amount: number }>> {
    try {
      // Validate inputs
      if (amount <= 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Amount must be greater than 0'
          }
        };
      }

      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Check if wallet exists
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      if (!walletAccount) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found for this SIM number'
          }
        };
      }

      // Withdraw
      const signature = await this.config.program.methods
        .withdrawNative(new BN(lamports), destination)
        .accounts({
          wallet: walletPda,
          owner: owner.publicKey,
          destination,
          systemProgram: SystemProgram.programId,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([owner])
        .rpc();

      return {
        success: true,
        signature,
        data: { amount }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WITHDRAW_ERROR',
          message: error.message || 'Failed to withdraw'
        }
      };
    }
  }

  // Send native SOL between wallets
  async sendNative(
    fromSim: string, 
    toSim: string, 
    amount: number, 
    owner: Keypair
  ): Promise<RelayResult<{ amount: number; toSim: string }>> {
    try {
      // Validate inputs
      if (amount <= 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Amount must be greater than 0'
          }
        };
      }

      const normalizedFromSim = PhoneNormalizer.normalize(fromSim);
      const normalizedToSim = PhoneNormalizer.normalize(toSim);
      const [fromWalletPda] = await this.deriveWalletPDA(normalizedFromSim);
      const [toWalletPda] = await this.deriveWalletPDA(normalizedToSim);
      const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

      // Check if both wallets exist
      const fromWalletAccount = await this.config.connection.getAccountInfo(fromWalletPda);
      const toWalletAccount = await this.config.connection.getAccountInfo(toWalletPda);
      
      if (!fromWalletAccount) {
        return {
          success: false,
          error: {
            code: 'SENDER_WALLET_NOT_FOUND',
            message: 'Sender wallet not found'
          }
        };
      }
      
      if (!toWalletAccount) {
        return {
          success: false,
          error: {
            code: 'RECIPIENT_WALLET_NOT_FOUND',
            message: 'Recipient wallet not found'
          }
        };
      }

      // Send
      const signature = await this.config.program.methods
        .sendNative(normalizedToSim, new BN(lamports))
        .accounts({
          wallet: fromWalletPda,
          owner: owner.publicKey,
          systemProgram: SystemProgram.programId,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([owner])
        .rpc();

      return {
        success: true,
        signature,
        data: { amount, toSim: normalizedToSim }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'SEND_ERROR',
          message: error.message || 'Failed to send'
        }
      };
    }
  }

  // Transfer SPL tokens
  async transferToken(
    fromSim: string, 
    toSim: string, 
    mint: PublicKey, 
    amount: number, 
    relayer: Keypair
  ): Promise<RelayResult<{ amount: number; mint: string }>> {
    try {
      // Validate inputs
      if (amount <= 0) {
        return {
          success: false,
          error: {
            code: 'INVALID_AMOUNT',
            message: 'Amount must be greater than 0'
          }
        };
      }

      const normalizedFromSim = PhoneNormalizer.normalize(fromSim);
      const normalizedToSim = PhoneNormalizer.normalize(toSim);
      const [fromWalletPda] = await this.deriveWalletPDA(normalizedFromSim);
      const [toWalletPda] = await this.deriveWalletPDA(normalizedToSim);

      // Check if both wallets exist
      const fromWalletAccount = await this.config.connection.getAccountInfo(fromWalletPda);
      const toWalletAccount = await this.config.connection.getAccountInfo(toWalletPda);
      
      if (!fromWalletAccount) {
        return {
          success: false,
          error: {
            code: 'SENDER_WALLET_NOT_FOUND',
            message: 'Sender wallet not found'
          }
        };
      }
      
      if (!toWalletAccount) {
        return {
          success: false,
          error: {
            code: 'RECIPIENT_WALLET_NOT_FOUND',
            message: 'Recipient wallet not found'
          }
        };
      }

      // Get ATAs
      const fromAta = await getAssociatedTokenAddress(mint, fromWalletPda, true);
      const toAta = await getAssociatedTokenAddress(mint, toWalletPda, true);

      // Check if ATAs exist
      const fromAtaAccount = await this.config.connection.getAccountInfo(fromAta);
      const toAtaAccount = await this.config.connection.getAccountInfo(toAta);

      if (!fromAtaAccount) {
        return {
          success: false,
          error: {
            code: 'SENDER_TOKEN_ACCOUNT_NOT_FOUND',
            message: 'Sender token account not found'
          }
        };
      }

      // Create recipient ATA if it doesn't exist
      const instructions = [];
      if (!toAtaAccount) {
        instructions.push(
          createAssociatedTokenAccountInstruction(
            relayer.publicKey,
            toAta,
            toWalletPda,
            mint,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          )
        );
      }

      // Transfer token
      const signature = await this.config.program.methods
        .transferToken(normalizedToSim, mint, new BN(amount))
        .accounts({
          wallet: fromWalletPda,
          relayer: relayer.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([relayer])
        .rpc();

      return {
        success: true,
        signature,
        data: { amount, mint: mint.toBase58() }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'TRANSFER_ERROR',
          message: error.message || 'Failed to transfer token'
        }
      };
    }
  }

  // Get wallet info
  async getWalletInfo(sim: string): Promise<RelayResult<WalletInfo>> {
    try {
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      
      if (!walletAccount) {
        return {
          success: true,
          data: {
            address: walletPda.toBase58(),
            balance: 0,
            exists: false
          }
        };
      }

      const balance = walletAccount.lamports / LAMPORTS_PER_SOL;
      
      return {
        success: true,
        data: {
          address: walletPda.toBase58(),
          balance,
          exists: true
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'WALLET_INFO_ERROR',
          message: error.message || 'Failed to get wallet info'
        }
      };
    }
  }

  // Close wallet
  async closeWallet(
    sim: string, 
    owner: Keypair, 
    destination: PublicKey
  ): Promise<RelayResult<{ rentReclaimed: number }>> {
    try {
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const [registryPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('mint_registry')],
        this.config.programId
      );

      // Check if wallet exists
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      if (!walletAccount) {
        return {
          success: false,
          error: {
            code: 'WALLET_NOT_FOUND',
            message: 'Wallet not found for this SIM number'
          }
        };
      }

      // Close wallet
      const signature = await this.config.program.methods
        .closeWallet()
        .accounts({
          wallet: walletPda,
          owner: owner.publicKey,
          registry: registryPda,
          destination,
          instructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        })
        .signers([owner])
        .rpc();

      const rentReclaimed = walletAccount.lamports / LAMPORTS_PER_SOL;

      return {
        success: true,
        signature,
        data: { rentReclaimed }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CLOSE_ERROR',
          message: error.message || 'Failed to close wallet'
        }
      };
    }
  }
} 