import { PolkadotChain } from '../polkadot-chain';
import { ChainConfig } from '../base-chain';

// Mock Polkadot dependencies
jest.mock('@polkadot/api', () => ({
  ApiPromise: {
    create: jest.fn().mockResolvedValue({
      tx: {
        balances: {
          transfer: jest.fn().mockReturnValue({
            signAndSend: jest.fn().mockResolvedValue({
              toHex: jest.fn().mockReturnValue('0x1234567890abcdef')
            })
          })
        },
        query: {
          system: {
            account: jest.fn().mockResolvedValue({
              data: {
                free: {
                  toString: jest.fn().mockReturnValue('1000000000000')
                }
              }
            })
          }
        }
      },
      query: {
        system: {
          account: jest.fn().mockResolvedValue({
            data: {
              free: {
                toString: jest.fn().mockReturnValue('1000000000000')
              }
            }
          })
        }
      }
    })
  },
  WsProvider: jest.fn()
}));

jest.mock('@polkadot/keyring', () => ({
  Keyring: jest.fn().mockImplementation(() => ({
    addFromUri: jest.fn().mockReturnValue({
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
      signAndSend: jest.fn().mockResolvedValue({
        toHex: jest.fn().mockReturnValue('0x1234567890abcdef')
      })
    })
  }))
}));

describe('PolkadotChain', () => {
  let polkadotChain: PolkadotChain;
  let mockSolanaPinValidator: jest.Mock;

  const mockConfig: ChainConfig = {
    id: 'polkadot',
    name: 'Polkadot',
    rpcUrl: 'wss://rpc.polkadot.io',
    chainId: 0,
    nativeCurrency: {
      symbol: 'DOT',
      decimals: 10,
    },
    blockExplorer: 'https://polkascan.io',
    isTestnet: false,
  };

  beforeEach(() => {
    mockSolanaPinValidator = jest.fn();
    polkadotChain = new PolkadotChain(mockConfig, mockSolanaPinValidator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with config and PIN validator', () => {
      expect(polkadotChain).toBeInstanceOf(PolkadotChain);
    });
  });

  describe('initializeWallet', () => {
    it('should validate PIN via Solana before creating wallet', async () => {
      mockSolanaPinValidator.mockResolvedValue(true);

      const result = await polkadotChain.initializeWallet('+1234567890', '123456');

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toBe('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');
    });

    it('should throw error if PIN validation fails', async () => {
      mockSolanaPinValidator.mockResolvedValue(false);

      await expect(
        polkadotChain.initializeWallet('+1234567890', '123456')
      ).rejects.toThrow('Invalid PIN');
    });
  });

  describe('sendFunds', () => {
    it('should validate PIN via Solana before sending funds', async () => {
      mockSolanaPinValidator.mockResolvedValue(true);

      const result = await polkadotChain.sendFunds(
        '+1234567890',
        '+0987654321',
        '1000000000',
        '123456'
      );

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toEqual({
        hash: '0x1234567890abcdef',
        from: '+1234567890',
        to: '+0987654321',
        amount: '1000000000',
        status: 'confirmed',
      });
    });

    it('should throw error if PIN validation fails', async () => {
      mockSolanaPinValidator.mockResolvedValue(false);

      await expect(
        polkadotChain.sendFunds('+1234567890', '+0987654321', '1000000000', '123456')
      ).rejects.toThrow('Invalid PIN');
    });
  });

  describe('checkBalance', () => {
    it('should validate PIN via Solana before checking balance', async () => {
      mockSolanaPinValidator.mockResolvedValue(true);

      const result = await polkadotChain.checkBalance('+1234567890', '123456');

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toBe('1000000000000');
    });

    it('should throw error if PIN validation fails', async () => {
      mockSolanaPinValidator.mockResolvedValue(false);

      await expect(
        polkadotChain.checkBalance('+1234567890', '123456')
      ).rejects.toThrow('Invalid PIN');
    });
  });

  describe('setAlias', () => {
    it('should validate PIN via Solana before setting alias', async () => {
      mockSolanaPinValidator.mockResolvedValue(true);

      const result = await polkadotChain.setAlias('+1234567890', 'test-alias', '123456');

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toBe(true);
    });

    it('should throw error if PIN validation fails', async () => {
      mockSolanaPinValidator.mockResolvedValue(false);

      await expect(
        polkadotChain.setAlias('+1234567890', 'test-alias', '123456')
      ).rejects.toThrow('Invalid PIN');
    });
  });

  describe('validatePin', () => {
    it('should always delegate to Solana PIN validator', async () => {
      mockSolanaPinValidator.mockResolvedValue(true);

      const result = await polkadotChain.validatePin('+1234567890', '123456');

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toBe(true);
    });

    it('should return false when Solana validation fails', async () => {
      mockSolanaPinValidator.mockResolvedValue(false);

      const result = await polkadotChain.validatePin('+1234567890', '123456');

      expect(mockSolanaPinValidator).toHaveBeenCalledWith('+1234567890', '123456');
      expect(result).toBe(false);
    });
  });
}); 