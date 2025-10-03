import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Calendar, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';

interface SingleEventProps {
  eventId: string;
  authorPubkey?: string;
  relays?: string[];
}

export function SingleEvent({ eventId, authorPubkey, relays }: SingleEventProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Query the event
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // If we have specific relays, use them
      const querySource = relays && relays.length > 0 
        ? nostr.group(relays)
        : nostr;
      
      const filter = authorPubkey
        ? { ids: [eventId], authors: [authorPubkey] }
        : { ids: [eventId] };
      
      const events = await querySource.query([filter], { signal });
      return events[0] as NostrEvent | undefined;
    },
  });

  const author = useAuthor(event?.pubkey || '');
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event?.pubkey || '');

  const handleStartChat = () => {
    if (event?.pubkey) {
      navigate(`/chat/${event.pubkey}`);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getKindDescription = (kind: number) => {
    const kindMap: Record<number, string> = {
      0: 'Profile Metadata',
      1: 'Text Note',
      2: 'Recommend Relay',
      3: 'Contacts',
      4: 'Encrypted Direct Message',
      5: 'Event Deletion',
      6: 'Repost',
      7: 'Reaction',
      8: 'Badge Award',
      1059: 'Gift Wrap',
      1984: 'Reporting',
      9734: 'Zap Request',
      9735: 'Zap',
      10000: 'Mute List',
      10001: 'Pin List',
      10002: 'Relay List Metadata',
      30000: 'Categorized People List',
      30001: 'Categorized Bookmark List',
      30023: 'Long-form Content',
    };
    
    return kindMap[kind] || `Kind ${kind}`;
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Event not found</p>
            {relays && relays.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Tried relays: {relays.join(', ')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnEvent = user?.pubkey === event.pubkey;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar 
                className="h-12 w-12 cursor-pointer"
                onClick={() => navigate(`/profile/${event.pubkey}`)}
              >
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 
                  className="font-semibold text-foreground cursor-pointer hover:underline"
                  onClick={() => navigate(`/profile/${event.pubkey}`)}
                >
                  {displayName}
                </h3>
                {metadata?.nip05 && (
                  <p className="text-sm text-muted-foreground">{metadata.nip05}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(event.created_at)}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Hash className="h-3 w-3 mr-1" />
                    {getKindDescription(event.kind)}
                  </Badge>
                </div>
              </div>
            </div>

            {!isOwnEvent && (
              <Button
                size="sm"
                onClick={handleStartChat}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Message</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Content */}
          {event.content && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Content:</p>
              <div className="whitespace-pre-wrap break-words text-sm">
                {event.content.length > 500 
                  ? event.content.slice(0, 500) + '...' 
                  : event.content}
              </div>
            </div>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Tags:</p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {event.tags.slice(0, 20).map((tag, idx) => (
                  <div key={idx} className="text-xs bg-muted px-3 py-1.5 rounded-md font-mono">
                    {tag.map((item, itemIdx) => (
                      <span key={itemIdx} className={itemIdx === 0 ? 'font-semibold' : ''}>
                        {itemIdx > 0 && ', '}
                        {item.length > 80 ? item.slice(0, 80) + '...' : item}
                      </span>
                    ))}
                  </div>
                ))}
                {event.tags.length > 20 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {event.tags.length - 20} more tags
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Event ID */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Event ID</p>
            <code className="text-xs bg-muted px-3 py-2 rounded-md break-all block">
              {event.id}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
