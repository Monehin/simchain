import { NextRequest } from 'next/server';

// Mock the ChainManager module before importing the route
jest.mock('../../../lib/chains/chain-manager', () => {
  const mockChainManager = {
    executeOperation: jest.fn(),
    getWalletInfo: jest.fn(),
    testChainConnection: jest.fn(),
    crossChainTransfer: jest.fn(),
    getSupportedChains: jest.fn(),
    isChainAvailable: jest.fn(),
    getSolanaChain: jest.fn(),
  };
  
  return {
    ChainManager: jest.fn().mockImplementation(() => mockChainManager),
    __mockChainManager: mockChainManager,
  };
});

// Import after mocking
import { POST } from '../relay/route';

const { __mockChainManager: mockChainManager } = jest.requireMock('../../../lib/chains/chain-manager');

describe('Relay API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: Record<string, unknown>): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
    } as unknown as NextRequest;
  };

  describe('POST /api/relay', () => {
    describe('wallet-info', () => {
      it('should get wallet info for Solana chain', async () => {
        const mockWalletInfo = {
          address: 'solana-address',
          balance: '1000000',
          exists: true,
          alias: 'test-alias'
        };
        mockChainManager.getWalletInfo.mockResolvedValue(mockWalletInfo);

        const request = createRequest({
          action: 'wallet-info',
          chain: 'solana',
          sim: '+1234567890'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.getWalletInfo).toHaveBeenCalledWith('solana', '+1234567890');
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockWalletInfo);
      });

      it('should get wallet info for Polkadot chain', async () => {
        const mockWalletInfo = {
          address: 'polkadot-address',
          balance: '5000000',
          exists: true,
          alias: 'test-alias'
        };
        mockChainManager.getWalletInfo.mockResolvedValue(mockWalletInfo);

        const request = createRequest({
          action: 'wallet-info',
          chain: 'polkadot',
          sim: '+1234567890'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.getWalletInfo).toHaveBeenCalledWith('polkadot', '+1234567890');
        expect(data.success).toBe(true);
        expect(data.data).toEqual(mockWalletInfo);
      });

      it('should default to Solana if no chain specified', async () => {
        const mockWalletInfo = {
          address: 'solana-address',
          balance: '1000000',
          exists: true,
          alias: 'test-alias'
        };
        mockChainManager.getWalletInfo.mockResolvedValue(mockWalletInfo);

        const request = createRequest({
          action: 'wallet-info',
          sim: '+1234567890'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.getWalletInfo).toHaveBeenCalledWith('solana', '+1234567890');
        expect(data.success).toBe(true);
      });
    });

    describe('wallet-balance', () => {
      it('should check balance for specified chain', async () => {
        mockChainManager.executeOperation.mockResolvedValue('1000000');

        const request = createRequest({
          action: 'wallet-balance',
          chain: 'polkadot',
          sim: '+1234567890'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'checkBalance',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '',
          params: {}
        });
        expect(data.success).toBe(true);
        expect(data.data.balance).toBe('1000000');
      });
    });

    describe('health-check', () => {
      it('should test connection for specified chain', async () => {
        mockChainManager.testChainConnection.mockResolvedValue(true);

        const request = createRequest({
          action: 'health-check',
          chain: 'polkadot'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.testChainConnection).toHaveBeenCalledWith('polkadot');
        expect(data.success).toBe(true);
        expect(data.data.connected).toBe(true);
        expect(data.data.chain).toBe('polkadot');
      });
    });

    describe('initialize-wallet', () => {
      it('should initialize wallet on specified chain', async () => {
        mockChainManager.executeOperation.mockResolvedValue('wallet-address');

        const request = createRequest({
          action: 'initialize-wallet',
          chain: 'polkadot',
          sim: '+1234567890',
          pin: '123456'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'initializeWallet',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: {}
        });
        expect(data.success).toBe(true);
        expect(data.data.signature).toBe('wallet-address');
      });
    });

    describe('verify-pin', () => {
      it('should verify PIN on specified chain', async () => {
        mockChainManager.executeOperation.mockResolvedValue(true);

        const request = createRequest({
          action: 'verify-pin',
          chain: 'polkadot',
          sim: '+1234567890',
          pin: '123456'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'validatePin',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: {}
        });
        expect(data.success).toBe(true);
        expect(data.data.isValid).toBe(true);
      });
    });

    describe('set-alias', () => {
      it('should set alias on specified chain', async () => {
        mockChainManager.executeOperation.mockResolvedValue(true);

        const request = createRequest({
          action: 'set-alias',
          chain: 'polkadot',
          sim: '+1234567890',
          alias: 'test-alias',
          pin: '123456'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'setAlias',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: { alias: 'test-alias' }
        });
        expect(data.success).toBe(true);
        expect(data.data.result).toBe(true);
      });
    });

    describe('send-funds', () => {
      it('should send funds on specified chain', async () => {
        const mockTransaction = {
          hash: 'tx-hash',
          from: '+1234567890',
          to: '+0987654321',
          amount: '1000000',
          status: 'confirmed' as const
        };
        mockChainManager.executeOperation.mockResolvedValue(mockTransaction);

        const request = createRequest({
          action: 'send-funds',
          chain: 'polkadot',
          fromSim: '+1234567890',
          toSim: '+0987654321',
          amount: 1000000,
          pin: '123456'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'sendFunds',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: { from: '+1234567890', to: '+0987654321', amount: '1000000' }
        });
        expect(data.success).toBe(true);
        expect(data.data.tx).toEqual(mockTransaction);
      });
    });

    describe('deposit-funds', () => {
      it('should deposit funds on specified chain', async () => {
        const mockTransaction = {
          hash: 'tx-hash',
          from: 'relayer',
          to: '+1234567890',
          amount: '1000000',
          status: 'confirmed' as const
        };
        mockChainManager.executeOperation.mockResolvedValue(mockTransaction);

        const request = createRequest({
          action: 'deposit-funds',
          chain: 'polkadot',
          sim: '+1234567890',
          amount: 1000000,
          pin: '123456'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(mockChainManager.executeOperation).toHaveBeenCalledWith({
          type: 'sendFunds',
          targetChain: 'polkadot',
          sim: '+1234567890',
          pin: '123456',
          params: { from: 'relayer', to: '+1234567890', amount: '1000000' }
        });
        expect(data.success).toBe(true);
        expect(data.data.tx).toEqual(mockTransaction);
      });
    });

    describe('error handling', () => {
      it('should handle unknown action', async () => {
        const request = createRequest({
          action: 'unknown-action',
          chain: 'solana'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Unknown action: unknown-action');
      });

      it('should handle ChainManager errors', async () => {
        mockChainManager.executeOperation.mockRejectedValue(new Error('Chain error'));

        const request = createRequest({
          action: 'wallet-balance',
          chain: 'polkadot',
          sim: '+1234567890'
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.success).toBe(false);
        expect(data.error).toBe('Chain error');
      });
    });
  });
}); 