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
  encryptionType?: 'nip04' | 'nip17'; // Track which encryption standard is used
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
        encryptionType: event.kind === 1059 ? 'nip17' : event.kind === 4 ? 'nip04' : undefined,
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

      if (isPlainText) {
        // Send as public note
        const event = await user.signer.signEvent({
          kind: 1,
          content,
          tags: [['p', contactPubkey]],
          created_at: Math.floor(Date.now() / 1000),
        });
        await nostr.event(event);
        return event;
      }

      // Use NIP-17 for encrypted messages by default
      if (!user.signer.nip44) {
        throw new Error('Signer does not support NIP-44 encryption (required for NIP-17)');
      }

      try {
        // Step 1: Create the unsigned kind 14 message
        const kind14Message = {
          kind: 14,
          content,
          tags: [['p', contactPubkey]],
          created_at: Math.floor(Date.now() / 1000),
          pubkey: user.pubkey,
        };

        // Step 2: Encrypt the kind 14 message and create a kind 13 seal (signed by sender)
        const encryptedContent = await user.signer.nip44.encrypt(contactPubkey, JSON.stringify(kind14Message));
        const seal = await user.signer.signEvent({
          kind: 13,
          content: encryptedContent,
          tags: [],
          created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Randomize up to 2 days in the past
        });

        // Step 3: Create gift wraps for both receiver and sender
        const { generateSecretKey, finalizeEvent } = await import('nostr-tools');
        
        // Generate a random keypair for the gift wrap
        const randomKey = generateSecretKey();

        // Encrypt the seal for the receiver
        const giftWrapContentForReceiver = await user.signer.nip44.encrypt(contactPubkey, JSON.stringify(seal));
        const giftWrapForReceiver = finalizeEvent({
          kind: 1059,
          content: giftWrapContentForReceiver,
          tags: [['p', contactPubkey]],
          created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Randomize up to 2 days in the past
        }, randomKey);

        // Encrypt the seal for the sender (ourselves) so we can see our own messages
        const giftWrapContentForSender = await user.signer.nip44.encrypt(user.pubkey, JSON.stringify(seal));
        const giftWrapForSender = finalizeEvent({
          kind: 1059,
          content: giftWrapContentForSender,
          tags: [['p', user.pubkey]],
          created_at: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 172800), // Randomize up to 2 days in the past
        }, randomKey);

        // Step 4: Publish both gift wraps
        await Promise.all([
          nostr.event(giftWrapForReceiver),
          nostr.event(giftWrapForSender),
        ]);

        // Return the gift wrap sent to the receiver as the "event"
        return giftWrapForReceiver;
      } catch (error) {
        console.error('Failed to send NIP-17 message:', error);
        throw new Error('Failed to send encrypted message');
      }
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