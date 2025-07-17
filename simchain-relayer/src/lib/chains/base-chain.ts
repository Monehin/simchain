export interface ChainConfig {
  id: string;
  name: string;
  rpcUrl: string;
  chainId: number;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  blockExplorer?: string;
  isTestnet: boolean;
}

export interface ChainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  gasUsed?: string;
  gasPrice?: string;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface ChainWallet {
  address: string;
  balance: string;
  exists: boolean;
  alias?: string;
}

export abstract class BaseChain {
  protected config: ChainConfig;

  constructor(config: ChainConfig) {
    this.config = config;
  }

  abstract initializeWallet(sim: string, pin: string): Promise<string>;
  abstract sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction>;
  abstract checkBalance(sim: string, pin: string): Promise<string>;
  abstract setAlias(sim: string, alias: string, pin: string): Promise<boolean>;
  abstract validatePin(sim: string, pin: string): Promise<boolean>;
} 