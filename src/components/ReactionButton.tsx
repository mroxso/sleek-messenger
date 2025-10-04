import { useReactions } from '@/hooks/useReactions';
import { useReact } from '@/hooks/useReact';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReactionButtonProps {
  eventId: string;
  eventPubkey: string;
  eventKind: number;
  /** For addressable events, provide the d-tag identifier */
  dTag?: string;
  relayHint?: string;
  className?: string;
  variant?: 'default' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showCount?: boolean;
}

export function ReactionButton({
  eventId,
  eventPubkey,
  eventKind,
  dTag,
  relayHint,
  className,
  variant = 'ghost',
  size = 'sm',
  showCount = true,
}: ReactionButtonProps) {
  const { user } = useCurrentUser();
  const { data: stats, isLoading } = useReactions(eventId, eventPubkey);
  const { react, unreact } = useReact();

  const handleClick = async () => {
    if (!user) return;

    if (stats?.userReaction) {
      // User has already reacted, so unreact
      await unreact.mutateAsync({
        eventId,
        reactionEventId: stats.userReaction.id,
      });
    } else {
      // User hasn't reacted, so react with a like
      await react.mutateAsync({
        eventId,
        eventPubkey,
        eventKind,
        content: '+',
        relayHint,
        dTag,
      });
    }
  };

  const isPending = react.isPending || unreact.isPending;
  const hasReacted = stats?.hasUserLiked || stats?.hasUserDisliked;

  if (isLoading) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        disabled
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        {showCount && <span className="ml-1">-</span>}
      </Button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        'gap-1',
        className
      )}
      onClick={handleClick}
      disabled={!user || isPending}
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'h-4 w-4',
            hasReacted && 'fill-red-500'
          )}
          style={hasReacted ? { color: '#ef4444', fill: '#ef4444' } : undefined}
        />
      )}
      {showCount && stats && stats.likes > 0 && (
        <span 
          className="text-xs font-medium"
          style={hasReacted ? { color: '#ef4444' } : undefined}
        >{stats.likes}</span>
      )}
    </Button>
  );
}
