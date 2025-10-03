import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import { useDecryptMessage } from './useDecryptMessage';

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: number;
  isFromMe: boolean;
  isEncrypted: boolean;
  event: NostrEvent;
  decryptedContent?: string;
}

export function useChat(contactPubkey: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Query chat messages between current user and contact
  const { data: messages = [], isLoading, refetch } = useQuery({
    queryKey: ['chat-messages', user?.pubkey, contactPubkey],
    queryFn: async (c) => {
      if (!user) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      
      // Get all messages between the two users
      const events = await nostr.query([
        // Messages sent by me to the contact
        { 
          kinds: [4, 1059, 6], // Include kind 6 for reposts
          authors: [user.pubkey], 
          '#p': [contactPubkey], 
          limit: 100 
        },
        // Messages sent by the contact to me
        { 
          kinds: [4, 1059, 6], // Include kind 6 for reposts
          authors: [contactPubkey], 
          '#p': [user.pubkey], 
          limit: 100 
        }
      ], { signal });

      // Sort by timestamp
      const sortedEvents = events.sort((a, b) => a.created_at - b.created_at);

      // Convert to ChatMessage format
      const chatMessages: ChatMessage[] = sortedEvents.map(event => ({
        id: event.id,
        content: event.content,
        timestamp: event.created_at,
        isFromMe: event.pubkey === user.pubkey,
        isEncrypted: event.kind === 4 || event.kind === 1059,
        event
      }));

      return chatMessages;
    },
    enabled: !!user && !!contactPubkey,
    refetchOnWindowFocus: false,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
  });

  // Mutation for sending messages
  const sendMessage = useMutation({
    mutationFn: async ({ content, isPlainText = false }: { content: string; isPlainText?: boolean }) => {
      if (!user?.signer) {
        throw new Error('User not authenticated');
      }

      let messageContent = content;
      let kind = 1; // Default to public note

      if (!isPlainText) {
        // Encrypt the message using NIP-04
        if (!user.signer.nip04) {
          throw new Error('Signer does not support NIP-04 encryption');
        }
        
        try {
          messageContent = await user.signer.nip04.encrypt(contactPubkey, content);
          kind = 4; // Encrypted direct message
        } catch (error) {
          console.error('Failed to encrypt message:', error);
          throw new Error('Failed to encrypt message');
        }
      }

      // Create the event
      const event = await user.signer.signEvent({
        kind,
        content: messageContent,
        tags: [['p', contactPubkey]],
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish the event
      await nostr.event(event);

      return event;
    },
    onSuccess: () => {
      // Refetch messages after sending
      queryClient.invalidateQueries({ 
        queryKey: ['chat-messages', user?.pubkey, contactPubkey] 
      });
      // Also invalidate recent contacts to update the chat list
      queryClient.invalidateQueries({ 
        queryKey: ['recent-contacts'] 
      });
    },
  });

  return {
    messages,
    isLoading,
    sendMessage,
    refetch,
    isAuthenticated: !!user,
  };
}

// Hook for decrypting a single chat message
export function useChatMessageDecryption(message: ChatMessage, contactPubkey: string) {
  const { data: decryptedContent, isLoading } = useDecryptMessage(
    message.event, 
    contactPubkey
  );

  return {
    decryptedContent: message.isEncrypted ? decryptedContent : message.content,
    isDecrypting: isLoading,
  };
}