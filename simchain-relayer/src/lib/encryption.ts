import { createCipheriv, createDecipheriv, randomBytes, scryptSync, createHash } from 'crypto';

export class PhoneEncryption {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;
  private static readonly SALT_LENGTH = 64;

  /**
   * Encrypt a phone number
   * @param phoneNumber - The phone number to encrypt
   * @returns Encrypted phone number as base64 string
   */
  static encrypt(phoneNumber: string): string {
    try {
      const secretKey = process.env.ENCRYPTION_SECRET_KEY;
      if (!secretKey) {
        throw new Error('ENCRYPTION_SECRET_KEY environment variable is required');
      }

      // Generate a random salt
      const salt = randomBytes(this.SALT_LENGTH);
      
      // Derive key from secret and salt
      const key = scryptSync(secretKey, salt, this.KEY_LENGTH);
      
      // Generate random IV
      const iv = randomBytes(this.IV_LENGTH);
      
      // Create cipher
      const cipher = createCipheriv(this.ALGORITHM, key, iv);
      cipher.setAAD(salt); // Use salt as additional authenticated data
      
      // Encrypt the phone number
      let encrypted = cipher.update(phoneNumber, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Get the auth tag
      const tag = cipher.getAuthTag();
      
      // Combine salt + iv + tag + encrypted data
      const combined = Buffer.concat([salt, iv, tag, Buffer.from(encrypted, 'hex')]);
      
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt phone number');
    }
  }

  /**
   * Decrypt a phone number
   * @param encryptedPhoneNumber - The encrypted phone number as base64 string
   * @returns Decrypted phone number
   */
  static decrypt(encryptedPhoneNumber: string): string {
    try {
      const secretKey = process.env.ENCRYPTION_SECRET_KEY;
      if (!secretKey) {
        throw new Error('ENCRYPTION_SECRET_KEY environment variable is required');
      }

      // Decode from base64
      const combined = Buffer.from(encryptedPhoneNumber, 'base64');
      
      // Extract components
      const salt = combined.subarray(0, this.SALT_LENGTH);
      const iv = combined.subarray(this.SALT_LENGTH, this.SALT_LENGTH + this.IV_LENGTH);
      const tag = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH, this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(this.SALT_LENGTH + this.IV_LENGTH + this.TAG_LENGTH);
      
      // Derive key from secret and salt
      const key = scryptSync(secretKey, salt, this.KEY_LENGTH);
      
      // Create decipher
      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAAD(salt); // Use salt as additional authenticated data
      decipher.setAuthTag(tag);
      
      // Decrypt
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt phone number');
    }
  }

  /**
   * Create a hash of a phone number for lookup purposes
   * This is a one-way hash that can be used to check if a phone number exists
   * @param phoneNumber - The phone number to hash
   * @returns Hash of the phone number
   */
  static createHash(phoneNumber: string): string {
    const secretKey = process.env.ENCRYPTION_SECRET_KEY || 'default-secret';
    const hash = createHash('sha256');
    hash.update(phoneNumber + secretKey);
    return hash.digest('hex');
  }

  /**
   * Validate if a phone number is properly formatted before encryption
   * @param phoneNumber - The phone number to validate
   * @returns True if valid, false otherwise
   */
  static validatePhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // Check if it starts with + and has reasonable length
    if (!cleaned.startsWith('+')) {
      return false;
    }
    
    // Should be between 10 and 15 characters total (including +)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return false;
    }
    
    // Should contain only digits after the +
    const digitsOnly = cleaned.substring(1);
    if (!/^\d+$/.test(digitsOnly)) {
      return false;
    }
    
    return true;
  }
} 