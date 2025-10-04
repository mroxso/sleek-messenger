import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useSeenMessages } from '@/hooks/useSeenMessages';
import { useToast } from '@/hooks/useToast';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { MessageCircle, MoreVertical, CheckCheck } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ChatList } from '@/components/ChatList';
import { NewChatDialog } from '@/components/NewChatDialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { markAllAsRead } = useSeenMessages();
  const { toast } = useToast();

  // Query to get all contact pubkeys for mark all as read
  const { data: contactPubkeys = [] } = useQuery({
    queryKey: ['all-contact-pubkeys'],
    queryFn: async (c) => {
      if (!user) return [];
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      const events = await nostr.query([
        { kinds: [4], authors: [user.pubkey], limit: 100 },
        { kinds: [4], '#p': [user.pubkey], limit: 100 },
        { kinds: [1059], '#p': [user.pubkey], limit: 100 },
      ], { signal });

      const contacts = new Set<string>();
      events.forEach(event => {
        if (event.kind === 4) {
          const contactPubkey = event.pubkey === user.pubkey
            ? event.tags.find(tag => tag[0] === 'p')?.[1]
            : event.pubkey;
          if (contactPubkey && contactPubkey !== user.pubkey) {
            contacts.add(contactPubkey);
          }
        } else if (event.kind === 1059 && event.pubkey !== user.pubkey) {
          contacts.add(event.pubkey);
        }
      });

      return Array.from(contacts);
    },
    enabled: !!user,
  });

  const handleMarkAllAsRead = () => {
    if (contactPubkeys.length === 0) {
      toast({
        description: 'No chats to mark as read',
      });
      return;
    }

    markAllAsRead.mutate(contactPubkeys, {
      onSuccess: () => {
        toast({
          description: 'All chats marked as read',
        });
      },
    });
  };

  useSeoMeta({
    title: 'Chats - Sleek',
    description: 'A modern Nostr messaging application built with React, TailwindCSS, and Nostrify.',
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <MessageCircle className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome to Sleek
            </h1>
            <p className="text-muted-foreground">
              Connect with friends on the Nostr network
            </p>
          </div>
          <LoginArea className="w-full" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b border-border">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-foreground">Chats</h1>
            <div className="flex items-center space-x-2">
              <NewChatDialog />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsRead.isPending}
                  >
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Mark All as Read
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Chat List */}
        <ChatList />
      </div>

      <BottomNavigation />
    </>
  );
};

export default Index;
