import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, Globe, Mail, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { nip19 } from 'nostr-tools';

interface PublicProfileProps {
  pubkey: string;
}

export function PublicProfile({ pubkey }: PublicProfileProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(pubkey);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copiedNpub, setCopiedNpub] = useState(false);

  const metadata = author.data?.metadata;
  const displayName = metadata?.display_name || metadata?.name || genUserName(pubkey);
  const npub = nip19.npubEncode(pubkey);

  const handleStartChat = () => {
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to start a conversation',
        variant: 'destructive'
      });
      return;
    }
    navigate(`/chat/${pubkey}`);
  };

  const handleCopyNpub = async () => {
    try {
      await navigator.clipboard.writeText(npub);
      setCopiedNpub(true);
      toast({ title: 'Copied to clipboard!' });
      setTimeout(() => setCopiedNpub(false), 2000);
    } catch {
      toast({
        title: 'Failed to copy',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };

  if (author.isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Skeleton className="h-24 w-24 rounded-full mx-auto" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isOwnProfile = user?.pubkey === pubkey;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 mx-auto">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Name and NIP-05 */}
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {displayName}
              </h1>
              {metadata?.nip05 && (
                <Badge variant="secondary" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  {metadata.nip05}
                </Badge>
              )}
            </div>

            {/* About */}
            {metadata?.about && (
              <p className="text-muted-foreground max-w-md mx-auto">
                {metadata.about}
              </p>
            )}

            {/* Links */}
            {metadata?.website && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <a
                  href={metadata.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-foreground"
                >
                  {metadata.website.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}

            {/* Lightning Address */}
            {(metadata?.lud16 || metadata?.lud06) && (
              <div className="flex items-center justify-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ⚡ {metadata.lud16 || metadata.lud06}
                </Badge>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {!isOwnProfile && (
                <Button
                  onClick={handleStartChat}
                  className="w-full flex items-center gap-2"
                  size="lg"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Send Message</span>
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleCopyNpub}
                className="w-full flex items-center gap-2"
              >
                {copiedNpub ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Public Key</span>
                  </>
                )}
              </Button>

              {isOwnProfile && (
                <Button
                  variant="secondary"
                  onClick={() => navigate('/profile/edit')}
                  className="w-full"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {/* Public Key Display */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Public Key</p>
              <code className="text-xs bg-muted px-3 py-2 rounded-md break-all block">
                {npub}
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
