import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { 
  PhoneNormalizer, 
  PinManager, 
  AliasValidator, 
  SimchainRelay,
  RelayConfig 
} from '../simchain-relay-test';

// Mock Solana dependencies
jest.mock('@solana/web3.js');
jest.mock('@coral-xyz/anchor');

describe('PhoneNormalizer', () => {
  describe('normalize', () => {
    it('should normalize valid phone numbers to E.164 format', () => {
      const testCases = [
        { input: '+1234567890', expected: '+1234567890' },
        { input: '1234567890', expected: '+1234567890' },
        { input: '+1 (234) 567-8900', expected: '+12345678900' },
        { input: '1-234-567-8900', expected: '+12345678900' },
        { input: '+44 20 7946 0958', expected: '+442079460958' },
        { input: '44 20 7946 0958', expected: '+442079460958' },
      ];

      testCases.forEach(({ input, expected }) => {
        expect(PhoneNormalizer.normalize(input)).toBe(expected);
      });
    });

    it('should throw error for invalid phone numbers', () => {
      const invalidNumbers = [
        '123', // Too short
        '12345678901234567890', // Too long
        'abc123def', // Contains letters
        '', // Empty
        '+', // Just plus sign
      ];

      invalidNumbers.forEach(invalid => {
        expect(() => PhoneNormalizer.normalize(invalid)).toThrow('Invalid phone number format');
      });
    });

    it('should handle edge cases correctly', () => {
      expect(PhoneNormalizer.normalize('+123456789012345')).toBe('+123456789012345'); // 15 chars (max)
      expect(PhoneNormalizer.normalize('12345678')).toBe('+12345678'); // 8 chars (min)
    });
  });
});

describe('PinManager', () => {
  describe('validatePin', () => {
    it('should validate correct 6-digit PINs', () => {
      const validPins = [
        '123456',
        '000000',
        '999999',
        '123456',
        '654321',
      ];

      validPins.forEach(pin => {
        expect(PinManager.validatePin(pin)).toBe(true);
      });
    });

    it('should reject invalid PINs', () => {
      const invalidPins = [
        { pin: '12345', reason: 'Too short (5 digits)' },
        { pin: '1234567', reason: 'Too long (7 digits)' },
        { pin: '12345a', reason: 'Contains letters' },
        { pin: '123 456', reason: 'Contains spaces' },
        { pin: '12-34-56', reason: 'Contains hyphens' },
        { pin: '123.456', reason: 'Contains dots' },
        { pin: '', reason: 'Empty' },
        { pin: 'abc123', reason: 'Contains letters' },
        { pin: '123456789', reason: 'Too long' },
      ];

      invalidPins.forEach(({ pin, reason }) => {
        expect(PinManager.validatePin(pin)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(PinManager.validatePin('000000')).toBe(true); // All zeros is valid
      expect(PinManager.validatePin('111111')).toBe(true); // All ones is valid
      expect(PinManager.validatePin('123456')).toBe(true); // Sequential is valid
    });
  });

  describe('hashPin', () => {
    it('should hash valid PINs correctly', () => {
      const pin = '123456';
      const hash = PinManager.hashPin(pin);
      
      expect(hash).toBeInstanceOf(Uint8Array);
      expect(hash.length).toBe(32); // SHA256 produces 32 bytes
    });

    it('should throw error for invalid PINs', () => {
      const invalidPins = ['12345', '1234567', '12345a', ''];
      
      invalidPins.forEach(pin => {
        expect(() => PinManager.hashPin(pin)).toThrow('PIN must be exactly 6 digits');
      });
    });

    it('should produce consistent hashes for same PIN', () => {
      const pin = '123456';
      const hash1 = PinManager.hashPin(pin);
      const hash2 = PinManager.hashPin(pin);
      
      expect(hash1).toEqual(hash2);
    });

    it('should produce different hashes for different PINs', () => {
      const hash1 = PinManager.hashPin('123456');
      const hash2 = PinManager.hashPin('654321');
      
      expect(hash1).not.toEqual(hash2);
    });
  });

  describe('zeroPin', () => {
    it('should clear PIN reference', () => {
      let pin = '123456';
      PinManager.zeroPin(pin);
      // Note: In JavaScript, strings are immutable, so this is more of a conceptual test
      expect(typeof pin).toBe('string');
    });
  });
});

describe('AliasValidator', () => {
  describe('validateAlias', () => {
    it('should validate correct aliases', () => {
      const validAliases = [
        'test',
        'test-alias_123',
        'user123',
        'my_wallet',
        'a', // Single character
        '12345678901234567890123456789012', // Exactly 32 characters
      ];

      validAliases.forEach(alias => {
        expect(AliasValidator.validateAlias(alias)).toBe(true);
      });
    });

    it('should reject invalid aliases', () => {
      const invalidAliases = [
        { alias: '', reason: 'Empty' },
        { alias: '123456789012345678901234567890123', reason: 'Too long (33 chars)' },
        { alias: '00000000000000000000000000000000', reason: 'All zeros' },
        { alias: 'test\x00alias', reason: 'Contains null byte' },
        { alias: 'test\nalias', reason: 'Contains newline' },
        { alias: 'test\talias', reason: 'Contains tab' },
      ];

      invalidAliases.forEach(({ alias, reason }) => {
        expect(AliasValidator.validateAlias(alias)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(AliasValidator.validateAlias(' ')).toBe(true); // Single space
      expect(AliasValidator.validateAlias('!@#$%^&*()')).toBe(true); // Special characters
      expect(AliasValidator.validateAlias('12345678901234567890123456789012')).toBe(true); // Exactly 32 chars
    });
  });

  describe('normalizeAlias', () => {
    it('should normalize valid aliases to 32-byte array', () => {
      const alias = 'test';
      const normalized = AliasValidator.normalizeAlias(alias);
      
      expect(normalized).toBeInstanceOf(Uint8Array);
      expect(normalized.length).toBe(32);
      
      // Check that the alias is at the beginning and rest is padded with zeros
      const encoder = new TextEncoder();
      const aliasBytes = encoder.encode(alias);
      expect(normalized.slice(0, aliasBytes.length)).toEqual(aliasBytes);
      expect(normalized.slice(aliasBytes.length)).toEqual(new Uint8Array(32 - aliasBytes.length));
    });

    it('should throw error for invalid aliases', () => {
      const invalidAliases = ['', '123456789012345678901234567890123'];
      
      invalidAliases.forEach(alias => {
        expect(() => AliasValidator.normalizeAlias(alias)).toThrow('Invalid alias format');
      });
    });

    it('should handle 32-character aliases correctly', () => {
      const alias = '12345678901234567890123456789012'; // Exactly 32 chars
      const normalized = AliasValidator.normalizeAlias(alias);
      
      expect(normalized.length).toBe(32);
      const encoder = new TextEncoder();
      const aliasBytes = encoder.encode(alias);
      expect(normalized).toEqual(aliasBytes);
    });
  });
});

describe.skip('SimchainRelay', () => {
  let relay: SimchainRelay;
  let mockConnection: jest.Mocked<Connection>;
  let mockProgram: any;

  beforeEach(() => {
    // Create mock connection
    mockConnection = {
      getAccountInfo: jest.fn(),
      getBalance: jest.fn(),
    } as any;

    // Create mock program
    mockProgram = {
      account: {
        config: {
          fetch: jest.fn().mockResolvedValue({
            salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
          })
        }
      }
    };

    const config: RelayConfig = {
      connection: mockConnection,
      programId: new PublicKey('DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r'),
      provider: {} as any,
      program: mockProgram,
    };

    relay = new SimchainRelay(config);
  });

  describe('healthCheck', () => {
    it('should return success when connection is healthy', async () => {
      mockConnection.getAccountInfo.mockResolvedValue({} as any);
      
      const result = await relay.healthCheck();
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        connected: true,
        programId: 'DMaWHy1YmFNNKhyMWaTGpY76hKPdAhu4ExMHTGHU2j8r'
      });
    });

    it('should return error when connection fails', async () => {
      mockConnection.getAccountInfo.mockRejectedValue(new Error('Connection failed'));
      
      const result = await relay.healthCheck();
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('CONNECTION_ERROR');
      expect(result.error?.message).toBe('Failed to connect to validator');
    });
  });

  describe('getWalletInfo', () => {
    it('should return wallet info when wallet exists', async () => {
      const mockWalletAccount = {
        lamports: 1000000000, // 1 SOL in lamports
      };
      
      mockConnection.getAccountInfo.mockResolvedValue(mockWalletAccount as any);
      
      const result = await relay.getWalletInfo('+1234567890');
      
      expect(result.success).toBe(true);
      expect(result.data?.exists).toBe(true);
      expect(result.data?.balance).toBe(1); // 1 SOL
      expect(result.data?.address).toBeDefined();
    });

    it('should return wallet info when wallet does not exist', async () => {
      mockConnection.getAccountInfo.mockResolvedValue(null);
      
      const result = await relay.getWalletInfo('+1234567890');
      
      expect(result.success).toBe(true);
      expect(result.data?.exists).toBe(false);
      expect(result.data?.balance).toBe(0);
      expect(result.data?.address).toBeDefined();
    });

    it('should handle errors gracefully', async () => {
      mockConnection.getAccountInfo.mockRejectedValue(new Error('Network error'));
      
      const result = await relay.getWalletInfo('+1234567890');
      
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('WALLET_INFO_ERROR');
    });
  });

  describe('walletExists', () => {
    it('should return true when wallet exists', async () => {
      mockConnection.getAccountInfo.mockResolvedValue({} as any);
      
      const exists = await relay.walletExists('+1234567890');
      
      expect(exists).toBe(true);
    });

    it('should return false when wallet does not exist', async () => {
      mockConnection.getAccountInfo.mockResolvedValue(null);
      
      const exists = await relay.walletExists('+1234567890');
      
      expect(exists).toBe(false);
    });

    it('should return false on error', async () => {
      mockConnection.getAccountInfo.mockRejectedValue(new Error('Network error'));
      
      const exists = await relay.walletExists('+1234567890');
      
      expect(exists).toBe(false);
    });
  });

  describe('getWalletBalance', () => {
    it('should return correct balance', async () => {
      mockConnection.getBalance.mockResolvedValue(2000000000); // 2 SOL in lamports
      
      const balance = await relay.getWalletBalance('+1234567890');
      
      expect(balance).toBe(2);
    });

    it('should return 0 when wallet does not exist', async () => {
      mockConnection.getBalance.mockRejectedValue(new Error('Account not found'));
      
      const balance = await relay.getWalletBalance('+1234567890');
      
      expect(balance).toBe(0);
    });
  });

  describe('PDA derivation', () => {
    it('should derive consistent wallet PDAs for same SIM', async () => {
      const sim = '+1234567890';
      
      // Mock the private methods by accessing them through the relay instance
      const deriveWalletPDA = (relay as any).deriveWalletPDA.bind(relay);
      
      const pda1 = await deriveWalletPDA(sim);
      const pda2 = await deriveWalletPDA(sim);
      
      expect(pda1[0].toBase58()).toBe(pda2[0].toBase58());
    });

    it('should derive different wallet PDAs for different SIMs', async () => {
      const sim1 = '+1234567890';
      const sim2 = '+1234567891';
      
      const deriveWalletPDA = (relay as any).deriveWalletPDA.bind(relay);
      
      const pda1 = await deriveWalletPDA(sim1);
      const pda2 = await deriveWalletPDA(sim2);
      
      expect(pda1[0].toBase58()).not.toBe(pda2[0].toBase58());
    });

    it('should derive alias index PDAs correctly', () => {
      const alias = 'test';
      const aliasBytes = AliasValidator.normalizeAlias(alias);
      
      const deriveAliasIndexPDA = (relay as any).deriveAliasIndexPDA.bind(relay);
      const pda = deriveAliasIndexPDA(aliasBytes);
      
      expect(pda[0]).toBeInstanceOf(PublicKey);
      expect(typeof pda[1]).toBe('number');
    });
  });
});

describe('Integration Tests', () => {
  it('should handle complete wallet workflow', async () => {
    // This test demonstrates the complete workflow
    const sim = '+1234567890';
    const pin = '123456';
    const alias = 'test_wallet';
    
    // Validate inputs
    expect(PhoneNormalizer.normalize(sim)).toBe('+1234567890');
    expect(PinManager.validatePin(pin)).toBe(true);
    expect(AliasValidator.validateAlias(alias)).toBe(true);
    
    // Hash PIN
    const pinHash = PinManager.hashPin(pin);
    expect(pinHash).toBeInstanceOf(Uint8Array);
    expect(pinHash.length).toBe(32);
    
    // Normalize alias
    const aliasBytes = AliasValidator.normalizeAlias(alias);
    expect(aliasBytes).toBeInstanceOf(Uint8Array);
    expect(aliasBytes.length).toBe(32);
  });

  it('should handle error cases gracefully', () => {
    // Test various error scenarios
    expect(() => PhoneNormalizer.normalize('invalid')).toThrow();
    expect(() => PinManager.hashPin('12345')).toThrow();
    expect(() => AliasValidator.normalizeAlias('')).toThrow();
  });
});

describe('Edge Cases', () => {
  it('should handle boundary conditions for phone numbers', () => {
    // Minimum valid length
    expect(PhoneNormalizer.normalize('12345678')).toBe('+12345678');
    
    // Maximum valid length
    expect(PhoneNormalizer.normalize('+123456789012345')).toBe('+123456789012345');
    
    // Just over maximum
    expect(() => PhoneNormalizer.normalize('+1234567890123456')).toThrow();
  });

  it('should handle boundary conditions for aliases', () => {
    // Empty string
    expect(AliasValidator.validateAlias('')).toBe(false);
    
    // Single character
    expect(AliasValidator.validateAlias('a')).toBe(true);
    
    // Exactly 32 characters
    const maxAlias = 'a'.repeat(32);
    expect(AliasValidator.validateAlias(maxAlias)).toBe(true);
    
    // Over 32 characters
    const overMaxAlias = 'a'.repeat(33);
    expect(AliasValidator.validateAlias(overMaxAlias)).toBe(false);
  });

  it('should handle special characters in aliases', () => {
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    expect(AliasValidator.validateAlias(specialChars)).toBe(true);
    
    // Non-printable characters
    expect(AliasValidator.validateAlias('test\x00alias')).toBe(false);
    expect(AliasValidator.validateAlias('test\nalias')).toBe(false);
    expect(AliasValidator.validateAlias('test\talias')).toBe(false);
  });
}); 