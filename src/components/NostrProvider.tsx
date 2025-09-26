import React, { useEffect, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '@/hooks/useAppContext';
import { useNostrLogin } from '@nostrify/react/login';

interface NostrProviderProps {
  children: React.ReactNode;
}

// Custom relay handlers will be implemented in useNip65Relays instead of NostrProvider
const NostrProvider: React.FC<NostrProviderProps> = (props) => {
  const { children } = props;
  const { config, presetRelays } = useAppContext();
  const { logins } = useNostrLogin();
  
  const queryClient = useQueryClient();

  // Create NPool instance only once
  const pool = useRef<NPool | undefined>(undefined);

  // Use refs so the pool always has the latest data
  const relayUrl = useRef<string>(config.relayUrl);

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    queryClient.invalidateQueries();
    queryClient.resetQueries();
  }, [config.relayUrl, queryClient]);

  // Update refs when config changes
  useEffect(() => {
    relayUrl.current = config.relayUrl;
    queryClient.invalidateQueries();
    queryClient.resetQueries();
  }, [config.relayUrl, queryClient]);

  // Initialize NPool only once
  if (!pool.current) {
    pool.current = new NPool({
      open(url: string) {
        return new NRelay1(url);
      },
      reqRouter(filters) {
        // Default to using the configured relay
        return new Map([[relayUrl.current, filters]]);
      },
      eventRouter(event: NostrEvent) {
        // Start with the selected relay (always included)
        const allRelays = new Set<string>([relayUrl.current]);

        // Also include some preset relays (capped at 5 total)
        for (const { url } of (presetRelays ?? [])) {
          allRelays.add(url);
          if (allRelays.size >= 5) break;
        }

        // Special handling for NIP-65 relay list events - publish to all mentioned relays
        if (event.kind === 10002) {
          // Also publish to all preset relays
          (presetRelays ?? []).forEach(({ url }) => allRelays.add(url));
          
          // And to all relays mentioned in the event
          event.tags.forEach(tag => {
            if (tag[0] === 'r' && tag[1]) {
              allRelays.add(tag[1]);
            }
          });
        }
        
        return [...allRelays];
      },
    });
  }

  return (
    <NostrContext.Provider value={{ nostr: pool.current }}>
      {children}
    </NostrContext.Provider>
  );
};

export default NostrProvider;