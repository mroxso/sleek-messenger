import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { resolveNostrIdentifier } from '@/lib/resolveNostrIdentifier';

export function NewChatDialog() {
  const [open, setOpen] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { nostr } = useNostr();

  const handleStartChat = async () => {
    if (!identifier.trim()) {
      setError('Please enter a valid identifier');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the utility function to resolve the identifier
      const queryWrapper = async (filter: any) => {
        const signal = AbortSignal.timeout(3000);
        return await nostr.query([filter], { signal });
      };
      
      const { pubkey, error: resolveError } = await resolveNostrIdentifier(
        identifier.trim(),
        queryWrapper
      );

      // If we have a pubkey, navigate to the chat
      if (pubkey) {
        // If there was a warning but still succeeded, log it
        if (resolveError) {
          console.warn(resolveError);
        }
        setOpen(false);
        navigate(`/chat/${pubkey}`);
      } else {
        setError(resolveError || 'Could not resolve identifier to a valid Nostr pubkey');
      }
    } catch (e) {
      console.error('Error starting chat:', e);
      setError(`An error occurred: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="default"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-9 w-9"
        title="Start new chat"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Chat</DialogTitle>
            <DialogDescription>
              Start a new chat by entering a Nostr identifier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Enter username, npub, public key, or NIP-05 address</Label>
              <Input
                id="identifier"
                placeholder="username, npub1..., 3ab..., name@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full"
              />
              {error && (
                <p className="text-sm text-destructive mt-1">{error}</p>
              )}
            </div>

            {/* <div className="text-sm text-muted-foreground">
              <p>Examples:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Username: jack</li>
                <li>npub: npub1sn0wdenkukak0d9dfczzeacvhkrgz92ak56egt7vdgzn8pv2wfqqhrjdv9</li>
                <li>Hex: 3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d</li>
                <li>NIP-05: jack@cash.app</li>
              </ul>
            </div> */}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleStartChat} disabled={isLoading || !identifier.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span>Looking up...</span>
                </>
              ) : (
                <span>Start Chat</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}