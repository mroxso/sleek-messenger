import { useParams, useNavigate } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useIsMobile } from '@/hooks/useIsMobile';
import { genUserName } from '@/lib/genUserName';
import { ChatView } from '@/components/ChatView';
import { ChatList } from '@/components/ChatList';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, MoreVertical, User } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { RelaySelector } from '@/components/RelaySelector';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { useEffect } from 'react';
import { nip19 } from 'nostr-tools';

const ChatPage = () => {
  const { pubkey: pubkeyParam } = useParams<{ pubkey: string }>();
  const navigate = useNavigate();
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  
  // Decode NIP-19 identifier if needed (support both hex pubkey and npub)
  let pubkey = '';
  let npub = '';
  let isInvalid = false;
  
  if (pubkeyParam) {
    if (pubkeyParam.startsWith('npub1')) {
      // Decode npub to hex pubkey
      try {
        const decoded = nip19.decode(pubkeyParam);
        if (decoded.type === 'npub') {
          pubkey = decoded.data;
          npub = pubkeyParam;
        } else {
          // Invalid identifier type
          isInvalid = true;
        }
      } catch {
        // Invalid npub format
        isInvalid = true;
      }
    } else {
      // Assume it's a hex pubkey
      pubkey = pubkeyParam;
      try {
        npub = nip19.npubEncode(pubkey);
      } catch {
        // Invalid hex pubkey
        isInvalid = true;
      }
    }
  }
  
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);

  const handleViewProfile = () => {
    if (npub) {
      navigate(`/${npub}`);
    }
  };

  useSeoMeta({
    title: `Chat with ${displayName} - Sleek`,
    description: `Private encrypted chat with ${displayName} on Nostr`,
  });

  // Redirect if invalid or no pubkey provided
  useEffect(() => {
    if (!pubkeyParam || isInvalid) {
      navigate('/', { replace: true });
    }
  }, [pubkeyParam, isInvalid, navigate]);

  // Don't render anything if no pubkey or invalid
  if (!pubkey || isInvalid) {
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
      <div className="h-screen bg-background flex flex-col">
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewProfile}>
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Chat Content - Take remaining height */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatView contactPubkey={pubkey} />
        </div>
      </div>
    );
  }

  // Desktop layout: Split view with resizable panels
  return (
    <div className="h-screen bg-background overflow-hidden">
      <ResizablePanelGroup direction="horizontal">
        {/* Left sidebar with chat list */}
        <ResizablePanel defaultSize={33} minSize={25} maxSize={50}>
          <div className="bg-muted/20 flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background border-b border-border p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Chats</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/')}
                >
                  Back
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <ChatList activeChatPubkey={pubkey} />
            </div>
            
            <div className="p-3 border-t border-border sticky bottom-0 bg-background">
              <RelaySelector className="w-full" />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right chat area */}
        <ResizablePanel defaultSize={67} minSize={50}>
          <div className="flex flex-col h-full">
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
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleViewProfile}>
                      <User className="h-4 w-4 mr-2" />
                      View Profile
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Chat Content */}
            <div className="flex-1 overflow-hidden">
              <ChatView contactPubkey={pubkey} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default ChatPage;