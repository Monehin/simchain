import { ChainConfig } from '../lib/chains/base-chain';

// Solana Configuration
export const solanaConfig: ChainConfig = {
  id: 'solana',
  name: 'Solana',
  rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  chainId: 101,
  nativeCurrency: {
    symbol: 'SOL',
    decimals: 9,
  },
  blockExplorer: 'https://explorer.solana.com',
  isTestnet: process.env.NODE_ENV === 'development',
};

// Polkadot Configuration
export const polkadotConfig: ChainConfig = {
  id: 'polkadot',
  name: 'Polkadot',
  rpcUrl: process.env.POLKADOT_RPC_URL || 'wss://rpc.polkadot.io',
  chainId: 0, // Polkadot mainnet
  nativeCurrency: {
    symbol: 'DOT',
    decimals: 10,
  },
  blockExplorer: 'https://polkascan.io',
  isTestnet: process.env.NODE_ENV === 'development',
};

// Ethereum Configuration (for future use)
export const ethereumConfig: ChainConfig = {
  id: 'ethereum',
  name: 'Ethereum',
  rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
  chainId: 1,
  nativeCurrency: {
    symbol: 'ETH',
    decimals: 18,
  },
  blockExplorer: 'https://etherscan.io',
  isTestnet: process.env.NODE_ENV === 'development',
};

// Polygon Configuration (for future use)
export const polygonConfig: ChainConfig = {
  id: 'polygon',
  name: 'Polygon',
  rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  chainId: 137,
  nativeCurrency: {
    symbol: 'MATIC',
    decimals: 18,
  },
  blockExplorer: 'https://polygonscan.com',
  isTestnet: process.env.NODE_ENV === 'development',
};

// Chain registry - maps chain IDs to configurations
export const chainConfigs: Record<string, ChainConfig> = {
  solana: solanaConfig,
  polkadot: polkadotConfig,
  ethereum: ethereumConfig,
  polygon: polygonConfig,
};

// Get chain configuration by ID
export function getChainConfig(chainId: string): ChainConfig {
  const config = chainConfigs[chainId];
  if (!config) {
    throw new Error(`Unsupported chain: ${chainId}`);
  }
  return config;
}

// Get all supported chain IDs
export function getSupportedChains(): string[] {
  return Object.keys(chainConfigs);
}

// Check if a chain is supported
export function isChainSupported(chainId: string): boolean {
  return chainId in chainConfigs;
} 