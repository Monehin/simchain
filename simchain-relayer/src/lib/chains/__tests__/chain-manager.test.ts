import { ChainManager } from '../chain-manager';
import { SolanaChain } from '../solana-chain';
import { PolkadotChain } from '../polkadot-chain';

// Mock the chain implementations
jest.mock('../solana-chain');
jest.mock('../polkadot-chain');

const MockSolanaChain = SolanaChain as jest.MockedClass<typeof SolanaChain>;
const MockPolkadotChain = PolkadotChain as jest.MockedClass<typeof PolkadotChain>;

describe('ChainManager', () => {
  let chainManager: ChainManager;
  let mockSolanaChain: jest.Mocked<SolanaChain>;
  let mockPolkadotChain: jest.Mocked<PolkadotChain>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock SolanaChain
    mockSolanaChain = {
      validatePin: jest.fn(),
      initializeWallet: jest.fn(),
      sendFunds: jest.fn(),
      checkBalance: jest.fn(),
      setAlias: jest.fn(),
      getWalletInfo: jest.fn(),
      testConnection: jest.fn(),
    } as unknown as jest.Mocked<SolanaChain>;

    // Setup mock PolkadotChain
    mockPolkadotChain = {
      validatePin: jest.fn(),
      initializeWallet: jest.fn(),
      sendFunds: jest.fn(),
      checkBalance: jest.fn(),
      setAlias: jest.fn(),
    } as unknown as jest.Mocked<PolkadotChain>;

    // Mock constructor implementations
    MockSolanaChain.mockImplementation(() => mockSolanaChain);
    MockPolkadotChain.mockImplementation(() => mockPolkadotChain);

    chainManager = new ChainManager();
  });

  describe('constructor', () => {
    it('should initialize Solana and Polkadot chains', () => {
      expect(MockSolanaChain).toHaveBeenCalled();
      expect(MockPolkadotChain).toHaveBeenCalled();
    });

    it('should pass Solana PIN validator to PolkadotChain', () => {
      expect(MockPolkadotChain).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe('executeOperation', () => {
    describe('Solana operations', () => {
      it('should execute Solana operations directly', async () => {
        mockSolanaChain.initializeWallet.mockResolvedValue('solana-wallet-address');

        const result = await chainManager.executeOperation({
          type: 'initializeWallet',
          targetChain: 'solana',
          sim: '+1234567890',
          pin: '123456',
          params: {}
        });

        expect(mockSolanaChain.initializeWallet).toHaveBeenCalledWith('+1234567890', '123456');
        expect(result).toBe('solana-wallet-address');
      });

      it('should not validate PIN on Solana for Solana operations', async () => {
        mockSolanaChain.sendFunds.mockResolvedValue({
          hash: 'tx-hash',
          from: '+1234567890',
          to: '+0987654321',
          amount: '1000000',
          status: 'confirmed'
        });

        await chainManager.executeOperation({
          type: 'sendFunds',
          targetChain: 'solana',
          sim: '+1234567890',
          pin: '123456',
          params: { from: '+1234567890', to: '+0987654321', amount: '1000000' }
        });

        expect(mockSolanaChain.sendFunds).toHaveBeenCalledWith('+1234567890', '+0987654321', '1000000', '123456');
      });
    });

    describe('Polkadot operations', () => {
      it('should validate PIN on Solana before executing Polkadot operations', async () => {
        mockSolanaChain.validatePin.mockResolvedValue(true);
        mockPolkadotChain.initializeWallet.mockResolvedValue('polkadot-wallet-address');

        const result = await chainManager.executeOperation({
          type: 'initializeWallet',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: {}
        });

        expect(mockSolanaChain.validatePin).toHaveBeenCalledWith('+1234567890', '123456');
        expect(mockPolkadotChain.initializeWallet).toHaveBeenCalledWith('+1234567890', '123456');
        expect(result).toBe('polkadot-wallet-address');
      });

      it('should throw error if Solana PIN validation fails for Polkadot operations', async () => {
        mockSolanaChain.validatePin.mockResolvedValue(false);

        await expect(
          chainManager.executeOperation({
            type: 'sendFunds',
            targetChain: 'polkadot',
            sim: '+1234567890',
            pin: '123456',
            params: { from: '+1234567890', to: '+0987654321', amount: '1000000' }
          })
        ).rejects.toThrow('Invalid PIN - validation failed on Solana');

        expect(mockSolanaChain.validatePin).toHaveBeenCalledWith('+1234567890', '123456');
        expect(mockPolkadotChain.sendFunds).not.toHaveBeenCalled();
      });
    });

    describe('unsupported chains', () => {
      it('should throw error for unsupported chains', async () => {
        mockSolanaChain.validatePin.mockResolvedValue(true);

        await expect(
          chainManager.executeOperation({
            type: 'initializeWallet',
            targetChain: 'ethereum',
            sim: '+1234567890',
            pin: '123456',
            params: {}
          })
        ).rejects.toThrow('Unsupported chain: ethereum');
      });
    });
  });

  describe('getWalletInfo', () => {
    it('should return Solana wallet info for Solana chain', async () => {
      const mockWalletInfo = {
        address: 'solana-address',
        balance: '1000000',
        exists: true,
        alias: 'test-alias'
      };
      mockSolanaChain.getWalletInfo.mockResolvedValue(mockWalletInfo);

      const result = await chainManager.getWalletInfo('solana', '+1234567890');

      expect(mockSolanaChain.getWalletInfo).toHaveBeenCalledWith('+1234567890');
      expect(result).toEqual(mockWalletInfo);
    });

    it('should return basic info for non-Solana chains', async () => {
      mockPolkadotChain.checkBalance.mockResolvedValue('5000000');

      const result = await chainManager.getWalletInfo('polkadot', '+1234567890');

      expect(mockPolkadotChain.checkBalance).toHaveBeenCalledWith('+1234567890', '');
      expect(result).toEqual({
        address: '',
        balance: '5000000',
        exists: true
      });
    });
  });

  describe('testChainConnection', () => {
    it('should test Solana connection', async () => {
      mockSolanaChain.testConnection.mockResolvedValue(true);

      const result = await chainManager.testChainConnection('solana');

      expect(mockSolanaChain.testConnection).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false for non-Solana chains (not implemented)', async () => {
      const result = await chainManager.testChainConnection('polkadot');

      expect(result).toBe(false);
    });
  });

  describe('getSupportedChains', () => {
    it('should return list of supported chains', () => {
      const chains = chainManager.getSupportedChains();

      expect(chains).toContain('solana');
      expect(chains).toContain('polkadot');
      expect(chains).toHaveLength(2);
    });
  });

  describe('isChainAvailable', () => {
    it('should return true for available chains', () => {
      expect(chainManager.isChainAvailable('solana')).toBe(true);
      expect(chainManager.isChainAvailable('polkadot')).toBe(true);
    });

    it('should return false for unavailable chains', () => {
      expect(chainManager.isChainAvailable('ethereum')).toBe(false);
      expect(chainManager.isChainAvailable('polygon')).toBe(false);
    });
  });

  describe('getSolanaChain', () => {
    it('should return Solana chain instance', () => {
      const solanaChain = chainManager.getSolanaChain();

      expect(solanaChain).toBe(mockSolanaChain);
    });
  });
}); 