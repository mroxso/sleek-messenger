import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MessageCircle, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { BottomNavigation } from '@/components/BottomNavigation';
import { ChatList } from '@/components/ChatList';
import { NewChatDialog } from '@/components/NewChatDialog';

const Index = () => {
  const { user } = useCurrentUser();

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
              {/* <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreVertical className="h-5 w-5" />
              </Button> */}
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
