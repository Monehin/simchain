import { PhoneValidator, PinValidator, AliasValidator } from '../validation';

describe('PhoneValidator', () => {
  describe('normalizePhoneNumber', () => {
    it('should normalize valid phone numbers', () => {
      expect(PhoneValidator.normalizePhoneNumber('+1234567890')).toBe('+1234567890');
      expect(PhoneValidator.normalizePhoneNumber('1234567890')).toBe('+1234567890');
      expect(PhoneValidator.normalizePhoneNumber('+1-234-567-8900')).toBe('+12345678900');
      expect(PhoneValidator.normalizePhoneNumber('(123) 456-7890')).toBe('+1234567890');
    });

    it('should handle international numbers', () => {
      expect(PhoneValidator.normalizePhoneNumber('+44 20 7946 0958')).toBe('+442079460958');
      expect(PhoneValidator.normalizePhoneNumber('+234 801 234 5678')).toBe('+2348012345678');
    });

    it('should throw error for invalid numbers', () => {
      expect(() => PhoneValidator.normalizePhoneNumber('invalid')).toThrow('Invalid phone number format');
      expect(() => PhoneValidator.normalizePhoneNumber('123')).toThrow('Invalid phone number format');
      expect(() => PhoneValidator.normalizePhoneNumber('12345678901234567890')).toThrow('Invalid phone number format');
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(PhoneValidator.validatePhoneNumber('+1234567890')).toBe(true);
      expect(PhoneValidator.validatePhoneNumber('+2348012345678')).toBe(true);
      expect(PhoneValidator.validatePhoneNumber('+442079460958')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(PhoneValidator.validatePhoneNumber('invalid')).toBe(false);
      expect(PhoneValidator.validatePhoneNumber('123')).toBe(false);
      expect(PhoneValidator.validatePhoneNumber('')).toBe(false);
    });
  });
});

describe('PinValidator', () => {
  describe('validatePin', () => {
    it('should validate correct 6-digit PINs', () => {
      expect(PinValidator.validatePin('123456')).toBe(true);
      expect(PinValidator.validatePin('000000')).toBe(true);
      expect(PinValidator.validatePin('999999')).toBe(true);
    });

    it('should reject invalid PINs', () => {
      expect(PinValidator.validatePin('12345')).toBe(false); // too short
      expect(PinValidator.validatePin('1234567')).toBe(false); // too long
      expect(PinValidator.validatePin('12345a')).toBe(false); // non-numeric
      expect(PinValidator.validatePin('')).toBe(false); // empty
      expect(PinValidator.validatePin('abc123')).toBe(false); // mixed
    });
  });

  describe('hashPin', () => {
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
  });
});

describe('AliasValidator', () => {
  describe('validateAlias', () => {
    it('should validate correct aliases', () => {
      expect(AliasValidator.validateAlias('john')).toBe(true);
      expect(AliasValidator.validateAlias('john_doe')).toBe(true);
      expect(AliasValidator.validateAlias('john-doe')).toBe(true);
      expect(AliasValidator.validateAlias('john123')).toBe(true);
      expect(AliasValidator.validateAlias('ab')).toBe(true); // minimum length
      expect(AliasValidator.validateAlias('abcdefghijkl')).toBe(true); // maximum length
    });

    it('should reject invalid aliases', () => {
      expect(AliasValidator.validateAlias('a')).toBe(false); // too short
      expect(AliasValidator.validateAlias('abcdefghijklm')).toBe(false); // too long
      expect(AliasValidator.validateAlias('john@doe')).toBe(false); // invalid character
      expect(AliasValidator.validateAlias('john doe')).toBe(false); // space
      expect(AliasValidator.validateAlias('')).toBe(false); // empty
      expect(AliasValidator.validateAlias('123')).toBe(false); // starts with number
    });
  });

  describe('normalizeAlias', () => {
    it('should normalize aliases correctly', () => {
      expect(AliasValidator.normalizeAlias('JohnDoe')).toBe('johndoe');
      expect(AliasValidator.normalizeAlias('JOHN_DOE')).toBe('john_doe');
      expect(AliasValidator.normalizeAlias('John-Doe')).toBe('john-doe');
    });
  });
}); 