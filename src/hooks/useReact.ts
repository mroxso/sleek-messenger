import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAppContext } from '@/hooks/useAppContext';

interface ReactParams {
  eventId: string;
  eventPubkey: string;
  eventKind: number;
  content: string; // '+' for like, '-' for dislike, or emoji
  relayHint?: string;
  /** For addressable events (kind 30000-39999), the d-tag identifier */
  dTag?: string;
}

interface UnreactParams {
  eventId: string;
  reactionEventId: string;
}

/**
 * Hook to publish reactions (kind 7) and delete reactions (kind 5)
 */
export function useReact() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { config } = useAppContext();
  const queryClient = useQueryClient();

  const react = useMutation({
    mutationFn: async ({ eventId, eventPubkey, eventKind, content, relayHint, dTag }: ReactParams) => {
      if (!user) {
        throw new Error('User must be logged in to react');
      }

      const tags: string[][] = [
        ['e', eventId, relayHint || config.relayUrl, eventPubkey],
        ['p', eventPubkey, relayHint || config.relayUrl],
        ['k', String(eventKind)],
      ];

      // If it's an addressable event, add the 'a' tag
      if (eventKind >= 30000 && eventKind < 40000 && dTag !== undefined) {
        tags.push(['a', `${eventKind}:${eventPubkey}:${dTag}`, relayHint || config.relayUrl, eventPubkey]);
      }

      const event = await user.signer.signEvent({
        kind: 7,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);
      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate reactions query to refetch
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.eventId] });
    },
  });

  const unreact = useMutation({
    mutationFn: async ({ reactionEventId }: UnreactParams) => {
      if (!user) {
        throw new Error('User must be logged in to unreact');
      }

      // Publish a kind 5 deletion event
      const event = await user.signer.signEvent({
        kind: 5,
        content: 'Removed reaction',
        tags: [
          ['e', reactionEventId],
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event);
      return event;
    },
    onSuccess: (_, variables) => {
      // Invalidate reactions query to refetch
      queryClient.invalidateQueries({ queryKey: ['reactions', variables.eventId] });
    },
  });

  return {
    react,
    unreact,
  };
}
