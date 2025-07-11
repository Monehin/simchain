import { PublicKey } from "@solana/web3.js";

// Custom types for the SIMChain wallet program
export interface SimchainWallet {
  programId: PublicKey;
  // Add other program-specific types as needed
}

// Account types
export interface WalletAccount {
  owner: PublicKey;
  sim_hash: Uint8Array;
  pin_hash: Uint8Array;
  alias: Uint8Array;
  bump: number;
  version: string;
}

export interface MintRegistryAccount {
  admin: PublicKey;
  approved: PublicKey[];
  bump: number;
  wallet_count: number; // Track total wallets for health check
  // version: string; // Removed from program
}

export interface ConfigAccount {
  salt: Uint8Array;
}

// Instruction types
export interface InitializeWalletInstruction {
  sim_hash: Uint8Array;
  pin_hash: Uint8Array;
}

export interface InitializeConfigInstruction {
  salt: Uint8Array;
}

export interface RotateSaltInstruction {
  new_salt: Uint8Array;
}

export interface SetAliasInstruction {
  alias: Uint8Array;
}

// Event types
export interface WalletInitializedEvent {
  wallet: PublicKey;
  owner: PublicKey;
  sim_hash: Uint8Array;
}

export interface TokenTransferredEvent {
  from_wallet: PublicKey;
  to_wallet: PublicKey;
  mint: PublicKey;
  amount: number;
  relayer: PublicKey;
}

export interface NativeSentEvent {
  from_wallet: PublicKey;
  to_wallet: PublicKey;
  amount: number;
}

export interface SaltRotatedEvent {
  old_salt: Uint8Array;
  new_salt: Uint8Array;
  admin: PublicKey;
}

export interface AdminTransferredEvent {
  old_admin: PublicKey;
  new_admin: PublicKey;
}

export interface MintAddedEvent {
  mint: PublicKey;
  admin: PublicKey;
}

export interface WalletClosedEvent {
  wallet: PublicKey;
  owner: PublicKey;
  destination: PublicKey;
}

export interface RegistryClosedEvent {
  admin: PublicKey;
  destination: PublicKey;
}

// Error types
export interface SimchainError {
  code: string;
  message: string;
}

// Response types
export interface HealthResponse {
  registry: MintRegistryAccount;
  version: string;
  programId: PublicKey;
}

export interface BalanceResponse {
  native: number;
  tokens: { [mint: string]: number };
}

export interface WalletInfo {
  address: PublicKey;
  owner: PublicKey;
  alias: string;
  balance: BalanceResponse;
} 