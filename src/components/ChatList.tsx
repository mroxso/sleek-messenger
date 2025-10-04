import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Lock, MessageCircle } from 'lucide-react';
import { useAuthor } from '@/hooks/useAuthor';
import { useSeenMessages } from '@/hooks/useSeenMessages';
import { genUserName } from '@/lib/genUserName';
import { useDecryptMessage } from '@/hooks/useDecryptMessage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface ChatItemProps {
  pubkey: string;
  lastMessage?: NostrEvent;
  timestamp?: number;
  isActive?: boolean;
  unreadCount?: number;
}

function ChatItem({ pubkey, lastMessage, timestamp, isActive = false, unreadCount = 0 }: ChatItemProps) {
  const navigate = useNavigate();
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);

  // Decrypt the last message if it's encrypted
  const { data: decryptedMessage, isLoading: isDecrypting } = useDecryptMessage(lastMessage, pubkey);

  // Check if this is an encrypted message
  const isEncrypted = lastMessage?.kind === 4 || lastMessage?.kind === 1059;
  
  // Check if there are unread messages
  const hasUnread = unreadCount > 0;

  const handleClick = () => {
    navigate(`/chat/${pubkey}`);
  };

  return (
    <div
      className={cn(
        "flex items-center space-x-3 p-4 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors",
        isActive && "bg-muted"
      )}
      onClick={handleClick}
    >
      <div className="relative">
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage src={metadata?.picture} alt={displayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-sm">
            {displayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className={cn(
            "truncate pr-2",
            hasUnread ? "font-bold text-foreground" : "font-medium",
            isActive ? "text-primary" : "text-foreground"
          )}>
            {displayName}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {timestamp && (
              <span className={cn(
                "text-xs",
                hasUnread ? "text-foreground font-semibold" : "text-muted-foreground"
              )}>
                {new Date(timestamp * 1000).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1 mt-1">
          {isEncrypted && (
            <Lock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          )}
          <p className={cn(
            "text-sm truncate",
            hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
          )}>
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

interface ChatListProps {
  activeChatPubkey?: string;
  className?: string;
}

export function ChatList({ activeChatPubkey, className }: ChatListProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { hasUnreadMessages } = useSeenMessages();

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
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  if (isLoading) {
    return <ChatListSkeleton />;
  }

  if (recentContacts && recentContacts.length > 0) {
    return (
      <div className={cn("divide-y divide-border/50", className)}>
        {recentContacts.map((contact) => {
          const isUnread = contact.lastMessage 
            ? hasUnreadMessages(contact.pubkey, contact.lastMessage.created_at)
            : false;
          
          return (
            <ChatItem
              key={contact.pubkey}
              pubkey={contact.pubkey}
              lastMessage={contact.lastMessage}
              timestamp={contact.timestamp}
              isActive={activeChatPubkey === contact.pubkey}
              unreadCount={isUnread ? 1 : 0}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <MessageCircle className="h-16 w-16 text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No chats yet</h3>
      <p className="text-muted-foreground text-center">
        Start a conversation by messaging someone on Nostr
      </p>
    </div>
  );
}