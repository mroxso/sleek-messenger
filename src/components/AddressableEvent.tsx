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
import { MessageCircle, Calendar, Hash, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

interface AddressableEventProps {
  kind: number;
  pubkey: string;
  identifier: string;
  relays?: string[];
}

export function AddressableEvent({ kind, pubkey, identifier, relays }: AddressableEventProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Query the addressable event
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['addressable-event', kind, pubkey, identifier],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // If we have specific relays, use them
      const querySource = relays && relays.length > 0 
        ? nostr.group(relays)
        : nostr;
      
      const events = await querySource.query([{
        kinds: [kind],
        authors: [pubkey],
        '#d': [identifier],
      }], { signal });
      
      return events[0] as NostrEvent | undefined;
    },
  });

  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);

  const handleStartChat = () => {
    navigate(`/chat/${pubkey}`);
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
      30000: 'Categorized People List',
      30001: 'Categorized Bookmark List',
      30002: 'Relay Set',
      30003: 'Bookmark Set',
      30004: 'Curation Set',
      30008: 'Profile Badges',
      30009: 'Badge Definition',
      30015: 'Interest Set',
      30017: 'Create or Update Stall',
      30018: 'Create or Update Product',
      30023: 'Long-form Content',
      30024: 'Draft Long-form Content',
      30030: 'Emoji Set',
      30078: 'Application-specific Data',
      30311: 'Live Event',
      30315: 'User Status',
      30402: 'Classified Listing',
      30403: 'Draft Classified Listing',
      31922: 'Date-Based Calendar Event',
      31923: 'Time-Based Calendar Event',
      31924: 'Calendar',
      31925: 'Calendar Event RSVP',
      31989: 'Handler Recommendation',
      31990: 'Handler Information',
      34550: 'Community Definition',
    };
    
    return kindMap[kind] || `Kind ${kind}`;
  };

  const getTitleTag = (event: NostrEvent) => {
    const titleTag = event.tags.find(([name]) => name === 'title');
    return titleTag?.[1];
  };

  const getSummaryTag = (event: NostrEvent) => {
    const summaryTag = event.tags.find(([name]) => name === 'summary');
    return summaryTag?.[1];
  };

  const getImageTag = (event: NostrEvent) => {
    const imageTag = event.tags.find(([name]) => name === 'image');
    return imageTag?.[1];
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
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
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
  const title = getTitleTag(event);
  const summary = getSummaryTag(event);
  const image = getImageTag(event);

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar 
                className="h-12 w-12 cursor-pointer"
                onClick={() => navigate(`/${nip19.npubEncode(pubkey)}`)}
              >
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h3 
                  className="font-semibold text-foreground cursor-pointer hover:underline"
                  onClick={() => navigate(`/${nip19.npubEncode(pubkey)}`)}
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
          {/* Title */}
          {title && (
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                {title}
              </h2>
            </div>
          )}

          {/* Image */}
          {image && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={image} 
                alt={title || 'Event image'} 
                className="w-full h-auto max-h-96 object-cover"
              />
            </div>
          )}

          {/* Summary */}
          {summary && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">Summary:</p>
              <p className="text-sm">{summary}</p>
            </div>
          )}

          {/* Content */}
          {event.content && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Content:</p>
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap break-words text-sm">
                  {event.content.length > 1000 
                    ? event.content.slice(0, 1000) + '...' 
                    : event.content}
                </div>
              </div>
            </div>
          )}

          {/* Identifier */}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Identifier (d-tag)</p>
            <code className="text-xs bg-muted px-3 py-2 rounded-md break-all block">
              {identifier}
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
