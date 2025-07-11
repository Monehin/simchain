import { NextRequest, NextResponse } from 'next/server';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { AnchorProvider } from '@coral-xyz/anchor';
import { SimchainRelay } from '../../../lib/simchain-relay-test';
import idl from '../idl/simchain_wallet.json';
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
    const result = await relay.initializeWallet(sim, pin);
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to initialize wallet' },
      { status: 500 }
    );
  }
}

 