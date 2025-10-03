import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { MessageContent } from './MessageContent';

describe('MessageContent', () => {
  it('should render plain text messages', () => {
    render(
      <TestApp>
        <MessageContent content="Hello, world!" />
      </TestApp>
    );

    expect(screen.getByText('Hello, world!')).toBeInTheDocument();
  });

  it('should render URLs as links', () => {
    render(
      <TestApp>
        <MessageContent content="Check out https://example.com" />
      </TestApp>
    );

    expect(screen.getByText(/Check out/)).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('should render hashtags as links', () => {
    render(
      <TestApp>
        <MessageContent content="This is #awesome" />
      </TestApp>
    );

    expect(screen.getByText(/This is/)).toBeInTheDocument();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/t/awesome');
  });

  it('should render nostr: URIs', () => {
    render(
      <TestApp>
        <MessageContent content="Check nostr:npub1zg69v7ys40x77y352eufp27daufrg4ncjz4ummcjx3t83y9tehhsqepuh0" />
      </TestApp>
    );

    expect(screen.getByText(/Check/)).toBeInTheDocument();
  });

  it('should parse and render reposts', () => {
    // Use a valid hex pubkey (64 characters)
    const validPubkey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const repostContent = JSON.stringify({
      kind: 1,
      id: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
      pubkey: validPubkey,
      content: 'This is a reposted note',
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      sig: 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
    });

    render(
      <TestApp>
        <MessageContent content={repostContent} />
      </TestApp>
    );

    expect(screen.getByText('Reposted note')).toBeInTheDocument();
    expect(screen.getByText('This is a reposted note')).toBeInTheDocument();
  });
});
