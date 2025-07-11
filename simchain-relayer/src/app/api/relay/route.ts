import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SimchainRelay } from '../../../lib/simchain-relay';
import { AliasValidator, PinValidator } from '../../../lib/validation';
import { DatabaseService } from '../../../lib/database';

import fs from 'fs';
import path from 'path';

const connection = new Connection('http://127.0.0.1:8899', 'confirmed');
const PROGRAM_ID = new PublicKey('DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r');

// Use the default Solana keypair
const keypairPath = path.join(process.env.HOME || '', '.config/solana/id.json');
const wallet = Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf-8')))
);

const provider = new AnchorProvider(
  connection,
  {
    publicKey: wallet.publicKey,
    signTransaction: async (tx) => {
      if (tx instanceof Transaction) {
        tx.partialSign(wallet);
      }
      return tx;
    },
    signAllTransactions: async (txs) => {
      return txs.map(tx => {
        if (tx instanceof Transaction) {
          tx.partialSign(wallet);
        }
        return tx;
      });
    },
  },
  { commitment: 'confirmed' }
);

// Create a program instance that can handle real transactions
const program = {
  provider,
  programId: PROGRAM_ID,
  methods: {
    initializeWallet: (sim: string, pinHashArray: number[]) => ({
      accounts: (accounts: any) => ({
        rpc: async () => {
          try {
            // Create the real transaction
            const transaction = new Transaction();
            
            // Fund the wallet with SOL first to cover transaction fees
            const fundTransaction = new Transaction();
            fundTransaction.add(
              SystemProgram.transfer({
                fromPubkey: wallet.publicKey,
                toPubkey: accounts.authority,
                lamports: 1000000 // 0.001 SOL
              })
            );
            
            // Send the funding transaction
            await provider.sendAndConfirm(fundTransaction, [wallet]);
            
            // Derive the missing accounts
            const [configPda] = PublicKey.findProgramAddressSync(
              [Buffer.from('config')],
              PROGRAM_ID
            );
            
            const [registryPda] = PublicKey.findProgramAddressSync(
              [Buffer.from('mint_registry')],
              PROGRAM_ID
            );
            
            // Add the initialize wallet instruction
            const instruction = {
              programId: PROGRAM_ID,
              keys: [
                { pubkey: accounts.wallet, isSigner: false, isWritable: true },
                { pubkey: accounts.authority, isSigner: true, isWritable: true },
                { pubkey: configPda, isSigner: false, isWritable: false },
                { pubkey: registryPda, isSigner: false, isWritable: true },
                { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
                { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
              ],
              data: Buffer.concat([
                // Instruction discriminator for initialize_wallet: [213, 0, 239, 240, 73, 100, 188, 193]
                Buffer.from([213, 0, 239, 240, 73, 100, 188, 193]),
                // Serialize sim string (4-byte length + bytes)
                Buffer.alloc(4),
                Buffer.from(sim, 'utf8'),
                // Serialize pinHash array (32 bytes)
                Buffer.from(pinHashArray)
              ])
            };
            
            // Set the string length properly
            const simBytes = Buffer.from(sim, 'utf8');
            instruction.data.writeUInt32LE(simBytes.length, 8);
            
            transaction.add(instruction);
            
            // Send the transaction
            const signature = await provider.sendAndConfirm(transaction, [wallet]);
            return signature;
          } catch (error) {
            console.error('Transaction failed:', error);
            throw error;
          }
        }
      })
    })
  },
  account: {
    config: {
      fetch: async (address: PublicKey) => {
        const accountInfo = await connection.getAccountInfo(address);
        if (!accountInfo) throw new Error('Config account not found');
        
        // Parse the config account data manually
        const data = accountInfo.data;
        if (data.length < 77) throw new Error('Invalid config account size');
        
        // Skip discriminator (8 bytes), read admin (32 bytes), salt length (4 bytes), salt (variable)
        const adminBytes = data.slice(8, 40);
        const saltLengthBytes = data.slice(40, 44);
        const saltLength = new DataView(saltLengthBytes.buffer, saltLengthBytes.byteOffset, 4).getUint32(0, true);
        const salt = data.slice(44, 44 + saltLength);
        
        return {
          admin: new PublicKey(adminBytes),
          salt: Array.from(salt),
          bump: data[data.length - 1]
        };
      }
    }
  }
} as any;

const relay = new SimchainRelay({
  connection,
  programId: PROGRAM_ID,
  provider,
  program,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'wallet-exists':
        return await handleWalletExists(params);
      
      case 'wallet-info':
        return await handleWalletInfo(params);
      
      case 'wallet-balance':
        return await handleWalletBalance(params);
      
      case 'health-check':
        return await handleHealthCheck();
      
      case 'initialize-wallet':
        return await handleInitializeWallet(params);
      
      case 'verify-pin':
        return await handleVerifyPin(params);
      
      case 'set-alias':
        return await handleSetAlias(params);
      
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Relay API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleWalletExists(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    const exists = await relay.walletExists(sim);
    return NextResponse.json({
      success: true,
      data: { exists }
    });
  } catch (error) {
    console.error('Wallet exists error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check wallet existence' },
      { status: 500 }
    );
  }
}

async function handleWalletInfo(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    const info = await relay.getWalletInfo(sim);
    return NextResponse.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Wallet info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get wallet info' },
      { status: 500 }
    );
  }
}

async function handleWalletBalance(params: { sim?: string }) {
  try {
    const { sim } = params;
    if (!sim) {
      return NextResponse.json(
        { success: false, error: 'SIM number required' },
        { status: 400 }
      );
    }

    const balance = await relay.getWalletBalance(sim);
    return NextResponse.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error('Wallet balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get wallet balance' },
      { status: 500 }
    );
  }
}

async function handleHealthCheck() {
  try {
    const health = await relay.healthCheck();
    return NextResponse.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
}

async function handleInitializeWallet(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Check if wallet already exists in database
    const existingWallet = await DatabaseService.getWalletBySimNumber(sim);
    if (existingWallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet already exists for this SIM number' },
        { status: 409 }
      );
    }

    const result = await relay.initializeWallet(sim, pin, wallet);
    
    console.log('🔍 Debug: Wallet creation result:', JSON.stringify(result, null, 2));
    
    // Check if the result has the expected structure
    if (result.success && result.data && typeof result.data === 'object') {
      console.log('✅ Debug: Result is successful and has data object');
      
      // The relay returns { success: true, data: { wallet: "address" } }
      const walletAddress = (result.data as any).wallet;
      if (walletAddress) {
        console.log('✅ Debug: Found wallet address:', walletAddress);
        
        // Store wallet mapping in database
        try {
          await DatabaseService.createWalletMapping({
            simNumber: sim,
            walletAddress: walletAddress,
            ownerAddress: wallet.publicKey.toBase58(),
            simHash: '0x0000000000000000000000000000000000000000000000000000000000000000', // We'll get this from on-chain data later
          });
          console.log('✅ Debug: Wallet mapping stored successfully in database');
        } catch (dbError) {
          console.error('❌ Debug: Failed to store wallet mapping in database:', dbError);
          // Don't fail the wallet creation, just log the error
        }
      } else {
        console.log('❌ Debug: No wallet address found in result data');
      }
    } else {
      console.log('❌ Debug: Result structure not as expected for database storage');
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Initialize wallet error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to initialize wallet' },
      { status: 500 }
    );
  }
}

async function handleVerifyPin(params: { sim?: string, pin?: string }) {
  try {
    const { sim, pin } = params;
    if (!sim || !pin) {
      return NextResponse.json(
        { success: false, error: 'SIM number and PIN required' },
        { status: 400 }
      );
    }

    // Validate PIN format
    if (!PinValidator.validatePin(pin)) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN format. Must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    // Check if wallet exists
    const exists = await relay.walletExists(sim);
    if (!exists) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found for this SIM number' },
        { status: 404 }
      );
    }

    // Get wallet info to verify PIN hash
    const walletInfo = await relay.getWalletInfo(sim);
    if (!walletInfo.success || !walletInfo.data) {
      return NextResponse.json(
        { success: false, error: 'Failed to get wallet information' },
        { status: 500 }
      );
    }

    // Hash the provided PIN
    const providedPinHash = await PinValidator.hashPin(pin);
    
    // Get the stored PIN hash from wallet info
    const storedPinHash = walletInfo.data.pinHash;
    
    if (!storedPinHash) {
      return NextResponse.json(
        { success: false, error: 'Wallet data corrupted - no PIN hash found' },
        { status: 500 }
      );
    }
    
    // Compare the provided PIN hash with the stored PIN hash
    if (providedPinHash.length !== storedPinHash.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }
    
    // Constant-time comparison to prevent timing attacks
    let isMatch = true;
    for (let i = 0; i < providedPinHash.length; i++) {
      if (providedPinHash[i] !== storedPinHash[i]) {
        isMatch = false;
      }
    }
    
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    // PIN is valid
    return NextResponse.json({
      success: true,
      data: { verified: true }
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}

async function handleSetAlias(params: { sim?: string, alias?: string }) {
  try {
    const { sim, alias } = params;
    if (!sim || !alias) {
      return NextResponse.json(
        { success: false, error: 'SIM number and alias required' },
        { status: 400 }
      );
    }

    // Validate alias using the new rules
    if (!AliasValidator.validateAlias(alias)) {
      return NextResponse.json(
        { success: false, error: 'Invalid alias format. Must be 2-12 characters (letters, digits, underscore, hyphen)' },
        { status: 400 }
      );
    }

    // Check if wallet exists in database
    const walletMapping = await DatabaseService.getWalletBySimNumber(sim);
    if (!walletMapping) {
      return NextResponse.json(
        { success: false, error: 'Wallet not found for this SIM number' },
        { status: 404 }
      );
    }

    // Check if alias is already in use by another wallet
    const aliasInUse = await DatabaseService.isAliasInUse(alias);
    if (aliasInUse) {
      return NextResponse.json(
        { success: false, error: 'Alias is already in use by another wallet' },
        { status: 409 }
      );
    }

    // Implement real on-chain alias setting
    try {
      // Normalize the alias to 32 bytes
      const aliasBytes = new Uint8Array(32);
      const encoder = new TextEncoder();
      const aliasStringBytes = encoder.encode(alias);
      aliasBytes.set(aliasStringBytes);

      // Derive the alias index PDA
      const [aliasIndexPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('alias'), aliasBytes],
        PROGRAM_ID
      );

      // Get wallet info to find the wallet address
      const walletInfo = await relay.getWalletInfo(sim);
      if (!walletInfo.success || !walletInfo.data?.address) {
        return NextResponse.json(
          { success: false, error: 'Failed to get wallet address' },
          { status: 500 }
        );
      }

      const walletAddress = new PublicKey(walletInfo.data.address);

      // Create the set_alias instruction
      const instruction = {
        programId: PROGRAM_ID,
        keys: [
          { pubkey: walletAddress, isSigner: false, isWritable: true },
          { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
          { pubkey: aliasIndexPda, isSigner: false, isWritable: true },
          { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
          { pubkey: new PublicKey('Sysvar1nstructions1111111111111111111111111'), isSigner: false, isWritable: false }
        ],
        data: Buffer.concat([
          // Instruction discriminator for set_alias: [122, 40, 47, 157, 153, 82, 76, 31]
          Buffer.from([122, 40, 47, 157, 153, 82, 76, 31]),
          // Serialize alias array (32 bytes)
          Buffer.from(aliasBytes)
        ])
      };

      const transaction = new Transaction();
      transaction.add(instruction);

      // Send the transaction
      const signature = await provider.sendAndConfirm(transaction, [wallet]);

      // Update database with new alias
      try {
        await DatabaseService.updateWalletAlias(walletMapping.walletAddress, alias, 'user');
      } catch (dbError) {
        console.error('Failed to update alias in database:', dbError);
        // Don't fail the on-chain update, just log the error
      }

      return NextResponse.json({
        success: true,
        data: { 
          alias,
          signature,
          message: 'Alias updated successfully on-chain and in database'
        }
      });
    } catch (error: any) {
      console.error('Set alias transaction failed:', error);
      return NextResponse.json(
        { success: false, error: `Failed to update alias on-chain: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Set alias error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set alias' },
      { status: 500 }
    );
  }
}

 