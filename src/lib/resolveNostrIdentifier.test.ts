import { describe, it, expect, vi, afterEach } from 'vitest';
import { resolveNostrIdentifier } from './resolveNostrIdentifier';
import { nip19 } from 'nostr-tools';

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn());

describe('resolveNostrIdentifier', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should resolve hex pubkeys correctly', async () => {
    const hexKey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
    
    const result = await resolveNostrIdentifier(hexKey);
    
    expect(result.pubkey).toBe(hexKey);
    expect(result.error).toBeNull();
  });

  it('should resolve npub format correctly', async () => {
    const hexKey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
    const npub = nip19.npubEncode(hexKey);
    
    const result = await resolveNostrIdentifier(npub);
    
    expect(result.pubkey).toBe(hexKey);
    expect(result.error).toBeNull();
  });

  it('should resolve NIP-05 identifiers correctly', async () => {
    const hexKey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
    const nip05 = 'jack@example.com';
    
    // Mock the fetch response
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ names: { jack: hexKey } })
    });
    
    const result = await resolveNostrIdentifier(nip05);
    
    expect(result.pubkey).toBe(hexKey);
    expect(result.error).toBeNull();
    expect(fetch).toHaveBeenCalledWith('https://example.com/.well-known/nostr.json?name=jack');
  });

  it('should resolve usernames using the query function', async () => {
    const hexKey = '3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d';
    const username = 'jack';
    
    // Mock the query function
    const mockQueryFn = vi.fn().mockResolvedValueOnce([
      { 
        pubkey: hexKey, 
        content: JSON.stringify({ name: 'jack', display_name: 'Jack' }) 
      }
    ]);
    
    const result = await resolveNostrIdentifier(username, mockQueryFn);
    
    expect(result.pubkey).toBe(hexKey);
    expect(result.error).toBeNull();
    expect(mockQueryFn).toHaveBeenCalledWith({ kinds: [0], limit: 10 });
  });

  it('should return an error for invalid identifiers', async () => {
    const result = await resolveNostrIdentifier('not-a-valid-identifier');
    
    expect(result.pubkey).toBeNull();
    expect(result.error).not.toBeNull();
  });
});