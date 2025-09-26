/**
 * Hook to truncate long Nostr identifiers for better UI display.
 * Truncates identifiers like "nostr:nevent1abc123..." to "nostr:nevent1abc12..."
 */
export function useTruncateNostrId() {
  const truncateNostrId = (identifier: string, maxLength = 5): string => {
    // Check if it starts with "nostr:"
    if (!identifier.startsWith('nostr:')) {
      return identifier;
    }

    // Extract the prefix (e.g., "nostr:nevent1", "nostr:npub1", etc.)
    const match = identifier.match(/^(nostr:[a-z]+1)(.*)$/);
    if (!match) {
      return identifier;
    }

    const [, prefix, data] = match;
    
    // If the data part is short enough, return as-is
    if (data.length <= maxLength) {
      return identifier;
    }

    // Truncate the data part and add ellipsis
    return `${prefix}${data.slice(0, maxLength)}...`;
  };

  return { truncateNostrId };
}