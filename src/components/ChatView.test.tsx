import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { ChatView } from './ChatView';

// Mock the hooks
vi.mock('@/hooks/useCurrentUser', () => ({
  useCurrentUser: () => ({
    user: { pubkey: 'test-pubkey', signer: {} }
  })
}));

vi.mock('@/hooks/useAuthor', () => ({
  useAuthor: () => ({
    data: {
      metadata: {
        name: 'Test User',
        picture: 'test-picture.jpg'
      }
    }
  })
}));

vi.mock('@/hooks/useChat', () => ({
  useChat: () => ({
    messages: [
      {
        id: '1',
        content: 'Check this out: nostr:nevent1qqsvx9rkx3d9shnrcjvqxsdrmqj0jz6zc5zr7v8w4qyz6xj9qyxjzvsppemhxue69uhkummn9ekx7mp0qgs9pk20ctv9kkh3ng6y9xsd99j2djckt4xt7nez4zzt7zj8qe9x8dn2grqsqqqqqp6phkh5',
        timestamp: Date.now() / 1000,
        isFromMe: false,
        isEncrypted: true
      }
    ],
    isLoading: false,
    sendMessage: { mutateAsync: vi.fn(), isPending: false },
    isAuthenticated: true
  }),
  useChatMessageDecryption: () => ({
    decryptedContent: 'Check this out: nostr:nevent1qqsvx9rkx3d9shnrcjvqxsdrmqj0jz6zc5zr7v8w4qyz6xj9qyxjzvsppemhxue69uhkummn9ekx7mp0qgs9pk20ctv9kkh3ng6y9xsd99j2djckt4xt7nez4zzt7zj8qe9x8dn2grqsqqqqqp6phkh5',
    isDecrypting: false
  })
}));

describe('ChatView', () => {
  it('should render messages with Nostr identifiers', () => {
    render(
      <TestApp>
        <ChatView contactPubkey="test-contact-pubkey" />
      </TestApp>
    );

    // The message content should be displayed
    expect(screen.getByText(/Check this out:/)).toBeInTheDocument();
  });
});