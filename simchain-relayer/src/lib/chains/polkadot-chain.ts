import { BaseChain, ChainConfig, ChainTransaction } from './base-chain';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
// import { hexToU8a } from '@polkadot/util'; // Removed unused import

// For PIN validation, we will require a SolanaChain instance to be passed in
// or use a callback to validate PINs via Solana

export class PolkadotChain extends BaseChain {
  private api: ApiPromise | null = null;
  private keyring: Keyring;
  private solanaPinValidator: (sim: string, pin: string) => Promise<boolean>;

  constructor(config: ChainConfig, solanaPinValidator: (sim: string, pin: string) => Promise<boolean>) {
    super(config);
    this.keyring = new Keyring({ type: 'sr25519' });
    this.solanaPinValidator = solanaPinValidator;
  }

  private async getApi(): Promise<ApiPromise> {
    if (!this.api) {
      const provider = new WsProvider(this.config.rpcUrl);
      this.api = await ApiPromise.create({ provider });
    }
    return this.api;
  }

  async initializeWallet(sim: string, pin: string): Promise<string> {
    // Validate PIN via Solana
    const isValid = await this.solanaPinValidator(sim, pin);
    if (!isValid) throw new Error('Invalid PIN');
    // For demo: generate a new Polkadot address (in production, use deterministic derivation)
    const pair = this.keyring.addFromUri(`${sim}-${pin}`);
    return pair.address;
  }

  async sendFunds(from: string, to: string, amount: string, pin: string): Promise<ChainTransaction> {
    // Validate PIN via Solana
    const isValid = await this.solanaPinValidator(from, pin);
    if (!isValid) throw new Error('Invalid PIN');
    const api = await this.getApi();
    // For demo: use keyring to sign (in production, use secure key management)
    const sender = this.keyring.addFromUri(`${from}-${pin}`);
    const transfer = api.tx.balances.transfer(to, BigInt(amount));
    const hash = await transfer.signAndSend(sender);
    return {
      hash: hash.toHex(),
      from,
      to,
      amount,
      status: 'confirmed',
    };
  }

  async checkBalance(sim: string, pin: string): Promise<string> {
    // Validate PIN via Solana
    const isValid = await this.solanaPinValidator(sim, pin);
    if (!isValid) throw new Error('Invalid PIN');
    const api = await this.getApi();
    const address = this.keyring.addFromUri(`${sim}-${pin}`).address;
    const accountInfo = await api.query.system.account(address);
    // Polkadot returns { data: { free, reserved, miscFrozen, feeFrozen } }
    // Use .toHuman() for readable, or .toJSON() for raw
    // But .data is available on the inner object
    // Use .data.free for the free balance
    // Types: https://polkadot.js.org/docs/api/start/typescript.user
    // @ts-expect-error Polkadot.js types do not expose .data.free directly, but it exists at runtime
    return accountInfo.data.free.toString();
  }

  async setAlias(sim: string, alias: string, pin: string): Promise<boolean> {
    // Validate PIN via Solana
    const isValid = await this.solanaPinValidator(sim, pin);
    if (!isValid) throw new Error('Invalid PIN');
    // For demo: no on-chain alias, just return true
    return true;
  }

  async validatePin(sim: string, pin: string): Promise<boolean> {
    // Always delegate to Solana
    return this.solanaPinValidator(sim, pin);
  }
} 