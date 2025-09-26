import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useIsMobile } from '@/hooks/useIsMobile';
import { genUserName } from '@/lib/genUserName';
import { ChatView } from '@/components/ChatView';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { Card, CardContent } from '@/components/ui/card';
import { RelaySelector } from '@/components/RelaySelector';
import { useEffect } from 'react';

const ChatPage = () => {
  const { pubkey } = useParams<{ pubkey: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const author = useAuthor(pubkey || '');
  const isMobile = useIsMobile();
  
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey || '');

  useSeoMeta({
    title: `Chat with ${displayName} - Sleek`,
    description: `Private encrypted chat with ${displayName} on Nostr`,
  });

  // Redirect if no pubkey provided
  useEffect(() => {
    if (!pubkey) {
      navigate('/', { replace: true });
    }
  }, [pubkey, navigate]);

  // Don't render anything if no pubkey
  if (!pubkey) {
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Sign in to chat
            </h1>
            <p className="text-muted-foreground">
              Connect your Nostr account to start messaging
            </p>
          </div>
          <LoginArea className="w-full" />
        </div>
      </div>
    );
  }

  if (isMobile) {
    // Mobile layout: Full screen chat with header
    return (
      <div className="min-h-screen bg-background flex flex-col pb-20">
        {/* Mobile Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              <Avatar className="h-8 w-8">
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-foreground truncate">
                  {displayName}
                </h1>
                {metadata?.nip05 && (
                  <p className="text-xs text-muted-foreground truncate">
                    {metadata.nip05}
                  </p>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1">
          <ChatView contactPubkey={pubkey} />
        </div>
      </div>
    );
  }

  // Desktop layout: Split view with sidebar space
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left sidebar placeholder (1/3 width) */}
      <div className="w-1/3 border-r border-border bg-muted/20">
        <div className="sticky top-0 bg-background border-b border-border p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Chats</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
            >
              Back to List
            </Button>
          </div>
        </div>
        
        <div className="p-4">
          <Card className="border-dashed">
            <CardContent className="py-8 px-6 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <p className="text-sm text-muted-foreground">
                  Chat overview will be displayed here in a future update
                </p>
                <RelaySelector className="w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right chat area (2/3 width) */}
      <div className="flex-1 flex flex-col">
        {/* Desktop Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <h1 className="font-semibold text-foreground">
                  {displayName}
                </h1>
                {metadata?.nip05 && (
                  <p className="text-sm text-muted-foreground">
                    {metadata.nip05}
                  </p>
                )}
              </div>
            </div>
            
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat Content */}
        <div className="flex-1">
          <ChatView contactPubkey={pubkey} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;