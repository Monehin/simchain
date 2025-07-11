export class PhoneValidator {
  static normalizePhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let normalized = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    // Basic validation
    if (normalized.length < 8 || normalized.length > 15) {
      throw new Error('Invalid phone number format');
    }
    
    return normalized;
  }

  static validatePhoneNumber(phone: string): boolean {
    try {
      this.normalizePhoneNumber(phone);
      return true;
    } catch {
      return false;
    }
  }
}

export class PinValidator {
  static validatePin(pin: string): boolean {
    // Must be exactly 6 digits
    return /^\d{6}$/.test(pin);
  }

  static async hashPin(pin: string): Promise<Uint8Array> {
    if (!this.validatePin(pin)) {
      throw new Error('PIN must be exactly 6 digits');
    }

    // Use crypto.subtle.digest for SHA-256 hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return new Uint8Array(hashBuffer);
  }
}

export class AliasValidator {
  static validateAlias(alias: string): boolean {
    // Must be 2-12 characters, alphanumeric, underscore, hyphen only
    // Cannot start with a number
    return /^[a-zA-Z_][a-zA-Z0-9_-]{1,11}$/.test(alias);
  }

  static normalizeAlias(alias: string): string {
    // Convert to lowercase
    return alias.toLowerCase();
  }
} 