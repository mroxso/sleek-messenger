import { useState, useRef, useEffect } from 'react';
import { useChat, useChatMessageDecryption, type ChatMessage } from '@/hooks/useChat';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';
import { Send, Lock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: ChatMessage;
  contactPubkey: string;
  contactDisplayName: string;
  contactPicture?: string;
}

function MessageBubble({ message, contactPubkey, contactDisplayName, contactPicture }: MessageBubbleProps) {
  const { decryptedContent, isDecrypting } = useChatMessageDecryption(message, contactPubkey);

  return (
    <div className={cn(
      "flex gap-3 max-w-[85%]",
      message.isFromMe ? "ml-auto flex-row-reverse" : "mr-auto"
    )}>
      {/* Avatar */}
      {!message.isFromMe && (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage src={contactPicture} alt={contactDisplayName} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
            {contactDisplayName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div className={cn(
        "rounded-2xl px-4 py-2 break-words",
        message.isFromMe 
          ? "bg-primary text-primary-foreground rounded-br-md"
          : "bg-muted rounded-bl-md"
      )}>
        <div className="flex items-center gap-2 mb-1">
          {message.isEncrypted && (
            <Lock className="h-3 w-3 opacity-70" />
          )}
          {isDecrypting && (
            <Loader2 className="h-3 w-3 animate-spin opacity-70" />
          )}
        </div>
        
        <p className="text-sm">
          {isDecrypting ? (
            <span className="animate-pulse opacity-70">Decrypting...</span>
          ) : (
            decryptedContent || 'Failed to decrypt message'
          )}
        </p>

        <p className={cn(
          "text-xs opacity-70 mt-1",
          message.isFromMe ? "text-right" : "text-left"
        )}>
          {new Date(message.timestamp * 1000).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </p>
      </div>
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={cn(
          "flex gap-3 max-w-[85%]",
          i % 3 === 0 ? "ml-auto flex-row-reverse" : "mr-auto"
        )}>
          {i % 3 !== 0 && (
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
          )}
          <div className="space-y-2">
            <Skeleton className="h-16 w-48 rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface ChatViewProps {
  contactPubkey: string;
}

export function ChatView({ contactPubkey }: ChatViewProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(contactPubkey);
  const { messages, isLoading, sendMessage, isAuthenticated } = useChat(contactPubkey);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(contactPubkey);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !isAuthenticated) return;

    try {
      await sendMessage.mutateAsync({ 
        content: inputMessage.trim(),
        isPlainText: false // Always encrypt messages
      });
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            You must be signed in to chat
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <MessagesSkeleton />;
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-sm space-y-4">
            <Avatar className="h-16 w-16 mx-auto">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h3 className="font-medium text-foreground mb-2">
                Start chatting with {displayName}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Your messages will be encrypted end-to-end using Nostr's NIP-04 protocol
              </p>
            </div>

            <RelaySelector className="w-full" />
          </div>
        </div>

        {/* Message input */}
        <div className="border-t border-border bg-background p-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Message ${displayName}...`}
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              type="submit"
              size="icon"
              disabled={!inputMessage.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              contactPubkey={contactPubkey}
              contactDisplayName={displayName}
              contactPicture={metadata?.picture}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message input */}
      <div className="border-t border-border bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${displayName}...`}
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputMessage.trim() || sendMessage.isPending}
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}