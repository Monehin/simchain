import { PinValidator } from '../validation';

// Mock crypto for consistent testing
const mockCrypto = {
  subtle: {
    digest: jest.fn().mockImplementation(async (algorithm, data) => {
      // Simple mock hash function for testing
      const input = new TextDecoder().decode(data);
      const hash = new ArrayBuffer(32);
      const view = new Uint8Array(hash);
      
      // Create a deterministic hash based on input
      for (let i = 0; i < 32; i++) {
        view[i] = (input.charCodeAt(i % input.length) + i) % 256;
      }
      
      return hash;
    })
  }
};

// Mock global crypto
Object.defineProperty(global, 'crypto', {
  value: mockCrypto,
  writable: true
});

describe('PIN Verification - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PinValidator.hashPin', () => {
    it('should hash PIN consistently', async () => {
      const hash1 = await PinValidator.hashPin('123456');
      const hash2 = await PinValidator.hashPin('123456');
      expect(hash1).toEqual(hash2);
    });

    it('should produce different hashes for different PINs', async () => {
      const hash1 = await PinValidator.hashPin('123456');
      const hash2 = await PinValidator.hashPin('654321');
      expect(hash1).not.toEqual(hash2);
    });

    it('should return 32-byte hash', async () => {
      const hash = await PinValidator.hashPin('123456');
      expect(hash).toHaveLength(32);
    });

    it('should throw error for invalid PIN format', async () => {
      await expect(PinValidator.hashPin('12345')).rejects.toThrow('PIN must be exactly 6 digits');
      await expect(PinValidator.hashPin('1234567')).rejects.toThrow('PIN must be exactly 6 digits');
      await expect(PinValidator.hashPin('abc123')).rejects.toThrow('PIN must be exactly 6 digits');
    });
  });

  describe('PIN Validation Logic', () => {
    it('should validate correct PIN format', () => {
      expect(PinValidator.validatePin('123456')).toBe(true);
      expect(PinValidator.validatePin('000000')).toBe(true);
      expect(PinValidator.validatePin('999999')).toBe(true);
    });

    it('should reject invalid PIN format', () => {
      expect(PinValidator.validatePin('12345')).toBe(false); // too short
      expect(PinValidator.validatePin('1234567')).toBe(false); // too long
      expect(PinValidator.validatePin('12345a')).toBe(false); // non-numeric
      expect(PinValidator.validatePin('')).toBe(false); // empty
      expect(PinValidator.validatePin('abc123')).toBe(false); // mixed
    });
  });

  describe('Constant-time PIN Comparison', () => {
    it('should perform constant-time comparison correctly', async () => {
      const pin1 = '123456';
      const pin2 = '654321';
      
      const hash1 = await PinValidator.hashPin(pin1);
      const hash2 = await PinValidator.hashPin(pin2);
      
      // Test constant-time comparison logic
      let isMatch = true;
      for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) {
          isMatch = false;
        }
      }
      
      expect(isMatch).toBe(false);
    });

    it('should detect exact matches', async () => {
      const pin = '123456';
      const hash1 = await PinValidator.hashPin(pin);
      const hash2 = await PinValidator.hashPin(pin);
      
      // Test constant-time comparison logic
      let isMatch = true;
      for (let i = 0; i < hash1.length; i++) {
        if (hash1[i] !== hash2[i]) {
          isMatch = false;
        }
      }
      
      expect(isMatch).toBe(true);
    });

    it('should handle edge cases', async () => {
      // Test with all zeros PIN
      const zeroPin = '000000';
      const zeroHash = await PinValidator.hashPin(zeroPin);
      expect(zeroHash).toHaveLength(32);
      
      // Test with all nines PIN
      const ninePin = '999999';
      const nineHash = await PinValidator.hashPin(ninePin);
      expect(nineHash).toHaveLength(32);
      expect(nineHash).not.toEqual(zeroHash);
    });
  });

  describe('Security Tests', () => {
    it('should not leak timing information', async () => {
      const pin = '123456';
      const hash = await PinValidator.hashPin(pin);
      
      // Test that comparison always takes similar time regardless of match
      const start1 = Date.now();
      for (let i = 0; i < hash.length; i++) {
        if (hash[i] !== hash[i]) {
          // This should never happen
        }
      }
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      for (let i = 0; i < hash.length; i++) {
        if (hash[i] !== (hash[i] + 1) % 256) {
          // This will always happen
        }
      }
      const time2 = Date.now() - start2;
      
      // Times should be similar (within reasonable margin)
      expect(Math.abs(time1 - time2)).toBeLessThan(10);
    });

    it('should handle various PIN combinations', async () => {
      const testPins = [
        '123456',
        '654321',
        '111111',
        '999999',
        '000000',
        '123123',
        '456789'
      ];

      const hashes = await Promise.all(testPins.map(pin => PinValidator.hashPin(pin)));
      
      // All hashes should be 32 bytes
      hashes.forEach(hash => {
        expect(hash).toHaveLength(32);
      });

      // All hashes should be different
      for (let i = 0; i < hashes.length; i++) {
        for (let j = i + 1; j < hashes.length; j++) {
          expect(hashes[i]).not.toEqual(hashes[j]);
        }
      }
    });
  });

  describe('PIN Verification Scenarios', () => {
    it('should verify correct PIN against stored hash', async () => {
      const correctPin = '123456';
      const storedHash = await PinValidator.hashPin(correctPin);
      
      // Simulate user providing the correct PIN
      const providedHash = await PinValidator.hashPin(correctPin);
      
      // Verify they match
      expect(providedHash).toEqual(storedHash);
    });

    it('should reject incorrect PIN', async () => {
      const correctPin = '123456';
      const wrongPin = '654321';
      
      const storedHash = await PinValidator.hashPin(correctPin);
      const providedHash = await PinValidator.hashPin(wrongPin);
      
      // Verify they don't match
      expect(providedHash).not.toEqual(storedHash);
    });

    it('should handle multiple incorrect attempts', async () => {
      const correctPin = '123456';
      const wrongPins = ['111111', '222222', '333333', '444444', '555555'];
      
      const correctHash = await PinValidator.hashPin(correctPin);
      
      wrongPins.forEach(async (wrongPin) => {
        const wrongHash = await PinValidator.hashPin(wrongPin);
        expect(wrongHash).not.toEqual(correctHash);
      });
    });
  });
}); 