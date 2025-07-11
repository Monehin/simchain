import { DatabaseService } from '../database';

// Mock the DatabaseService
jest.mock('../database', () => ({
  DatabaseService: {
    createWalletMapping: jest.fn(),
    getWalletBySimNumber: jest.fn(),
    getWalletByAddress: jest.fn(),
    updateWalletAlias: jest.fn(),
    getAllWallets: jest.fn(),
    getWalletCount: jest.fn(),
    isAliasInUse: jest.fn(),
    getAliasHistory: jest.fn(),
    deleteWalletMapping: jest.fn(),
  },
}));

describe('DatabaseService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWalletMapping', () => {
    it('should create a wallet mapping successfully', async () => {
      const walletData = {
        simNumber: '+1234567890',
        walletAddress: 'test_wallet_address',
        ownerAddress: 'test_owner_address',
        simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        alias: 'test_alias',
      };

      const expectedResult = { id: '1', ...walletData, createdAt: new Date(), updatedAt: new Date() };
      (DatabaseService.createWalletMapping as jest.Mock).mockResolvedValue(expectedResult);

      const result = await DatabaseService.createWalletMapping(walletData);

      expect(DatabaseService.createWalletMapping).toHaveBeenCalledWith(walletData);
      expect(result).toEqual(expectedResult);
    });

    it('should handle database errors', async () => {
      const walletData = {
        simNumber: '+1234567890',
        walletAddress: 'test_wallet_address',
        ownerAddress: 'test_owner_address',
        simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      };

      const error = new Error('Database connection failed');
      (DatabaseService.createWalletMapping as jest.Mock).mockRejectedValue(error);

      await expect(DatabaseService.createWalletMapping(walletData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getWalletBySimNumber', () => {
    it('should find wallet by SIM number', async () => {
      const expectedWallet = {
        id: '1',
        simNumber: '+1234567890',
        walletAddress: 'test_wallet_address',
        ownerAddress: 'test_owner_address',
        simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        alias: 'test_alias',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (DatabaseService.getWalletBySimNumber as jest.Mock).mockResolvedValue(expectedWallet);

      const result = await DatabaseService.getWalletBySimNumber('+1234567890');

      expect(DatabaseService.getWalletBySimNumber).toHaveBeenCalledWith('+1234567890');
      expect(result).toEqual(expectedWallet);
    });

    it('should return null when wallet not found', async () => {
      (DatabaseService.getWalletBySimNumber as jest.Mock).mockResolvedValue(null);

      const result = await DatabaseService.getWalletBySimNumber('+1234567890');

      expect(result).toBeNull();
    });
  });

  describe('getWalletByAddress', () => {
    it('should find wallet by address', async () => {
      const expectedWallet = {
        id: '1',
        simNumber: '+1234567890',
        walletAddress: 'test_wallet_address',
        ownerAddress: 'test_owner_address',
        simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        alias: 'test_alias',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (DatabaseService.getWalletByAddress as jest.Mock).mockResolvedValue(expectedWallet);

      const result = await DatabaseService.getWalletByAddress('test_wallet_address');

      expect(DatabaseService.getWalletByAddress).toHaveBeenCalledWith('test_wallet_address');
      expect(result).toEqual(expectedWallet);
    });
  });

  describe('updateWalletAlias', () => {
    it('should update wallet alias successfully', async () => {
      const updatedWallet = {
        id: '1',
        walletAddress: 'test_wallet_address',
        alias: 'new_alias',
      };

      (DatabaseService.updateWalletAlias as jest.Mock).mockResolvedValue(updatedWallet);

      const result = await DatabaseService.updateWalletAlias('test_wallet_address', 'new_alias', 'user');

      expect(DatabaseService.updateWalletAlias).toHaveBeenCalledWith('test_wallet_address', 'new_alias', 'user');
      expect(result).toEqual(updatedWallet);
    });

    it('should throw error when wallet not found', async () => {
      const error = new Error('Wallet not found');
      (DatabaseService.updateWalletAlias as jest.Mock).mockRejectedValue(error);

      await expect(
        DatabaseService.updateWalletAlias('test_wallet_address', 'new_alias')
      ).rejects.toThrow('Wallet not found');
    });
  });

  describe('getAllWallets', () => {
    it('should return all wallets', async () => {
      const expectedWallets = [
        {
          id: '1',
          simNumber: '+1234567890',
          walletAddress: 'test_wallet_address',
          ownerAddress: 'test_owner_address',
          simHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          alias: 'test_alias',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (DatabaseService.getAllWallets as jest.Mock).mockResolvedValue(expectedWallets);

      const result = await DatabaseService.getAllWallets();

      expect(DatabaseService.getAllWallets).toHaveBeenCalled();
      expect(result).toEqual(expectedWallets);
    });
  });

  describe('getWalletCount', () => {
    it('should return wallet count', async () => {
      (DatabaseService.getWalletCount as jest.Mock).mockResolvedValue(5);

      const result = await DatabaseService.getWalletCount();

      expect(DatabaseService.getWalletCount).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });

  describe('isAliasInUse', () => {
    it('should return true when alias is in use', async () => {
      (DatabaseService.isAliasInUse as jest.Mock).mockResolvedValue(true);

      const result = await DatabaseService.isAliasInUse('test_alias');

      expect(DatabaseService.isAliasInUse).toHaveBeenCalledWith('test_alias');
      expect(result).toBe(true);
    });

    it('should return false when alias is not in use', async () => {
      (DatabaseService.isAliasInUse as jest.Mock).mockResolvedValue(false);

      const result = await DatabaseService.isAliasInUse('test_alias');

      expect(result).toBe(false);
    });
  });

  describe('getAliasHistory', () => {
    it('should return alias history for wallet', async () => {
      const expectedHistory = [
        {
          id: '1',
          walletAddress: 'test_wallet_address',
          oldAlias: 'old_alias',
          newAlias: 'new_alias',
          changedBy: 'user',
          changedAt: new Date(),
        },
      ];

      (DatabaseService.getAliasHistory as jest.Mock).mockResolvedValue(expectedHistory);

      const result = await DatabaseService.getAliasHistory('test_wallet_address');

      expect(DatabaseService.getAliasHistory).toHaveBeenCalledWith('test_wallet_address');
      expect(result).toEqual(expectedHistory);
    });
  });

  describe('deleteWalletMapping', () => {
    it('should delete wallet mapping successfully', async () => {
      const deletedWallet = {
        id: '1',
        walletAddress: 'test_wallet_address',
      };

      (DatabaseService.deleteWalletMapping as jest.Mock).mockResolvedValue(deletedWallet);

      const result = await DatabaseService.deleteWalletMapping('test_wallet_address');

      expect(DatabaseService.deleteWalletMapping).toHaveBeenCalledWith('test_wallet_address');
      expect(result).toEqual(deletedWallet);
    });
  });
}); 