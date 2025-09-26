import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search, MoreVertical, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import type { NostrEvent } from '@nostrify/nostrify';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
import { useDecryptMessage } from '@/hooks/useDecryptMessage';

interface ChatItemProps {
  pubkey: string;
  lastMessage?: NostrEvent;
  timestamp?: number;
}

function ChatItem({ pubkey, lastMessage, timestamp }: ChatItemProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  
  // Decrypt the last message if it's encrypted
  const { data: decryptedMessage, isLoading: isDecrypting } = useDecryptMessage(lastMessage, pubkey);
  
  // Check if this is an encrypted message
  const isEncrypted = lastMessage?.kind === 4 || lastMessage?.kind === 1059;

  return (
    <div className="flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0">
      <Avatar className="h-12 w-12 flex-shrink-0">
        <AvatarImage src={metadata?.picture} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {displayName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground truncate pr-2">
            {displayName}
          </h3>
          {timestamp && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {new Date(timestamp * 1000).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric' 
              })}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1 mt-1">
          {isEncrypted && (
            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          <p className="text-sm text-muted-foreground truncate">
            {isDecrypting ? (
              <span className="animate-pulse">Decrypting...</span>
            ) : (
              decryptedMessage || lastMessage?.content || 'No messages yet'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function ChatListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-4 border-b border-border/50">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

const Index = () => {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();

  useSeoMeta({
    title: 'Chats - Sleek',
    description: 'A modern Nostr messaging application built with React, TailwindCSS, and Nostrify.',
  });

  const { data: recentContacts, isLoading } = useQuery({
    queryKey: ['recent-contacts'],
    queryFn: async (c) => {
      if (!user) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      // Get recent direct messages (both NIP-04 legacy and NIP-17 modern)
      const events = await nostr.query([
        // NIP-04 legacy encrypted DMs (deprecated but still in use)
        { kinds: [4], authors: [user.pubkey], limit: 50 },
        { kinds: [4], '#p': [user.pubkey], limit: 50 },
        // NIP-17 gift wraps for modern encrypted DMs
        { kinds: [1059], '#p': [user.pubkey], limit: 50 },
      ], { signal });

      // Extract unique contacts from the events
      const contacts = new Map<string, { pubkey: string; lastMessage?: NostrEvent; timestamp: number }>();
      
      events.forEach(event => {
        let contactPubkey: string | undefined;
        
        if (event.kind === 4) {
          // NIP-04 encrypted direct message
          contactPubkey = event.pubkey === user.pubkey 
            ? event.tags.find(tag => tag[0] === 'p')?.[1]
            : event.pubkey;
        } else if (event.kind === 1059) {
          // NIP-17 gift wrap - the sender is the contact
          // Note: For full NIP-17 support, we'd need to decrypt the gift wrap
          // to get the actual message, but for now we can at least track the conversation
          contactPubkey = event.pubkey !== user.pubkey ? event.pubkey : undefined;
        }
          
        if (contactPubkey && contactPubkey !== user.pubkey) {
          const existing = contacts.get(contactPubkey);
          if (!existing || event.created_at > existing.timestamp) {
            contacts.set(contactPubkey, {
              pubkey: contactPubkey,
              lastMessage: event,
              timestamp: event.created_at
            });
          }
        }
      });

      return Array.from(contacts.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <MessageCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Sleek
            </h1>
            <p className="text-muted-foreground">
              Connect with friends on the Nostr network
            </p>
          </div>
          <LoginArea className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-foreground">Chats</h1>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search chats..."
              className="pl-10 bg-muted/50 border-none"
            />
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1">
        {isLoading ? (
          <ChatListSkeleton />
        ) : recentContacts && recentContacts.length > 0 ? (
          <div className="divide-y divide-border/50">
            {recentContacts.map((contact) => (
              <ChatItem
                key={contact.pubkey}
                pubkey={contact.pubkey}
                lastMessage={contact.lastMessage}
                timestamp={contact.timestamp}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No chats yet</h3>
            <p className="text-muted-foreground text-center">
              Start a conversation by messaging someone on Nostr
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
