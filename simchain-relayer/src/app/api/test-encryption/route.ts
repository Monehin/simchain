import { NextRequest, NextResponse } from 'next/server';
import { PhoneEncryption } from '../../../lib/encryption';
import { WalletDatabase } from '../../../lib/database';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Test encryption
    const encrypted = PhoneEncryption.encrypt(phoneNumber);
    const decrypted = PhoneEncryption.decrypt(encrypted);
    const hash = PhoneEncryption.createHash(phoneNumber);
    const isValid = PhoneEncryption.validatePhoneNumber(phoneNumber);

    // Test database operations
    let dbTest = 'Database not configured';
    try {
      const stats = await WalletDatabase.getWalletStats();
      dbTest = `Database connected. Stats: ${JSON.stringify(stats)}`;
    } catch (error) {
      dbTest = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      data: {
        original: phoneNumber,
        encrypted,
        decrypted,
        hash,
        isValid,
        encryptionWorking: phoneNumber === decrypted,
        dbTest
      }
    });
    
  } catch (error: unknown) {
    console.error('Encryption test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Test with a sample phone number
    const testPhone = '+1234567890';
    
    const encrypted = PhoneEncryption.encrypt(testPhone);
    const decrypted = PhoneEncryption.decrypt(encrypted);
    const hash = PhoneEncryption.createHash(testPhone);
    const isValid = PhoneEncryption.validatePhoneNumber(testPhone);

    return NextResponse.json({
      success: true,
      data: {
        testPhone,
        encrypted,
        decrypted,
        hash,
        isValid,
        encryptionWorking: testPhone === decrypted,
        message: 'Encryption test completed successfully'
      }
    });
    
  } catch (error: unknown) {
    console.error('Encryption test failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 