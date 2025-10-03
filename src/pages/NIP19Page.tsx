import { nip19 } from 'nostr-tools';
import { useParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import NotFound from './NotFound';
import { PublicProfile } from '@/components/PublicProfile';
import { SingleNote } from '@/components/SingleNote';
import { SingleEvent } from '@/components/SingleEvent';
import { AddressableEvent } from '@/components/AddressableEvent';
import { BottomNavigation } from '@/components/BottomNavigation';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  useSeoMeta({
    title: 'Sleek',
    description: 'Modern Nostr client for private messaging and more',
  });

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-foreground">Sleek</h1>
          </div>
        </div>

        {/* Content */}
        {(() => {
          switch (type) {
            case 'npub':
              return <PublicProfile pubkey={data as string} />;

            case 'nprofile': {
              const profile = data as { pubkey: string; relays?: string[] };
              return <PublicProfile pubkey={profile.pubkey} />;
            }

            case 'note':
              return <SingleNote eventId={data as string} />;

            case 'nevent': {
              const event = data as { id: string; author?: string; relays?: string[] };
              return <SingleEvent eventId={event.id} authorPubkey={event.author} relays={event.relays} />;
            }

            case 'naddr': {
              const addr = data as { kind: number; pubkey: string; identifier: string; relays?: string[] };
              return (
                <AddressableEvent 
                  kind={addr.kind} 
                  pubkey={addr.pubkey} 
                  identifier={addr.identifier}
                  relays={addr.relays}
                />
              );
            }

            default:
              return <NotFound />;
          }
        })()}
      </div>

      <BottomNavigation />
    </>
  );
} 