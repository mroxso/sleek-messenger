import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from './useCurrentUser';
import type { NostrEvent } from '@nostrify/nostrify';
import type { NUser } from '@nostrify/react/login';

export function useDecryptMessage(event: NostrEvent | undefined, recipientPubkey?: string) {
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['decrypt-message', event?.id, user?.pubkey],
    queryFn: async (): Promise<string> => {
      if (!event || !user?.signer) {
        return event?.content || '';
      }

      // Handle different message types
      if (event.kind === 4) {
        // NIP-04 legacy encrypted direct message
        return await decryptNIP04Message(event, user, recipientPubkey);
      } else if (event.kind === 1059) {
        // NIP-17 gift wrap
        return await decryptNIP17GiftWrap(event, user);
      } else {
        // Plain text message
        return event.content;
      }
    },
    enabled: !!event && !!user?.signer,
    staleTime: Infinity, // Decrypted messages don't change
    gcTime: Infinity, // Keep in cache indefinitely
  });
}

async function decryptNIP04Message(
  event: NostrEvent, 
  user: NUser, 
  recipientPubkey?: string
): Promise<string> {
  try {
    // Determine who we're decrypting with
    let otherPubkey: string;
    
    if (event.pubkey === user.pubkey) {
      // We sent this message, decrypt with recipient
      const pTag = event.tags.find(tag => tag[0] === 'p');
      if (!pTag?.[1]) {
        throw new Error('No recipient found in message tags');
      }
      otherPubkey = pTag[1];
    } else {
      // We received this message, decrypt with sender
      otherPubkey = event.pubkey;
    }

    // Use recipient override if provided (for chat previews where we know the contact)
    if (recipientPubkey) {
      otherPubkey = recipientPubkey;
    }

    // Try NIP-44 decryption first (modern standard)
    if (user.signer.nip44) {
      try {
        const decrypted = await user.signer.nip44.decrypt(otherPubkey, event.content);
        return decrypted;
      } catch (nip44Error) {
        // If NIP-44 fails, it might be a NIP-04 message
        console.debug('NIP-44 decryption failed, trying NIP-04 fallback:', nip44Error);
      }
    }

    // Fallback to NIP-04 for legacy messages
    if (user.signer.nip04) {
      try {
        const decrypted = await user.signer.nip04.decrypt(otherPubkey, event.content);
        return decrypted;
      } catch (nip04Error) {
        console.debug('NIP-04 decryption also failed:', nip04Error);
      }
    }

    // If both methods fail, return a user-friendly message
    console.warn('Unable to decrypt NIP-04 message - no supported decryption methods available');
    return '[Encrypted message]';

  } catch (error) {
    console.error('Failed to decrypt NIP-04 message:', error);
    return '[Encrypted message]';
  }
}

async function decryptNIP17GiftWrap(event: NostrEvent, user: NUser): Promise<string> {
  try {
    // NIP-17 gift wraps require decrypting with our own private key
    // The gift wrap is encrypted to us, and contains a seal inside
    if (!user.signer.nip44) {
      console.warn('NIP-44 encryption not supported by signer, cannot decrypt NIP-17 gift wrap');
      return '[Encrypted message - NIP-44 required]';
    }

    // For NIP-17, the gift wrap is encrypted to the recipient (us)
    // We decrypt using the random pubkey from the gift wrap
    const giftWrapContent = await user.signer.nip44.decrypt(event.pubkey, event.content);
    
    // Parse the decrypted content as a JSON seal
    const seal = JSON.parse(giftWrapContent);
    
    // The seal contains the actual message, encrypted from sender to receiver
    if (seal.kind === 13 && seal.content) {
      // Decrypt the seal content with the actual sender's pubkey
      const messageContent = await user.signer.nip44.decrypt(seal.pubkey, seal.content);
      
      // Parse the final message
      const actualMessage = JSON.parse(messageContent);
      
      // Return the actual message content
      return actualMessage.content || '[Empty message]';
    }

    return '[Invalid NIP-17 structure]';
  } catch (error) {
    console.error('Failed to decrypt NIP-17 gift wrap:', error);
    return '[Encrypted message]';
  }
}