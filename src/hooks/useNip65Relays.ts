import { useNostr } from '@nostrify/react';
import { NostrEvent, NPool } from '@nostrify/nostrify';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import { useAppContext } from './useAppContext';

export interface RelayInfo {
  url: string;
  read: boolean;
  write: boolean;
}

export interface UseNip65RelaysResult {
  relays: RelayInfo[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addRelay: (relay: RelayInfo) => Promise<RelayInfo[]>;
  updateRelay: (relay: RelayInfo) => Promise<RelayInfo[]>;
  removeRelay: (url: string) => Promise<RelayInfo[]>;
  publishRelays: (relays: RelayInfo[]) => Promise<RelayInfo[]>;
  isPublishing: boolean;
  
  // NIP-65 specific nostr relays - used by Nostr provider
  readRelays: string[];
  writeRelays: string[];
}

/**
 * Hook to fetch and manage NIP-65 relay lists for a user
 * 
 * @returns {UseNip65RelaysResult} Relay list data and management functions
 */
export function useNip65Relays(): UseNip65RelaysResult {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Define user's pubkey for query key
  const pubkey = user?.pubkey;

  // Query to fetch the user's NIP-65 relay list
  const query = useQuery({
    queryKey: ['nip65-relays', pubkey],
    queryFn: async ({ signal }) => {
      if (!pubkey) {
        return [];
      }

      // Query for kind 10002 events from the user's pubkey
      const events = await nostr.query(
        [{ kinds: [10002], authors: [pubkey], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]) }
      );

      // If no relay list event found
      if (events.length === 0) {
        return [];
      }

      // Parse relay tags from the most recent event
      const event = events[0];
      const relayInfoList: RelayInfo[] = [];

      for (const tag of event.tags) {
        // Process 'r' tags according to NIP-65
        if (tag[0] === 'r' && tag[1]) {
          const url = tag[1];
          const marker = tag[2]?.toLowerCase();
          
          // If no marker, relay is both read and write
          // If marker is "read", relay is read-only
          // If marker is "write", relay is write-only
          relayInfoList.push({
            url,
            read: !marker || marker === 'read',
            write: !marker || marker === 'write',
          });
        }
      }

      return relayInfoList;
    },
    enabled: !!pubkey, // Only run if user is logged in
  });

  // Mutation to publish a new NIP-65 relay list
  // Extract read and write relays from the query results
  const readRelays = (query.data || [])
    .filter(relay => relay.read)
    .map(relay => relay.url);
    
  const writeRelays = (query.data || [])
    .filter(relay => relay.write)
    .map(relay => relay.url);

  // Get current app relay from context
  const { config } = useAppContext();

  const mutation = useMutation({
    mutationFn: async (relays: RelayInfo[]) => {
      if (!user) {
        throw new Error('User not logged in');
      }

      // Convert relay info to NIP-65 tags
      const tags: string[][] = [];
      
      for (const relay of relays) {
        if (relay.read && relay.write) {
          // Both read and write (no marker)
          tags.push(['r', relay.url]);
        } else if (relay.read) {
          // Read-only
          tags.push(['r', relay.url, 'read']);
        } else if (relay.write) {
          // Write-only
          tags.push(['r', relay.url, 'write']);
        }
      }

      // Create and sign the event
      const event = await user.signer.signEvent({
        kind: 10002,
        tags,
        content: '',
        created_at: Math.floor(Date.now() / 1000),
      });

      // Get all destination relays - combine:
      // 1. Current app relay
      // 2. All write relays from NIP-65 
      // 3. All relays mentioned in the event
      const destinationRelays = new Set<string>([config.relayUrl]);
      
      // Add all write relays
      writeRelays.forEach(url => destinationRelays.add(url));
      
      // Add all relays in the list
      tags.forEach(tag => {
        if (tag[0] === 'r' && tag[1]) {
          destinationRelays.add(tag[1]);
        }
      });

      // Publish to all these relays
      await Promise.allSettled(
        Array.from(destinationRelays).map(url => 
          nostr.relay(url).event(event).catch(e => 
            console.error(`Failed to publish to ${url}:`, e)
          )
        )
      );
      
      return relays;
    },
    onSuccess: () => {
      // Invalidate and refetch the relay list query
      queryClient.invalidateQueries({ queryKey: ['nip65-relays', pubkey] });
    },
  });

  // Add a new relay to the user's list
  const addRelay = async (relay: RelayInfo) => {
    const currentRelays = query.data || [];
    
    // Check if relay already exists
    const exists = currentRelays.some(r => r.url === relay.url);
    if (exists) {
      // Update existing relay instead of adding a duplicate
      return updateRelay(relay);
    }
    
    // Add new relay to the list
    const updatedRelays = [...currentRelays, relay];
    return mutation.mutateAsync(updatedRelays);
  };

  // Update an existing relay's read/write status
  const updateRelay = async (relay: RelayInfo) => {
    const currentRelays = query.data || [];
    const updatedRelays = currentRelays.map(r => 
      r.url === relay.url ? relay : r
    );
    return mutation.mutateAsync(updatedRelays);
  };

  // Remove a relay from the user's list
  const removeRelay = async (url: string) => {
    const currentRelays = query.data || [];
    const updatedRelays = currentRelays.filter(r => r.url !== url);
    return mutation.mutateAsync(updatedRelays);
  };

  return {
    relays: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    addRelay,
    updateRelay,
    removeRelay,
    publishRelays: mutation.mutateAsync,
    isPublishing: mutation.isPending,
    readRelays,
    writeRelays,
  };
}