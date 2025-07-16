# SIMChain Client Gotchas

## Important Considerations for Client Developers

### 1. MintRegistry Space Limits

**Issue**: The `MintRegistry` account has a fixed size that limits the number of approved mints.

**Current Limit**: 16 approved mints maximum
- Space allocation: `8 + 32 + 4 + 32 * 16 + 1 + 8 = 553 bytes`
- This includes: discriminator + admin + vec length + 16 Pubkeys + bump + wallet_count

**Client Responsibility**: 
- Never attempt to add more than 16 mints to the registry
- Monitor the registry size and warn users when approaching the limit
- Consider implementing a mint removal mechanism if needed

**Example Check**:
```typescript
const registry = await client.getMintRegistry();
if (registry.approved.length >= 16) {
  throw new Error("Mint registry is full (16 mints maximum)");
}
```

### 2. Alias Index Cleanup

**Issue**: When closing a wallet, the corresponding `AliasIndex` PDA remains on-chain, keeping the alias "taken".

**Problem**: 
- Aliases are stored in dedicated PDAs for O(1) uniqueness checking
- Closing a wallet doesn't automatically close its alias index
- This prevents the alias from being reused by other wallets

**Solution**: Always close the alias index after closing a wallet.

**Client Implementation**:
```typescript
// After closing a wallet, also close its alias index
async function closeWalletAndCleanup(sim: string, destination: PublicKey) {
  // 1. Get the wallet to find its current alias
  const [walletPda] = await client.deriveWalletPDA(sim);
  const walletAccount = await client.program.account.wallet.fetch(walletPda);
  
  // 2. Close the wallet first
  await client.closeWallet(sim, destination);
  
  // 3. If the wallet had an alias, close the alias index too
  if (walletAccount.alias.some(b => b !== 0)) {
    await client.closeAliasIndex(walletAccount.alias, destination);
  }
}
```

**Helper Method Available**:
```typescript
// Use the built-in helper (if implemented)
await client.closeAliasIndex(alias, destination);
```

### 3. Best Practices

1. **Always check registry capacity** before adding new mints
2. **Always close alias indices** after closing wallets
3. **Use fresh localnet** for testing to avoid state conflicts
4. **Monitor events** for proper error handling and user feedback
5. **Validate inputs** (PIN strength, alias format, salt length)

### 4. Error Handling

Common errors to handle:
- `MintRegistry` full (16 mints limit)
- `AliasAlreadyExists` (alias index already taken)
- `InsufficientBalance` (rent-exemption guards)
- `InvalidSaltLength` (max 32 bytes)

### 5. Testing Considerations

- Reset validator between test runs to avoid state conflicts
- Use unique SIM numbers for each test to avoid collisions
- Test alias cleanup scenarios
- Verify rent-exemption guards work correctly
- Test registry capacity limits 