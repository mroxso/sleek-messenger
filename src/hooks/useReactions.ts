import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

export interface ReactionStats {
  total: number;
  likes: number;
  dislikes: number;
  emojis: Map<string, number>;
  userReaction?: NostrEvent;
  hasUserLiked: boolean;
  hasUserDisliked: boolean;
}

/**
 * Hook to query reactions (kind 7) for a given event
 * @param eventId - The ID of the event to get reactions for
 * @param eventPubkey - The pubkey of the event author (for p tag)
 * @param enabled - Whether to enable the query (default: true)
 */
export function useReactions(eventId: string, eventPubkey: string, enabled = true) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['reactions', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Query all reactions for this event
      const reactions = await nostr.query(
        [{ kinds: [7], '#e': [eventId] }],
        { signal }
      );

      // Calculate stats
      const stats: ReactionStats = {
        total: reactions.length,
        likes: 0,
        dislikes: 0,
        emojis: new Map(),
        hasUserLiked: false,
        hasUserDisliked: false,
      };

      for (const reaction of reactions) {
        const content = reaction.content.trim();
        
        // Check if this is the user's reaction
        if (user && reaction.pubkey === user.pubkey) {
          stats.userReaction = reaction;
          
          if (content === '-') {
            stats.hasUserDisliked = true;
          } else {
            // Everything except "-" is a like
            stats.hasUserLiked = true;
          }
        }

        // Count reaction types
        if (content === '-') {
          stats.dislikes++;
        } else {
          // Everything except "-" is a like
          stats.likes++;
          
          // Also track emoji counts for non-empty content that isn't "+"
          if (content !== '' && content !== '+') {
            const count = stats.emojis.get(content) || 0;
            stats.emojis.set(content, count + 1);
          }
        }
      }

      return stats;
    },
    enabled: enabled && !!eventId && !!eventPubkey,
  });
}
