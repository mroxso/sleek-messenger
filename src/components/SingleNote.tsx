import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { NoteContent } from '@/components/NoteContent';
import { ReactionButton } from '@/components/ReactionButton';
import { MessageCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NostrEvent } from '@nostrify/nostrify';

interface SingleNoteProps {
  eventId: string;
}

export function SingleNote({ eventId }: SingleNoteProps) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Query the note event
  const { data: event, isLoading, error } = useQuery({
    queryKey: ['note', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{ ids: [eventId], kinds: [1] }], { signal });
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
            <p className="text-muted-foreground">Note not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnNote = user?.pubkey === event.pubkey;

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
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(event.created_at)}</span>
                </div>
              </div>
            </div>

            {!isOwnNote && (
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

        <CardContent>
          <div className="whitespace-pre-wrap break-words">
            <NoteContent event={event} className="text-base leading-relaxed" />
          </div>
        </CardContent>

        <CardFooter className="pt-2 pb-4 border-t">
          <ReactionButton
            eventId={event.id}
            eventPubkey={event.pubkey}
            eventKind={event.kind}
          />
        </CardFooter>
      </Card>
    </div>
  );
}
