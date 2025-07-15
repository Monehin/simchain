import { prisma } from './database';
import { 
  uniqueNamesGenerator, 
  adjectives, 
  colors, 
  animals, 
  names,
  Config
} from 'unique-names-generator';

export class AliasGenerator {
  // Custom word lists for more variety and branding
  private static readonly CUSTOM_ADJECTIVES = [
    'Swift', 'Bright', 'Calm', 'Bold', 'Wise', 'Quick', 'Smart', 'Brave',
    'Happy', 'Lucky', 'Cool', 'Fast', 'Sharp', 'Wild', 'Free', 'Pure',
    'Fresh', 'Clear', 'Safe', 'Warm', 'Soft', 'Hard', 'Rich', 'Kind',
    'Mighty', 'Noble', 'Royal', 'Golden', 'Silver', 'Crystal', 'Diamond'
  ];

  private static readonly CUSTOM_NOUNS = [
    'Eagle', 'Lion', 'Wolf', 'Bear', 'Tiger', 'Fox', 'Hawk', 'Dove',
    'Star', 'Moon', 'Sun', 'Ocean', 'River', 'Mountain', 'Forest', 'Desert',
    'Diamond', 'Gold', 'Silver', 'Crystal', 'Pearl', 'Ruby', 'Emerald', 'Sapphire',
    'Phoenix', 'Dragon', 'Unicorn', 'Griffin', 'Pegasus', 'Centaur', 'Mermaid', 'Fairy',
    'Knight', 'Wizard', 'Warrior', 'Mage', 'Archer', 'Guardian', 'Protector'
  ];

  /**
   * Generate a unique alias using the library
   */
  static async generateUniqueAlias(): Promise<string> {
    let attempts = 0;
    const maxAttempts = 50;

    while (attempts < maxAttempts) {
      const alias = this.generateAlias();
      
      // Check if alias already exists
      const existing = await prisma.encryptedWallet.findFirst({
        where: { currentAlias: alias }
      });

      if (!existing) {
        return alias;
      }

      attempts++;
    }

    // If we can't find a unique alias, add a random number
    return this.generateAlias() + Math.floor(Math.random() * 1000);
  }

  /**
   * Generate a random alias using different patterns
   */
  private static generateAlias(): string {
    const pattern = Math.floor(Math.random() * 5); // 5 different patterns

    switch (pattern) {
      case 0:
        // Custom Adjective + Custom Noun (e.g., "SwiftEagle")
        return this.getRandomItem(this.CUSTOM_ADJECTIVES) + this.getRandomItem(this.CUSTOM_NOUNS);
      
      case 1:
        // Library Adjective + Library Animal (e.g., "BraveLion")
        return uniqueNamesGenerator({
          dictionaries: [adjectives, animals],
          separator: '',
          style: 'capital',
          length: 2
        });
      
      case 2:
        // Library Color + Library Animal (e.g., "BlueWolf")
        return uniqueNamesGenerator({
          dictionaries: [colors, animals],
          separator: '',
          style: 'capital',
          length: 2
        });
      
      case 3:
        // Library Name + Number (e.g., "John123")
        return uniqueNamesGenerator({
          dictionaries: [names],
          separator: '',
          style: 'capital',
          length: 1
        }) + Math.floor(Math.random() * 999 + 1);
      
      case 4:
        // Custom Adjective + Library Animal (e.g., "MightyBear")
        return this.getRandomItem(this.CUSTOM_ADJECTIVES) + uniqueNamesGenerator({
          dictionaries: [animals],
          separator: '',
          style: 'capital',
          length: 1
        });
      
      default:
        return this.getRandomItem(this.CUSTOM_ADJECTIVES) + this.getRandomItem(this.CUSTOM_NOUNS);
    }
  }

  /**
   * Get a random item from an array
   */
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Validate if an alias is available
   */
  static async isAliasAvailable(alias: string): Promise<boolean> {
    const existing = await prisma.encryptedWallet.findFirst({
      where: { currentAlias: alias }
    });
    return !existing;
  }

  /**
   * Validate alias format
   */
  static validateAliasFormat(alias: string): { isValid: boolean; error?: string } {
    if (!alias || alias.trim().length === 0) {
      return { isValid: false, error: 'Alias cannot be empty' };
    }

    if (alias.length > 32) {
      return { isValid: false, error: 'Alias must be 32 characters or less' };
    }

    if (alias.length < 3) {
      return { isValid: false, error: 'Alias must be at least 3 characters' };
    }

    // Allow letters, numbers, and underscores
    const validPattern = /^[a-zA-Z0-9_]+$/;
    if (!validPattern.test(alias)) {
      return { isValid: false, error: 'Alias can only contain letters, numbers, and underscores' };
    }

    // Check for reserved words (optional)
    const reservedWords = ['admin', 'root', 'system', 'test', 'demo', 'guest'];
    if (reservedWords.includes(alias.toLowerCase())) {
      return { isValid: false, error: 'This alias is reserved' };
    }

    return { isValid: true };
  }

  /**
   * Generate a preview of possible aliases (for UI suggestions)
   */
  static generatePreviewAliases(count: number = 5): string[] {
    const previews: string[] = [];
    for (let i = 0; i < count; i++) {
      previews.push(this.generateAlias());
    }
    return previews;
  }

  /**
   * Get alias statistics (for admin/monitoring)
   */
  static async getAliasStats(): Promise<{
    totalAliases: number;
    mostCommonPatterns: Array<{ pattern: string; count: number }>;
    averageLength: number;
  }> {
    try {
      const allAliases = await prisma.encryptedWallet.findMany({
        select: { currentAlias: true }
      });

      const totalAliases = allAliases.length;
      const averageLength = allAliases.reduce((sum, wallet) => sum + wallet.currentAlias.length, 0) / totalAliases;

      // Analyze patterns (simplified)
      const patterns = allAliases.map(wallet => {
        const alias = wallet.currentAlias;
        if (alias.match(/^[A-Z][a-z]+[A-Z][a-z]+$/)) return 'AdjectiveNoun';
        if (alias.match(/^[A-Z][a-z]+\d+$/)) return 'NameNumber';
        if (alias.match(/^\d+$/)) return 'NumberOnly';
        return 'Other';
      });

      const patternCounts = patterns.reduce((acc, pattern) => {
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonPatterns = Object.entries(patternCounts)
        .map(([pattern, count]) => ({ pattern, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalAliases,
        mostCommonPatterns,
        averageLength: Math.round(averageLength * 100) / 100
      };
    } catch (error) {
      console.error('Failed to get alias stats:', error);
      return {
        totalAliases: 0,
        mostCommonPatterns: [],
        averageLength: 0
      };
    }
  }
} 