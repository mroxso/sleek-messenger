import { nip19 } from 'nostr-tools';

// Regex patterns for different Nostr identifier formats
const NPUB_REGEX = /^npub1[023456789acdefghjklmnpqrstuvwxyz]{58}$/;
const HEX_PUBKEY_REGEX = /^[0-9a-f]{64}$/;
const NIP05_REGEX = /^[\w\.\-]+@[\w\.\-]+$/;

export interface NostrIdentifierResult {
  pubkey: string | null;
  error: string | null;
}

/**
 * Resolves various Nostr identifier formats to a pubkey
 * Supports npub, hex pubkey, and NIP-05 identifiers
 */
export async function resolveNostrIdentifier(
  identifier: string, 
  queryFn?: (filter: any) => Promise<any[]>
): Promise<NostrIdentifierResult> {
  if (!identifier?.trim()) {
    return { pubkey: null, error: 'No identifier provided' };
  }

  // Case 1: npub format
  if (NPUB_REGEX.test(identifier)) {
    try {
      const { type, data } = nip19.decode(identifier);
      if (type === 'npub') {
        return { pubkey: data, error: null };
      }
    } catch (e) {
      return { pubkey: null, error: 'Invalid npub format' };
    }
  }

  // Case 2: Hex pubkey
  if (HEX_PUBKEY_REGEX.test(identifier)) {
    return { pubkey: identifier, error: null };
  }

  // Case 3: NIP-05 identifier
  if (NIP05_REGEX.test(identifier)) {
    try {
      // Implementation for NIP-05 resolution
      const [name, domain] = identifier.split('@');
      const response = await fetch(`https://${domain}/.well-known/nostr.json?name=${name}`);
      
      if (!response.ok) {
        return { 
          pubkey: null, 
          error: `NIP-05 resolution failed: ${response.statusText}` 
        };
      }
      
      const data = await response.json();
      const pubkey = data?.names?.[name];
      
      if (!pubkey) {
        return { 
          pubkey: null, 
          error: `NIP-05 identifier not found: ${identifier}`
        };
      }

      return { pubkey, error: null };
    } catch (e) {
      return { 
        pubkey: null, 
        error: `Failed to resolve NIP-05 address: ${e.message}` 
      };
    }
  }

  // Case 4: Username (if queryFn is provided)
  if (queryFn) {
    try {
      const events = await queryFn({ kinds: [0], limit: 10 });

      // Find events where content contains a name field matching our search
      const matches = events.filter(event => {
        try {
          const metadata = JSON.parse(event.content);
          const name = metadata.name?.toLowerCase() || '';
          const displayName = metadata.display_name?.toLowerCase() || '';
          const searchTerm = identifier.toLowerCase();
          return name === searchTerm || displayName === searchTerm;
        } catch {
          return false;
        }
      });

      if (matches.length === 1) {
        return { pubkey: matches[0].pubkey, error: null };
      } else if (matches.length > 1) {
        // Return the first match but note that multiple were found
        return { 
          pubkey: matches[0].pubkey, 
          error: `Multiple matches found for "${identifier}", using first result` 
        };
      } else {
        return { 
          pubkey: null, 
          error: `No users found with name "${identifier}"` 
        };
      }
    } catch (e) {
      return { 
        pubkey: null, 
        error: `Username search failed: ${e.message}`
      };
    }
  }

  return { 
    pubkey: null, 
    error: 'Could not resolve identifier to a valid Nostr pubkey' 
  };
}