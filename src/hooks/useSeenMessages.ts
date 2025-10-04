import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Hook to manage seen/read state for messages using NIP-78.
 * Stores last seen timestamp per contact in kind 30078 addressable events.
 */
export function useSeenMessages() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Query all seen message data for the current user
  const { data: seenData = {}, isLoading } = useQuery({
    queryKey: ['seen-messages', user?.pubkey],
    queryFn: async (c) => {
      if (!user) return {};
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Get all seen message events for this user
      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [user.pubkey],
          '#d': ['sleek-messenger:seen'],
          limit: 1
        }
      ], { signal });

      if (events.length === 0) {
        return {};
      }

      // Parse the most recent event (should only be one due to replaceable nature)
      const latestEvent = events.sort((a, b) => b.created_at - a.created_at)[0];
      
      try {
        const data = JSON.parse(latestEvent.content);
        return data as Record<string, number>; // { [contactPubkey]: lastSeenTimestamp }
      } catch (error) {
        console.error('Failed to parse seen data:', error);
        return {};
      }
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  // Mutation to mark a chat as read
  const markChatAsRead = useMutation({
    mutationFn: async ({ contactPubkey, timestamp }: { contactPubkey: string; timestamp?: number }) => {
      if (!user?.signer) {
        throw new Error('User not authenticated');
      }

      const now = timestamp || Math.floor(Date.now() / 1000);
      
      // Update the seen data with the new timestamp
      const updatedData = {
        ...seenData,
        [contactPubkey]: now
      };

      // Create a NIP-78 event to store the seen data
      const event = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(updatedData),
        tags: [
          ['d', 'sleek-messenger:seen'],
          ['alt', 'Sleek Messenger: Last seen message timestamps']
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish the event
      await nostr.event(event);

      return { contactPubkey, timestamp: now };
    },
    onSuccess: () => {
      // Invalidate the query to refetch seen data
      queryClient.invalidateQueries({ 
        queryKey: ['seen-messages', user?.pubkey] 
      });
    },
  });

  // Mutation to mark all chats as read
  const markAllAsRead = useMutation({
    mutationFn: async (contactPubkeys: string[]) => {
      if (!user?.signer) {
        throw new Error('User not authenticated');
      }

      const now = Math.floor(Date.now() / 1000);
      
      // Update all contact timestamps to now
      const updatedData: Record<string, number> = { ...seenData };
      contactPubkeys.forEach(pubkey => {
        updatedData[pubkey] = now;
      });

      // Create a NIP-78 event to store the seen data
      const event = await user.signer.signEvent({
        kind: 30078,
        content: JSON.stringify(updatedData),
        tags: [
          ['d', 'sleek-messenger:seen'],
          ['alt', 'Sleek Messenger: Last seen message timestamps']
        ],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish the event
      await nostr.event(event);

      return updatedData;
    },
    onSuccess: () => {
      // Invalidate the query to refetch seen data
      queryClient.invalidateQueries({ 
        queryKey: ['seen-messages', user?.pubkey] 
      });
    },
  });

  // Helper function to get last seen timestamp for a contact
  const getLastSeen = (contactPubkey: string): number | undefined => {
    return seenData[contactPubkey];
  };

  // Helper function to check if there are unread messages
  const hasUnreadMessages = (contactPubkey: string, lastMessageTimestamp: number): boolean => {
    const lastSeen = getLastSeen(contactPubkey);
    if (!lastSeen) return true; // Never seen = unread
    return lastMessageTimestamp > lastSeen;
  };

  // Helper function to count unread messages
  const getUnreadCount = (contactPubkey: string, messages: NostrEvent[]): number => {
    const lastSeen = getLastSeen(contactPubkey);
    if (!lastSeen) return messages.length;
    
    return messages.filter(msg => msg.created_at > lastSeen).length;
  };

  return {
    seenData,
    isLoading,
    markChatAsRead,
    markAllAsRead,
    getLastSeen,
    hasUnreadMessages,
    getUnreadCount,
  };
}
