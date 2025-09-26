import React, { useEffect, useMemo, useRef } from 'react';
import { NostrEvent, NPool, NRelay1 } from '@nostrify/nostrify';
import { NostrContext } from '@nostrify/react';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNip65Relays } from '@/hooks/useNip65Relays';
import { useAppContext } from '@/hooks/useAppContext';

interface Nip65RouterProps {
  children: React.ReactNode;
}

/**
 * This component wraps NostrProvider's pool with NIP-65 aware routing logic
 */
export function Nip65Router({ children }: Nip65RouterProps) {
  const { nostr: baseNostr } = useNostr();
  const { user } = useCurrentUser();
  const { readRelays, writeRelays } = useNip65Relays();
  const { config, presetRelays } = useAppContext();
  
  // Create a memoized nostr instance with NIP-65 routing
  const nostr = useMemo(() => {
    // Special router functions
    const nip65ReqRouter = (filters: any) => {
      // If user has NIP-65 read relays, use them
      if (user && readRelays.length > 0) {
        const relayMap = new Map();
        readRelays.forEach(url => {
          relayMap.set(url, filters);
        });
        // Always include current relay as fallback
        relayMap.set(config.relayUrl, filters);
        return relayMap;
      } else {
        // Fall back to default behavior (current relay)
        return new Map([[config.relayUrl, filters]]);
      }
    };

    const nip65EventRouter = (event: NostrEvent) => {
      // Start with current relay
      const allRelays = new Set<string>([config.relayUrl]);

      // If user has NIP-65 write relays, use them
      if (user && writeRelays.length > 0) {
        writeRelays.forEach(url => allRelays.add(url));
      } else {
        // Otherwise use preset relays (capped at 5)
        for (const { url } of (presetRelays || [])) {
          allRelays.add(url);
          if (allRelays.size >= 5) break;
        }
      }

      // Special handling for kind:10002 - publish to all mentioned relays
      if (event.kind === 10002) {
        // Add all presets
        (presetRelays || []).forEach(({ url }) => allRelays.add(url));
        
        // Add all relays mentioned in the event
        event.tags.forEach(tag => {
          if (tag[0] === 'r' && tag[1]) {
            allRelays.add(tag[1]);
          }
        });
      }

      return [...allRelays];
    };

    // Create proxy object that overrides the routing functions
    return new Proxy(baseNostr, {
      get(target, prop) {
        if (prop === 'reqRouter') return nip65ReqRouter;
        if (prop === 'eventRouter') return nip65EventRouter;
        return (target as any)[prop];
      }
    });
  }, [baseNostr, user, readRelays, writeRelays, config.relayUrl, presetRelays]);

  return (
    <NostrContext.Provider value={{ nostr }}>
      {children}
    </NostrContext.Provider>
  );
}