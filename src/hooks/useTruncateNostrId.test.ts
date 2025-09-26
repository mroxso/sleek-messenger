import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useTruncateNostrId } from './useTruncateNostrId';

describe('useTruncateNostrId', () => {
  it('should truncate long nevent identifiers correctly', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const longId = 'nostr:nevent1qqsvx9rkx3d9shnrcjvqxsdrmqj0jz6zc5zr7v8w4qyz6xj9qyxjzvsppemhxue69uhkummn9ekx7mp0qgs9pk20ctv9kkh3ng6y9xsd99j2djckt4xt7nez4zzt7zj8qe9x8dn2grqsqqqqqp6phkh5';
    const expected = 'nostr:nevent1qqsvx...';
    
    expect(truncateNostrId(longId)).toBe(expected);
  });

  it('should truncate long npub identifiers correctly', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const longId = 'nostr:npub1abc123defghijklmnopqrstuvwxyz0123456789';
    const expected = 'nostr:npub1abc12...';
    
    expect(truncateNostrId(longId)).toBe(expected);
  });

  it('should handle custom maxLength parameter', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const longId = 'nostr:nevent1abcdefghijklmnop';
    const expected = 'nostr:nevent1abcdefghij...';
    
    expect(truncateNostrId(longId, 10)).toBe(expected);
  });

  it('should not truncate short identifiers', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const shortId = 'nostr:npub1abc';
    expect(truncateNostrId(shortId)).toBe(shortId);
  });

  it('should not modify non-nostr identifiers', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const nonNostrId = 'https://example.com/very-long-url-that-should-not-be-modified';
    expect(truncateNostrId(nonNostrId)).toBe(nonNostrId);
  });

  it('should handle malformed nostr identifiers gracefully', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const malformedId = 'nostr:invalid';
    expect(truncateNostrId(malformedId)).toBe(malformedId);
  });

  it('should use default maxLength of 5 when not specified', () => {
    const { result } = renderHook(() => useTruncateNostrId());
    const { truncateNostrId } = result.current;
    
    const longId = 'nostr:nevent1abcdefghijk';
    const expected = 'nostr:nevent1abcde...';
    
    expect(truncateNostrId(longId)).toBe(expected);
  });
});