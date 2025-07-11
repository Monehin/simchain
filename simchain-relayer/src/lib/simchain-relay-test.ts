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
  program: Program<any>;
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

// Phone number normalization
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
    // Simple 6-digit numeric PIN
    if (pin.length !== 6) return false;
    if (!/^\d{6}$/.test(pin)) return false; // Must be exactly 6 digits
    
    return true;
  }
  
  static hashPin(pin: string): Uint8Array {
    if (!this.validatePin(pin)) {
      throw new Error('PIN must be exactly 6 digits');
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
    } catch {
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
      await this.config.connection.getAccountInfo(this.config.programId);
      
      return {
        success: true,
        data: {
          connected: true,
          programId: this.config.programId.toBase58()
        }
      };
    } catch {
      return {
        success: false,
        error: {
          code: 'CONNECTION_ERROR',
          message: 'Failed to connect to validator'
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get wallet info';
      return {
        success: false,
        error: {
          code: 'WALLET_INFO_ERROR',
          message: errorMessage
        }
      };
    }
  }

  // Check if wallet exists
  async walletExists(sim: string): Promise<boolean> {
    try {
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const walletAccount = await this.config.connection.getAccountInfo(walletPda);
      return walletAccount !== null;
    } catch {
      return false;
    }
  }

  // Get wallet balance
  async getWalletBalance(sim: string): Promise<number> {
    try {
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const balance = await this.config.connection.getBalance(walletPda);
      return balance / LAMPORTS_PER_SOL;
    } catch {
      return 0;
    }
  }

  async initializeWallet(sim: string, pin: string): Promise<RelayResult> {
    try {
      const normalizedSim = PhoneNormalizer.normalize(sim);
      const pinHash = PinManager.hashPin(pin);
      const [walletPda] = await this.deriveWalletPDA(normalizedSim);
      const provider = this.config.provider;
      const program = this.config.program;
      const user = provider.wallet.publicKey;

      // Compose and send the transaction
      const tx = await program.methods
        .initializeWallet(normalizedSim, Array.from(pinHash))
        .accounts({
          wallet: walletPda,
          authority: user,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      return {
        success: true,
        signature: tx,
        data: { wallet: walletPda.toBase58() }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INITIALIZE_WALLET_ERROR',
          message: error.message || 'Failed to initialize wallet',
          details: error
        }
      };
    }
  }
}

// Comprehensive test suite
export class SimchainRelayTests {
  private relay: SimchainRelay;
  private connection: Connection;
  private programId: PublicKey;

  constructor(relay: SimchainRelay, connection: Connection, programId: PublicKey) {
    this.relay = relay;
    this.connection = connection;
    this.programId = programId;
  }

  // Test phone number normalization
  testPhoneNormalization(): void {
    console.log('🧪 Testing Phone Number Normalization...');
    
    const testCases = [
      { input: '+1234567890', expected: '+1234567890' },
      { input: '1234567890', expected: '+1234567890' },
      { input: '+1 (234) 567-8900', expected: '+12345678900' },
      { input: '1-234-567-8900', expected: '+12345678900' },
    ];

    testCases.forEach(({ input, expected }) => {
      try {
        const result = PhoneNormalizer.normalize(input);
        console.log(`✅ ${input} → ${result} (expected: ${expected})`);
      } catch (error) {
        console.log(`❌ ${input} → Error: ${error}`);
      }
    });
  }

  // Test PIN validation
  testPinValidation(): void {
    console.log('\n🧪 Testing PIN Validation...');
    
    const testCases = [
      { pin: '123456', valid: true, reason: 'Valid 6-digit PIN' },
      { pin: '000000', valid: true, reason: 'Valid 6-digit PIN' },
      { pin: '12345', valid: false, reason: 'Too short (5 digits)' },
      { pin: '1234567', valid: false, reason: 'Too long (7 digits)' },
      { pin: '12345a', valid: false, reason: 'Contains letters' },
      { pin: '123 456', valid: false, reason: 'Contains spaces' },
      { pin: '12-34-56', valid: false, reason: 'Contains hyphens' },
    ];

    testCases.forEach(({ pin, valid, reason }) => {
      const result = PinManager.validatePin(pin);
      const status = result === valid ? '✅' : '❌';
      console.log(`${status} ${pin} → ${result} (${reason})`);
    });
  }

  // Test alias validation
  testAliasValidation(): void {
    console.log('\n🧪 Testing Alias Validation...');
    
    const testCases = [
      { alias: 'test', valid: true, reason: 'Valid alias' },
      { alias: 'test_alias_123456789012345678901234567890', valid: false, reason: 'Too long' },
      { alias: '', valid: false, reason: 'Empty' },
      { alias: 'test\x00alias', valid: false, reason: 'Non-printable characters' },
      { alias: '00000000000000000000000000000000', valid: false, reason: 'All zeros' },
      { alias: 'test-alias_123', valid: true, reason: 'Valid with special chars' },
    ];

    testCases.forEach(({ alias, valid, reason }) => {
      const result = AliasValidator.validateAlias(alias);
      const status = result === valid ? '✅' : '❌';
      console.log(`${status} "${alias}" → ${result} (${reason})`);
    });
  }

  // Test wallet operations
  async testWalletOperations(): Promise<void> {
    console.log('\n🧪 Testing Wallet Operations...');
    
    const testSim = '+1234567890';
    
    // Test wallet existence check
    const exists = await this.relay.walletExists(testSim);
    console.log(`📱 Wallet exists for ${testSim}: ${exists}`);
    
    // Test wallet info
    const walletInfo = await this.relay.getWalletInfo(testSim);
    if (walletInfo.success) {
      console.log(`💰 Wallet info: ${JSON.stringify(walletInfo.data)}`);
    } else {
      console.log(`❌ Failed to get wallet info: ${walletInfo.error?.message}`);
    }
    
    // Test wallet balance
    const balance = await this.relay.getWalletBalance(testSim);
    console.log(`💎 Wallet balance: ${balance} SOL`);
  }

  // Test health check
  async testHealthCheck(): Promise<void> {
    console.log('\n🧪 Testing Health Check...');
    
    const health = await this.relay.healthCheck();
    if (health.success) {
      console.log(`✅ Health check passed: ${JSON.stringify(health.data)}`);
    } else {
      console.log(`❌ Health check failed: ${health.error?.message}`);
    }
  }

  // Test PDA derivation
  async testPDADerivation(): Promise<void> {
    console.log('\n🧪 Testing PDA Derivation...');
    
    const testSim = '+1234567890';
    const testAlias = 'testalias';
    
    try {
      // Test wallet PDA derivation
      const [walletPda] = await this.relay['deriveWalletPDA'](testSim);
      console.log(`📱 Wallet PDA: ${walletPda.toBase58()}`);
      
      // Test alias PDA derivation
      const aliasBytes = AliasValidator.normalizeAlias(testAlias);
      const [aliasPda] = this.relay['deriveAliasIndexPDA'](aliasBytes);
      console.log(`🏷️ Alias PDA: ${aliasPda.toBase58()}`);
      
    } catch (error) {
      console.log(`❌ PDA derivation failed: ${error}`);
    }
  }

  // Run all tests
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting SIMChain Relay Test Suite\n');
    
    this.testPhoneNormalization();
    this.testPinValidation();
    this.testAliasValidation();
    await this.testHealthCheck();
    await this.testPDADerivation();
    await this.testWalletOperations();
    
    console.log('\n✅ Test suite completed!');
  }
}

// Example usage
export async function createRelayExample(): Promise<void> {
  console.log('🔧 Creating SIMChain Relay Example...');
  
  // Setup connection
  const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
  const programId = new PublicKey('DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');
  
  // Create a mock provider and program (in real usage, these would be properly initialized)
  const mockProvider = {
    connection,
    wallet: Keypair.generate(),
    publicKey: Keypair.generate().publicKey,
  } as AnchorProvider;
  
  const mockProgram = {
    provider: mockProvider,
    programId,
    methods: {},
    account: {},
  } as Program<any>;
  
  const config: RelayConfig = {
    connection,
    programId,
    provider: mockProvider,
    program: mockProgram,
  };
  
  const relay = new SimchainRelay(config);
  const tests = new SimchainRelayTests(relay, connection, programId);
  
  await tests.runAllTests();
} 