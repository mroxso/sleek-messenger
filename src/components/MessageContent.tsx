import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { nip19 } from 'nostr-tools';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuthor } from '@/hooks/useAuthor';
import { useTruncateNostrId } from '@/hooks/useTruncateNostrId';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Repeat2, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NostrEvent } from '@nostrify/nostrify';

interface MessageContentProps {
  content: string;
  className?: string;
}

/** Parses message content to render URLs, hashtags, nostr: URIs, and reposts. */
export function MessageContent({ content, className }: MessageContentProps) {
  // Check if the content is a repost (kind 6) - it will be stringified JSON
  const repostEvent = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.kind === 1 && parsed.id && parsed.pubkey && parsed.content) {
        return parsed as NostrEvent;
      }
    } catch {
      // Not a repost, continue with normal parsing
    }
    return null;
  }, [content]);

  // Parse regular message content
  const renderedContent = useMemo(() => {
    const text = content;
    
    // Regex to find URLs, Nostr references, and hashtags
    const regex = /(https?:\/\/[^\s]+)|nostr:(npub1|note1|nprofile1|nevent1|naddr1)([023456789acdefghjklmnpqrstuvwxyz]+)|(#\w+)/g;
    
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyCounter = 0;
    
    while ((match = regex.exec(text)) !== null) {
      const [fullMatch, url, nostrPrefix, nostrData, hashtag] = match;
      const index = match.index;
      
      // Add text before this match
      if (index > lastIndex) {
        parts.push(text.substring(lastIndex, index));
      }
      
      if (url) {
        // Handle URLs
        parts.push(
          <a 
            key={`url-${keyCounter++}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            {url}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      } else if (nostrPrefix && nostrData) {
        // Handle Nostr references
        const nostrId = `${nostrPrefix}${nostrData}`;
        parts.push(
          <NostrReference 
            key={`nostr-${keyCounter++}`} 
            identifier={nostrId}
            fullMatch={fullMatch}
          />
        );
      } else if (hashtag) {
        // Handle hashtags
        const tag = hashtag.slice(1); // Remove the #
        parts.push(
          <Link 
            key={`hashtag-${keyCounter++}`}
            to={`/t/${tag}`}
            className="text-blue-400 hover:underline"
          >
            {hashtag}
          </Link>
        );
      }
      
      lastIndex = index + fullMatch.length;
    }
    
    // Add any remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // If no special content was found, just use the plain text
    if (parts.length === 0) {
      return text;
    }
    
    return parts;
  }, [content]);

  // If it's a repost, render the RepostCard
  if (repostEvent) {
    return <RepostCard event={repostEvent} className={className} />;
  }

  return (
    <div className={cn("whitespace-pre-wrap break-words", className)}>
      {renderedContent}
    </div>
  );
}

// Component to render different types of Nostr references
function NostrReference({ identifier, fullMatch }: { identifier: string; fullMatch: string }) {
  const { truncateNostrId } = useTruncateNostrId();
  
  try {
    const decoded = nip19.decode(identifier);
    
    if (decoded.type === 'npub') {
      const pubkey = decoded.data;
      return <NostrMention pubkey={pubkey} />;
    } else if (decoded.type === 'note') {
      const eventId = decoded.data;
      return <NotePreview eventId={eventId} identifier={identifier} />;
    } else if (decoded.type === 'nevent') {
      const { id: eventId } = decoded.data;
      return <NotePreview eventId={eventId} identifier={identifier} />;
    } else if (decoded.type === 'naddr') {
      // For addressable events, show as a link
      const truncatedDisplay = truncateNostrId(fullMatch);
      return (
        <Link 
          to={`/${identifier}`}
          className="text-blue-400 hover:underline"
          title={fullMatch}
        >
          {truncatedDisplay}
        </Link>
      );
    } else {
      // For other types, just show as a link with truncated display
      const truncatedDisplay = truncateNostrId(fullMatch);
      return (
        <Link 
          to={`/${identifier}`}
          className="text-blue-400 hover:underline"
          title={fullMatch}
        >
          {truncatedDisplay}
        </Link>
      );
    }
  } catch {
    // If decoding fails, just render as text
    return <span>{fullMatch}</span>;
  }
}

// Component to display user mentions
function NostrMention({ pubkey }: { pubkey: string }) {
  const author = useAuthor(pubkey);
  const npub = nip19.npubEncode(pubkey);
  const hasRealName = !!author.data?.metadata?.name;
  const displayName = author.data?.metadata?.name ?? genUserName(pubkey);

  return (
    <Link 
      to={`/${npub}`}
      className={cn(
        "font-medium hover:underline",
        hasRealName 
          ? "text-blue-400" 
          : "text-gray-400 hover:text-gray-300"
      )}
    >
      @{displayName}
    </Link>
  );
}

// Component to display a note preview as a card
function NotePreview({ eventId, identifier }: { eventId: string; identifier: string }) {
  const { nostr } = useNostr();
  const { truncateNostrId } = useTruncateNostrId();
  
  const { data: event, isLoading } = useQuery({
    queryKey: ['note-preview', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{ ids: [eventId] }], { signal });
      return events[0] as NostrEvent | undefined;
    },
  });

  const author = useAuthor(event?.pubkey || '');
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event?.pubkey || '');

  if (isLoading) {
    return (
      <span className="text-blue-400 hover:underline">
        {truncateNostrId(`nostr:${identifier}`)}
      </span>
    );
  }

  if (!event) {
    return (
      <Link 
        to={`/${identifier}`}
        className="text-blue-400 hover:underline"
      >
        {truncateNostrId(`nostr:${identifier}`)}
      </Link>
    );
  }

  return (
    <Link 
      to={`/${identifier}`}
      className="block my-2 hover:opacity-80 transition-opacity"
    >
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{displayName}</span>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {event.content}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// Component to display a repost
function RepostCard({ event, className }: { event: NostrEvent; className?: string }) {
  const author = useAuthor(event.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(event.pubkey);
  const npub = nip19.npubEncode(event.pubkey);
  const noteId = nip19.noteEncode(event.id);

  return (
    <Card className={cn("border-l-4 border-l-green-500", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
          <Repeat2 className="h-4 w-4" />
          <span className="text-xs font-medium">Reposted note</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/${npub}`}>
            <Avatar className="h-6 w-6">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>
          <Link to={`/${npub}`} className="font-medium text-sm hover:underline">
            {displayName}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <MessageContent content={event.content} />
        <Link 
          to={`/${noteId}`}
          className="text-xs text-muted-foreground hover:underline mt-2 inline-block"
        >
          View original note →
        </Link>
      </CardContent>
    </Card>
  );
}
