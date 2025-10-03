import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDecryptMessage } from './useDecryptMessage';
import { TestApp } from '@/test/TestApp';
import type { NostrEvent } from '@nostrify/nostrify';

// Mock the useCurrentUser hook
vi.mock('./useCurrentUser', () => ({
  useCurrentUser: vi.fn(() => ({
    user: {
      pubkey: 'test-pubkey',
      signer: {
        nip44: {
          decrypt: vi.fn().mockResolvedValue('Decrypted test message'),
        },
        nip04: {
          decrypt: vi.fn().mockResolvedValue('Decrypted legacy message'),
        },
      },
    },
  })),
}));

describe('useDecryptMessage', () => {
  const mockEncryptedEvent: NostrEvent = {
    id: 'test-id',
    pubkey: 'sender-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: 4,
    tags: [['p', 'test-pubkey']],
    content: 'encrypted-content',
    sig: 'test-sig',
  };

  const mockPlainTextEvent: NostrEvent = {
    id: 'test-id-2',
    pubkey: 'sender-pubkey',
    created_at: Math.floor(Date.now() / 1000),
    kind: 1,
    tags: [],
    content: 'Hello world',
    sig: 'test-sig',
  };

  it('should return original content for non-encrypted messages', async () => {
    const { result } = renderHook(
      () => useDecryptMessage(mockPlainTextEvent),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.data).toBe('Hello world');
    });
  });

  it('should decrypt kind 4 messages using NIP-44', async () => {
    const { result } = renderHook(
      () => useDecryptMessage(mockEncryptedEvent),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.data).toBe('Decrypted test message');
    });
  });

  it('should return undefined for undefined event', async () => {
    const { result } = renderHook(
      () => useDecryptMessage(undefined),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  it('should handle decryption errors gracefully', async () => {
    // Mock signer to throw an error
    const { useCurrentUser } = await import('./useCurrentUser');
    vi.mocked(useCurrentUser).mockReturnValue({
      user: {
        pubkey: 'test-pubkey',
        signer: {
          nip44: {
            decrypt: vi.fn().mockRejectedValue(new Error('Decryption failed')),
          },
          nip04: {
            decrypt: vi.fn().mockRejectedValue(new Error('Legacy decryption failed')),
          },
        },
      },
      users: [],
    } as unknown as ReturnType<typeof useCurrentUser>);

    const { result } = renderHook(
      () => useDecryptMessage(mockEncryptedEvent),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.data).toBe('[Encrypted message]');
    });
  });
});