import { MessageCircle, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { genUserName } from '@/lib/genUserName';
import { useAuthor } from '@/hooks/useAuthor';
import { cn } from '@/lib/utils';

export function BottomNavigation() {
  const location = useLocation();
  const { user } = useCurrentUser();
  const author = useAuthor(user?.pubkey || '');
  const metadata = author.data?.metadata;
  
  if (!user) {
    return null;
  }

  const displayName = metadata?.display_name || metadata?.name || genUserName(user.pubkey);

  const navItems = [
    {
      to: '/',
      icon: MessageCircle,
      label: 'Chats',
      isActive: location.pathname === '/',
    },
    {
      to: '/profile',
      icon: null,
      label: 'Profile',
      isActive: location.pathname === '/profile',
      isProfile: true,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-4 max-w-md mx-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors",
              "min-w-0 flex-1",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="mb-1">
              {item.isProfile ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={metadata?.picture} alt={displayName} />
                  <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ) : item.icon ? (
                <item.icon className="h-6 w-6" />
              ) : null}
            </div>
            <span className="text-xs font-medium truncate max-w-full">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}