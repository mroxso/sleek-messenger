import { useSeoMeta } from '@unhead/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Edit2,
  LogOut,
  Globe,
  Mail,
  Zap,
  Copy,
  Check
} from 'lucide-react';
import { genUserName } from '@/lib/genUserName';
import { RelaySelector } from '@/components/RelaySelector';
import { useLoginActions } from '@/hooks/useLoginActions';
import { nip19 } from 'nostr-tools';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { EditProfileForm } from '@/components/EditProfileForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BottomNavigation } from '@/components/BottomNavigation';

export default function Profile() {
  const { user } = useCurrentUser();
  const { logout } = useLoginActions();
  const author = useAuthor(user?.pubkey || '');
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [copiedNpub, setCopiedNpub] = useState(false);
  const { toast } = useToast();

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(user?.pubkey || '');
  const npub = user?.pubkey ? nip19.npubEncode(user.pubkey) : '';

  useSeoMeta({
    title: 'Profile - Sleek',
    description: 'Your Nostr profile and settings',
  });

  const handleCopyNpub = async () => {
    if (!npub) return;

    try {
      await navigator.clipboard.writeText(npub);
      setCopiedNpub(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopiedNpub(false), 2000);
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  const handleLogout = () => {
    logout();
    toast({ title: 'Logged out successfully' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Not logged in</h2>
          <p className="text-muted-foreground">Please log in to view your profile</p>
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
            <h1 className="text-xl font-semibold text-foreground">Profile</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditProfileOpen(true)}
              className="h-9 w-9"
            >
              <Edit2 className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={metadata?.picture} alt={displayName} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <h2 className="text-2xl font-bold text-foreground">{displayName}</h2>
                  {metadata?.name && metadata?.display_name && (
                    <p className="text-muted-foreground">@{metadata.name}</p>
                  )}
                </div>

                {metadata?.about && (
                  <p className="text-muted-foreground text-center leading-relaxed">
                    {metadata.about}
                  </p>
                )}

                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="secondary" className="text-xs font-mono">
                    {npub.slice(0, 16)}...
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyNpub}
                    className="h-8 w-8 p-0"
                  >
                    {copiedNpub ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {(metadata?.website || metadata?.nip05 || metadata?.lud16) && (
                  <div className="flex flex-wrap justify-center gap-4 pt-2">
                    {metadata?.website && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Globe className="h-4 w-4" />
                        <span className="truncate max-w-48">{metadata.website}</span>
                      </div>
                    )}
                    {metadata?.nip05 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate max-w-48">{metadata.nip05}</span>
                      </div>
                    )}
                    {metadata?.lud16 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="h-4 w-4" />
                        <span className="truncate max-w-48">{metadata.lud16}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setEditProfileOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-3" />
              Edit Profile
            </Button>

            <Button variant="outline" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-3" />
              Log Out
            </Button>
            
            {/* Relay Selector */}
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-2">Relay</h3>
              <RelaySelector className="w-full" />
            </div>
          </div>
        </div>

        {/* Edit Profile Dialog */}
        <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <EditProfileForm />
          </DialogContent>
        </Dialog>
      </div>

      <BottomNavigation />
    </>
  );
}