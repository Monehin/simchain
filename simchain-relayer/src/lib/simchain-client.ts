import { Keypair, PublicKey, Commitment, Connection, Transaction, SystemProgram } from '@solana/web3.js';
import { 
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  address
} from '@solana/kit';
import { createHash } from 'crypto';

// Configuration for the real blockchain client
export interface SimchainClientConfig {
  connection: {
    rpcEndpoint: string;
  };
  programId: PublicKey;
  wallet: Keypair;
  commitment?: Commitment;
}

// Types for the client
export interface InitializeWalletParams {
  sim: string;
  pin: string;
  country: string;
}

export interface SendFundsParams {
  fromSim: string;
  toSim: string;
  amount: number;
  fromCountry: string;
  toCountry: string;
}

export interface SetAliasParams {
  sim: string;
  alias: string;
  country: string;
}

export interface CheckBalanceParams {
  sim: string;
  country: string;
}

export interface WalletInfo {
  address: string;
  balance: number;
  exists: boolean;
  alias?: string;
}

// Types for relay results
export interface RelayResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  signature?: string;
}

export interface InitializeWalletResult {
  walletAddress: string;
  sim: string;
  country: string;
}

export interface SendFundsResult {
  amount: number;
  fromSim: string;
  toSim: string;
  signature: string;
}

export interface CheckBalanceResult {
  balance: number;
  walletAddress: string;
  sim: string;
}

export interface SetAliasResult {
  alias: string;
  sim: string;
  signature: string;
}

// Utility classes
export class PhoneNormalizer {
  static normalize(sim: string): string {
    // Simple normalization for now
    let cleansed = sim.replace(/[^+\d]/g, "");
    if (!cleansed.startsWith('+')) {
      cleansed = '+' + cleansed;
    }
    return cleansed;
  }

  static validate(sim: string): boolean {
    // Simple validation - check if it's a reasonable phone number
    const normalized = this.normalize(sim);
    return normalized.length >= 10 && normalized.length <= 15;
  }
}

export class PinValidator {
  static validatePin(pin: string): boolean {
    return /^[0-9]{6}$/.test(pin);
  }
}

export class AliasValidator {
  static validateAlias(alias: string): boolean {
    if (alias.length > 32) return false;
    if (alias.length === 0) return false;
    if (!/^[\x20-\x7E]+$/.test(alias)) return false;
    return true;
  }
}

// Helper to create and fund a PDA if it doesn't exist
// Anchor programs handle PDA creation automatically with the 'init' attribute
// No need for manual account creation

export class SimchainClient {
  private wallet: Keypair;
  private rpc: ReturnType<typeof createSolanaRpc>;
  private rpcSubscriptions: ReturnType<typeof createSolanaRpcSubscriptions>;
  private config: SimchainClientConfig;

  constructor(config: SimchainClientConfig) {
    this.config = config;
    this.wallet = config.wallet;
    
    // Create RPC instances
    this.rpc = createSolanaRpc(config.connection.rpcEndpoint);
    this.rpcSubscriptions = createSolanaRpcSubscriptions(
      config.connection.rpcEndpoint.replace('http', 'ws')
    );
  }

  // Health check helper
  async testConnection(): Promise<boolean> {
    try {
      const slot = await this.rpc.getSlot().send();
      return slot > 0;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Get latest blockhash
  private async getLatestBlockhash() {
    const response = await this.rpc.getLatestBlockhash().send();
    return response.value;
  }

  // Create PDA for wallet using the same logic as the Rust program
  public async createWalletPDA(sim: string): Promise<[PublicKey, number]> {
    // First, get the config to read the salt
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      this.config.programId
    );
    
    const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
    const configAccount = await connection.getAccountInfo(configPDA);
    
    if (!configAccount) {
      throw new Error('Config account does not exist. Please initialize config first.');
    }
    
    // The config account structure is: discriminator (8) + admin (32) + salt_len (4) + salt (variable) + bump (1)
    // We need to read the salt from the account data
    const data = configAccount.data;
    const saltLength = data.readUInt32LE(40); // 8 + 32 = 40
    const salt = data.slice(44, 44 + saltLength); // 40 + 4 = 44
    
    // Use the same hashing function as the Rust program
    const hasher = createHash('sha256');
    hasher.update(sim);
    hasher.update(salt);
    const simHash = hasher.digest();
    
    const seeds = [
      Buffer.from('wallet'),
      simHash
    ];
    
    return await PublicKey.findProgramAddress(
      seeds,
      this.config.programId
    );
  }

  // Initialize config account
  async initializeConfig(salt: Buffer = Buffer.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])): Promise<string> {
    try {
      const [configPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        this.config.programId
      );
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const transaction = new Transaction();
      // Add initialize_config instruction
      // For Vec<u8>, Borsh serializes as: [length as u32 (4 bytes)] + [bytes]
      const instructionData = Buffer.concat([
        Buffer.from([208, 127, 21, 1, 194, 190, 196, 70]), // discriminator
        Buffer.alloc(4), // salt length as u32 (little endian)
        salt // salt bytes
      ]);
      instructionData.writeUInt32LE(salt.length, 8); // Write length at offset 8
      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: configPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      await connection.confirmTransaction(signature, 'confirmed');
      return `Config initialized with signature: ${signature}`;
    } catch (error) {
      throw error;
    }
  }

  // Initialize registry account
  async initializeRegistry(): Promise<string> {
    try {
      const [registryPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('mint_registry')],
        this.config.programId
      );
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const transaction = new Transaction();
      // Add initialize_registry instruction
      const instructionData = Buffer.from([189, 181, 20, 17, 174, 57, 249, 59]); // discriminator only
      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: registryPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('SysvarRent111111111111111111111111111111111'), isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      await connection.confirmTransaction(signature, 'confirmed');
      return `Registry initialized with signature: ${signature}`;
    } catch (error) {
      throw error;
    }
  }

  // Initialize wallet with actual blockchain transaction
  async initializeWallet(params: InitializeWalletParams): Promise<string> {
    try {
      const { sim, pin } = params;
      if (!PhoneNormalizer.validate(sim)) throw new Error('Invalid phone number format');
      if (!PinValidator.validatePin(pin)) throw new Error('Invalid PIN format');
      
      console.log('Checking if config and registry already exist...');
      const [configPDA] = PublicKey.findProgramAddressSync([Buffer.from('config')], this.config.programId);
      const [registryPDA] = PublicKey.findProgramAddressSync([Buffer.from('mint_registry')], this.config.programId);
      
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const configExists = await connection.getAccountInfo(configPDA);
      const registryExists = await connection.getAccountInfo(registryPDA);
      
      if (!configExists) {
        console.log('Config does not exist, initializing...');
        await this.initializeConfig();
      } else {
        console.log('Config already exists');
      }
      
      if (!registryExists) {
        console.log('Registry does not exist, initializing...');
        await this.initializeRegistry();
      } else {
        console.log('Registry already exists');
      }
      
      console.log('Creating wallet PDA...');
      const [walletPDA] = await this.createWalletPDA(sim);
      
      console.log('Wallet PDA:', walletPDA.toBase58());
      console.log('Config PDA:', configPDA.toBase58());
      console.log('Registry PDA:', registryPDA.toBase58());
      console.log('Authority (wallet):', this.wallet.publicKey.toBase58());
      const transaction = new Transaction();
      const pinHash = createHash('sha256').update(pin).digest();
      // For String, Borsh serializes as: [length as u32 (4 bytes)] + [utf8 bytes]
      const instructionData = Buffer.concat([
        Buffer.from([213, 0, 239, 240, 73, 100, 188, 193]), // discriminator
        Buffer.alloc(4), // sim length as u32 (little endian)
        Buffer.from(sim, 'utf8'), // sim string
        pinHash // pin hash (32 bytes)
      ]);
      instructionData.writeUInt32LE(sim.length, 8); // Write length at offset 8
      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: walletPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: configPDA, isSigner: false, isWritable: false },
          { pubkey: registryPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      await connection.confirmTransaction(signature, 'confirmed');
      return `Wallet initialized with signature: ${signature}`;
    } catch (error) {
      throw error;
    }
  }

  // Send funds with actual blockchain transaction
  async sendFunds(params: SendFundsParams): Promise<string> {
    try {
      const { fromSim, toSim, amount } = params;
      
      // Validate inputs
      if (!PhoneNormalizer.validate(fromSim)) {
        throw new Error('Invalid from phone number format');
      }
      
      if (!PhoneNormalizer.validate(toSim)) {
        throw new Error('Invalid to phone number format');
      }

      // Create PDAs
      const [fromWalletPDA] = await this.createWalletPDA(fromSim);
      const [toWalletPDA] = await this.createWalletPDA(toSim);
      
      // Check balances using @solana/kit RPC
      const fromAccountResponse = await this.rpc.getAccountInfo(
        address(fromWalletPDA.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      if (!fromAccountResponse.value) {
        throw new Error('Sender wallet does not exist');
      }
      
      const fromBalance = Number(fromAccountResponse.value.lamports);
      
      // Check for rent exemption (minimum balance required to keep account active)
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const rentExemption = await connection.getMinimumBalanceForRentExemption(fromAccountResponse.value.data.length);
      
      // Calculate available balance (total - rent exemption)
      const availableBalance = fromBalance - rentExemption;
      
      if (availableBalance < amount) {
        throw new Error(`Insufficient available balance. Available: ${availableBalance}, Required: ${amount}, Total: ${fromBalance}, Rent Exemption: ${rentExemption}`);
      }
      
      // Create actual blockchain transaction using @solana/web3.js
      const transaction = new Transaction();
      
      // Add send_native instruction
      const instructionData = Buffer.concat([
        Buffer.from([85, 55, 34, 204, 253, 10, 199, 182]), // send_native discriminator
        Buffer.alloc(8) // amount as u64 (little endian)
      ]);
      instructionData.writeBigUInt64LE(BigInt(amount), 8);

      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: fromWalletPDA, isSigner: false, isWritable: true },
          { pubkey: toWalletPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: false },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });

      // Get recent blockhash and sign transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Sign and send transaction
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Funds sent successfully:', signature);
      return `Funds sent with signature: ${signature}`;
    } catch (error) {
      console.error('Send funds failed:', error);
      throw error;
    }
  }

  // Set alias with actual blockchain transaction
  async setAlias(params: SetAliasParams): Promise<string> {
    try {
      const { sim, alias } = params;
      
      // Validate inputs
      if (!PhoneNormalizer.validate(sim)) {
        throw new Error('Invalid phone number format');
      }
      
      if (!AliasValidator.validateAlias(alias)) {
        throw new Error('Invalid alias format');
      }

      // Create wallet PDA
      const [walletPDA] = await this.createWalletPDA(sim);
      
      // Check if wallet exists using @solana/kit RPC
      const accountResponse = await this.rpc.getAccountInfo(
        address(walletPDA.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      if (!accountResponse.value) {
        throw new Error('Wallet does not exist');
      }

      // Create actual blockchain transaction using @solana/web3.js
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const transaction = new Transaction();
      
      // Add set_alias instruction
      // Convert alias to 32-byte array (pad with zeros if shorter)
      const aliasBytes = Buffer.alloc(32, 0);
      const aliasString = alias.slice(0, 32); // Truncate if longer than 32 bytes
      aliasBytes.set(Buffer.from(aliasString, 'utf8'), 0);
      
      const instructionData = Buffer.concat([
        Buffer.from([10, 230, 117, 36, 20, 115, 197, 55]), // set_alias discriminator from IDL
        aliasBytes // 32-byte alias array
      ]);

      // Create alias index PDA for uniqueness checking
      const [aliasIndexPDA] = PublicKey.findProgramAddressSync(
        [Buffer.from('alias'), aliasBytes],
        this.config.programId
      );

      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: walletPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: aliasIndexPDA, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });

      // Get recent blockhash and sign transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Sign and send transaction
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Alias set successfully:', signature);
      return `Alias set with signature: ${signature}`;
    } catch (error) {
      console.error('Set alias failed:', error);
      throw error;
    }
  }

  // Check balance using @solana/kit RPC
  async checkBalance(params: CheckBalanceParams): Promise<number> {
    try {
      const { sim } = params;
      
      // Validate inputs
      if (!PhoneNormalizer.validate(sim)) {
        throw new Error('Invalid phone number format');
      }

      // Create wallet PDA
      const [walletPDA] = await this.createWalletPDA(sim);
      
      // Get account info using @solana/kit RPC
      const accountResponse = await this.rpc.getAccountInfo(
        address(walletPDA.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      if (!accountResponse.value) {
        return 0; // Account doesn't exist, balance is 0
      }
      
      // Return the lamports as balance
      return Number(accountResponse.value.lamports);
    } catch (error) {
      console.error('Check balance failed:', error);
      throw error;
    }
  }

  // Deposit funds to wallet with actual blockchain transaction
  async depositFunds(params: { sim: string; amount: number; country?: string }): Promise<string> {
    try {
      const { sim, amount } = params;
      
      // Validate inputs
      if (!PhoneNormalizer.validate(sim)) {
        throw new Error('Invalid phone number format');
      }

      if (amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Create wallet PDA
      const [walletPDA] = await this.createWalletPDA(sim);
      
      // Check if wallet exists
      const accountResponse = await this.rpc.getAccountInfo(
        address(walletPDA.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      if (!accountResponse.value) {
        throw new Error('Wallet does not exist');
      }

      // Create actual blockchain transaction using @solana/web3.js
      const connection = new Connection(this.config.connection.rpcEndpoint, 'confirmed');
      const transaction = new Transaction();
      
      // Add deposit_native instruction
      const instructionData = Buffer.concat([
        Buffer.from([13, 158, 13, 223, 95, 213, 28, 6]), // deposit_native discriminator from IDL
        Buffer.alloc(8) // amount as u64 (little endian)
      ]);
      instructionData.writeBigUInt64LE(BigInt(amount), 8);

      transaction.add({
        programId: this.config.programId,
        keys: [
          { pubkey: walletPDA, isSigner: false, isWritable: true },
          { pubkey: this.wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: instructionData
      });

      // Get recent blockhash and sign transaction
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;
      
      // Sign and send transaction
      transaction.sign(this.wallet);
      const signature = await connection.sendTransaction(transaction, [this.wallet]);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');

      console.log('Funds deposited successfully:', signature);
      return `Funds deposited with signature: ${signature}`;
    } catch (error) {
      console.error('Deposit funds failed:', error);
      throw error;
    }
  }

  // Get wallet info
  async getWalletInfo(sim: string): Promise<WalletInfo> {
    try {
      // Validate inputs
      if (!PhoneNormalizer.validate(sim)) {
        throw new Error('Invalid phone number format');
      }

      // Create wallet PDA
      const [walletPDA] = await this.createWalletPDA(sim);
      
      // Get account info using @solana/kit RPC
      const accountResponse = await this.rpc.getAccountInfo(
        address(walletPDA.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      if (!accountResponse.value) {
        // Return empty wallet info if account doesn't exist
        return {
          address: walletPDA.toBase58(),
          balance: 0,
          exists: false
        };
      }
      
      // Return basic wallet info
      return {
        address: walletPDA.toBase58(),
        balance: Number(accountResponse.value.lamports),
        exists: true
      };
    } catch (error) {
      console.error('Get wallet info failed:', error);
      throw error;
    }
  }

  // Additional method to demonstrate @solana/kit RPC capabilities
  async getProgramAccounts(): Promise<number> {
    try {
      const accounts = await this.rpc.getProgramAccounts(
        address(this.config.programId.toBase58()),
        { encoding: 'base64' }
      ).send();
      
      return accounts.length;
    } catch (error) {
      console.error('Get program accounts failed:', error);
      return 0;
    }
  }

  // Initialize wallet relay method for API compatibility
  async initializeWalletRelay(sim: string, pin: string, country: string): Promise<RelayResult<InitializeWalletResult>> {
    try {
      const result = await this.initializeWallet({ sim, pin, country });
      
      // Create wallet PDA to get the address
      const [walletPDA] = await this.createWalletPDA(sim);
      
      return {
        success: true,
        data: {
          walletAddress: walletPDA.toBase58(),
          sim,
          country
        },
        signature: result // This is the message for now
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'INITIALIZE_WALLET_FAILED'
        }
      };
    }
  }

  // Send funds relay method for API compatibility
  async sendFundsRelay(fromSim: string, toSim: string, amount: number, pin: string, country: string): Promise<RelayResult<SendFundsResult>> {
    try {
      const result = await this.sendFunds({ 
        fromSim, 
        toSim, 
        amount, 
        fromCountry: country, 
        toCountry: country 
      });
      
      return {
        success: true,
        data: {
          amount,
          fromSim,
          toSim,
          signature: result
        },
        signature: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SEND_FUNDS_FAILED'
        }
      };
    }
  }

  // Deposit funds relay method for API compatibility
  async depositFundsRelay(sim: string, amount: number, country: string): Promise<RelayResult<{ amount: number; sim: string; signature: string }>> {
    try {
      const result = await this.depositFunds({ sim, amount, country });
      
      return {
        success: true,
        data: {
          amount,
          sim,
          signature: result
        },
        signature: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'DEPOSIT_FUNDS_FAILED'
        }
      };
    }
  }

  // Check balance relay method for API compatibility
  async checkBalanceRelay(sim: string, pin: string, country: string): Promise<RelayResult<CheckBalanceResult>> {
    try {
      const balance = await this.checkBalance({ sim, country });
      
      // Create wallet PDA to get the address
      const [walletPDA] = await this.createWalletPDA(sim);
      
      return {
        success: true,
        data: {
          balance,
          walletAddress: walletPDA.toBase58(),
          sim
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'CHECK_BALANCE_FAILED'
        }
      };
    }
  }

  // Set alias relay method for API compatibility
  async setAliasRelay(sim: string, pin: string, alias: string, country: string): Promise<RelayResult<SetAliasResult>> {
    try {
      const result = await this.setAlias({ sim, alias, country });
      
      return {
        success: true,
        data: {
          alias,
          sim,
          signature: result // This is the message for now
        },
        signature: result
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'SET_ALIAS_FAILED'
        }
      };
    }
  }
} 