import { POST as storageQueryPOST } from '../storage-query/route';
import { POST as priceOraclePOST } from '../price-oracle/route';
import { POST as identityAggregatorPOST } from '../identity-aggregator/route';
import { POST as crossChainTransferPOST } from '../cross-chain-transfer/route';
import type { NextRequest } from 'next/server';

// Minimal mock for NextRequest with required properties
const createRequest = (body: Record<string, unknown>): NextRequest => ({
  json: async () => body,
  cookies: {} as unknown,
  nextUrl: {} as unknown,
  page: {} as unknown,
  ua: {} as unknown,
  [Symbol.for('INTERNALS')]: {} as unknown
} as unknown as NextRequest);

describe('Hyperbridge API', () => {
  describe('storage-query', () => {
    it('returns storage data for valid request', async () => {
      const req = createRequest({
        sourceChain: 'ethereum',
        targetChain: 'polkadot',
        storageKey: 'uniswap_v3_eth_usdc_price'
      });
      const res = await storageQueryPOST(req);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('chain', 'ethereum');
      expect(data.data).toHaveProperty('key', 'uniswap_v3_eth_usdc_price');
    });
    it('returns error for missing params', async () => {
      const req = createRequest({});
      const res = await storageQueryPOST(req);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(res.status).toBe(400);
    });
  });

  describe('price-oracle', () => {
    it('creates a price oracle', async () => {
      const req = createRequest({
        action: 'create',
        sourceDEX: 'uniswap_v3_ethereum',
        targetChains: ['polkadot'],
        updateInterval: 60,
        tokenPair: 'ETH/USDC'
      });
      const res = await priceOraclePOST(req);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id');
      expect(data.data).toHaveProperty('price');
    });
    it('fetches a price oracle', async () => {
      const req = createRequest({ action: 'get', oracleId: 'oracle1' });
      const res = await priceOraclePOST(req);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('id', 'oracle1');
    });
    it('returns error for missing params', async () => {
      const req = createRequest({ action: 'create' });
      const res = await priceOraclePOST(req);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(res.status).toBe(400);
    });
  });

  describe('identity-aggregator', () => {
    it('aggregates identity for valid request', async () => {
      const req = createRequest({
        chains: ['ethereum', 'polkadot'],
        userAddress: '0x123',
        identityData: ['balance', 'reputation']
      });
      const res = await identityAggregatorPOST(req);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('address', '0x123');
    });
    it('returns error for missing params', async () => {
      const req = createRequest({});
      const res = await identityAggregatorPOST(req);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(res.status).toBe(400);
    });
  });

  describe('cross-chain-transfer', () => {
    it('simulates a cross-chain transfer', async () => {
      const req = createRequest({
        fromChain: 'ethereum',
        toChain: 'polkadot',
        fromAddress: '0xabc',
        toAddress: '0xdef',
        amount: '1000',
        token: 'ETH'
      });
      const res = await crossChainTransferPOST(req);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('sourceTx');
      expect(data.data).toHaveProperty('targetTx');
      expect(data.data).toHaveProperty('status', 'confirmed');
    });
    it('returns error for missing params', async () => {
      const req = createRequest({});
      const res = await crossChainTransferPOST(req);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(res.status).toBe(400);
    });
  });
}); 