import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MessageCircle } from 'lucide-react';
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
      <>
        <div className="min-h-screen bg-background flex items-center justify-center p-4 pb-24">
          <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
              <MessageCircle className="h-20 w-20 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Welcome to Sleek
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
                Private, encrypted messaging built on the decentralized Nostr protocol. 
                Own your conversations, own your data.
              </p>
              
              {/* Key Features */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 text-left">
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    🔒 End-to-End Encrypted
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Your messages are completely private and secure
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    🌐 Truly Decentralized
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    No central authority, no single point of failure
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2 text-sm md:text-base">
                    🔑 You Own Your Identity
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Your keys, your account, your control
                  </p>
                </div>
              </div>

              {/* Login Area */}
              <div className="max-w-md mx-auto">
                <LoginArea className="w-full" />
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                New to Nostr?{' '}
                <a target='_blank' href="https://nostr.how" className="text-primary hover:underline">
                  Learn more about the protocol
                </a>
              </p>
            </div>
          </div>
        </div>
        <BottomNavigation />
      </>
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
