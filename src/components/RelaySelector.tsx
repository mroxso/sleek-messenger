import { Check, ChevronsUpDown, Wifi, Plus, Settings, Eye, PenLine, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { useAppContext } from "@/hooks/useAppContext";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNip65Relays, RelayInfo } from "@/hooks/useNip65Relays";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { Checkbox } from "@/components/ui/checkbox";

interface RelaySelectorProps {
  className?: string;
}

export function RelaySelector(props: RelaySelectorProps) {
  const { className } = props;
  const { config, updateConfig, presetRelays = [] } = useAppContext();
  const { user } = useCurrentUser();
  const { relays, addRelay, updateRelay, removeRelay, isLoading, publishRelays, isPublishing } = useNip65Relays();
  const { toast } = useToast();
  
  const selectedRelay = config.relayUrl;
  const setSelectedRelay = (relay: string) => {
    updateConfig((current) => ({ ...current, relayUrl: relay }));
  };

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [editingRelay, setEditingRelay] = useState<RelayInfo | null>(null);
  const [newRelay, setNewRelay] = useState<{url: string, read: boolean, write: boolean}>({
    url: "",
    read: true,
    write: true
  });

  // Determine if the user has NIP-65 relays
  const hasNip65Relays = user && relays && relays.length > 0;
  
  // Selected relay option (from preset or custom)
  const selectedOption = presetRelays.find((option) => option.url === selectedRelay);
  
  // Find if the selected relay is in the user's NIP-65 relays
  const selectedInNip65 = hasNip65Relays ? relays.find(r => r.url === selectedRelay) : undefined;

  // Function to normalize relay URL by adding wss:// if no protocol is present
  const normalizeRelayUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return trimmed;
    
    // Check if it already has a protocol
    if (trimmed.includes('://')) {
      return trimmed;
    }
    
    // Add wss:// prefix
    return `wss://${trimmed}`;
  };

  // Handle adding a custom relay to app context
  const handleAddCustomRelay = (url: string) => {
    const normalizedUrl = normalizeRelayUrl(url);
    setSelectedRelay(normalizedUrl);
    setOpen(false);
    setInputValue("");
  };

  // Handle saving a relay to NIP-65
  const handleSaveToNip65 = async (relay: RelayInfo) => {
    if (!user) {
      toast({ title: "Login required", description: "You need to be logged in to save relays" });
      return;
    }
    
    try {
      await addRelay(relay);
      toast({ title: "Relay saved", description: "Relay has been added to your NIP-65 list" });
    } catch (error) {
      toast({ 
        title: "Failed to save relay", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  // Handle adding the currently selected relay to NIP-65
  const handleAddCurrentToNip65 = async () => {
    if (!selectedRelay) return;
    
    await handleSaveToNip65({
      url: selectedRelay,
      read: true,
      write: true
    });
  };

  // Handle opening the edit dialog for a relay
  const handleEditRelay = (relay: RelayInfo) => {
    setEditingRelay(relay);
  };

  // Handle saving relay edits
  const handleSaveEdit = async () => {
    if (!editingRelay) return;
    
    try {
      await updateRelay(editingRelay);
      setEditingRelay(null);
      toast({ title: "Relay updated", description: "Your relay preferences have been updated" });
    } catch (error) {
      toast({ 
        title: "Failed to update relay", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  // Handle removing a relay
  const handleRemoveRelay = async (url: string) => {
    try {
      await removeRelay(url);
      toast({ title: "Relay removed", description: "Relay has been removed from your NIP-65 list" });
    } catch (error) {
      toast({ 
        title: "Failed to remove relay", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  // Handle adding a new relay from the management dialog
  const handleAddNewRelay = async () => {
    if (!newRelay.url) return;
    
    try {
      const normalizedUrl = normalizeRelayUrl(newRelay.url);
      await addRelay({...newRelay, url: normalizedUrl});
      setNewRelay({ url: "", read: true, write: true });
      toast({ title: "Relay added", description: "New relay has been added to your list" });
    } catch (error) {
      toast({ 
        title: "Failed to add relay", 
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive" 
      });
    }
  };

  // Check if input value looks like a valid relay URL
  const isValidRelayInput = (value: string): boolean => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    
    // Basic validation - should contain at least a domain-like structure
    const normalized = normalizeRelayUrl(trimmed);
    try {
      new URL(normalized);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("justify-between", className)}
          >
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4" />
              <span className="truncate">
                {selectedOption 
                  ? selectedOption.name 
                  : selectedRelay 
                    ? selectedRelay.replace(/^wss?:\/\//, '')
                    : "Select relay..."
                }
              </span>
              {selectedInNip65 && (
                <Badge variant="outline" className="ml-1 py-0 h-5">
                  {selectedInNip65.read && selectedInNip65.write 
                    ? 'R/W' 
                    : selectedInNip65.read 
                      ? 'Read' 
                      : 'Write'
                  }
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput 
              placeholder="Search relays or type URL..." 
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandEmpty>
                {inputValue && isValidRelayInput(inputValue) ? (
                  <CommandItem
                    onSelect={() => handleAddCustomRelay(inputValue)}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">Add custom relay</span>
                      <span className="text-xs text-muted-foreground">
                        {normalizeRelayUrl(inputValue)}
                      </span>
                    </div>
                  </CommandItem>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    {inputValue ? "Invalid relay URL" : "No relay found."}
                  </div>
                )}
              </CommandEmpty>
              
              {/* User's NIP-65 relays */}
              {hasNip65Relays && (
                <CommandGroup heading="Your relays">
                  {relays
                    .filter((relay) => 
                      !inputValue || 
                      relay.url.toLowerCase().includes(inputValue.toLowerCase())
                    )
                    .map((relay) => (
                      <CommandItem
                        key={relay.url}
                        value={relay.url}
                        onSelect={(currentValue) => {
                          setSelectedRelay(normalizeRelayUrl(currentValue));
                          setOpen(false);
                          setInputValue("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedRelay === relay.url ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col flex-grow">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">
                              {relay.url.replace(/^wss?:\/\//, '')}
                            </span>
                            <div className="flex space-x-1">
                              {relay.read && (
                                <Badge variant="outline" className="py-0 h-5">R</Badge>
                              )}
                              {relay.write && (
                                <Badge variant="outline" className="py-0 h-5">W</Badge>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{relay.url}</span>
                        </div>
                      </CommandItem>
                    ))}
                </CommandGroup>
              )}
              
              {/* Preset relays */}
              <CommandGroup heading="Preset relays">
                {presetRelays
                  .filter((option) => 
                    !inputValue || 
                    option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
                    option.url.toLowerCase().includes(inputValue.toLowerCase())
                  )
                  .map((option) => (
                    <CommandItem
                      key={option.url}
                      value={option.url}
                      onSelect={(currentValue) => {
                        setSelectedRelay(normalizeRelayUrl(currentValue));
                        setOpen(false);
                        setInputValue("");
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedRelay === option.url ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-xs text-muted-foreground">{option.url}</span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
              
              {/* Custom relay option */}
              {inputValue && isValidRelayInput(inputValue) && (
                <CommandItem
                  onSelect={() => handleAddCustomRelay(inputValue)}
                  className="cursor-pointer border-t"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  <div className="flex flex-col">
                    <span className="font-medium">Add custom relay</span>
                    <span className="text-xs text-muted-foreground">
                      {normalizeRelayUrl(inputValue)}
                    </span>
                  </div>
                </CommandItem>
              )}
              
              <CommandSeparator />
              
              {/* Management options */}
              {user && (
                <CommandGroup>
                  {selectedRelay && !relays.find(r => r.url === selectedRelay) && (
                    <CommandItem
                      onSelect={handleAddCurrentToNip65}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      <span>Add current relay to your list</span>
                    </CommandItem>
                  )}
                  <CommandItem
                    onSelect={() => setIsManageDialogOpen(true)}
                    className="cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Manage your relays</span>
                  </CommandItem>
                </CommandGroup>
              )}
              
              {!user && (
                <div className="p-2 text-center text-sm">
                  <span className="text-muted-foreground">Login to manage your relay list</span>
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Manage Relays Dialog */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Your Relays</DialogTitle>
            <DialogDescription>
              Configure your NIP-65 relay list. Changes will be published to the Nostr network.
            </DialogDescription>
          </DialogHeader>
          
          {/* Relay list */}
          <div className="max-h-[50vh] overflow-y-auto">
            {relays.length > 0 ? (
              <div className="space-y-4">
                {relays.map((relay) => (
                  <div key={relay.url} className="flex items-start justify-between gap-2 p-2 border rounded-md">
                    <div className="flex flex-col flex-grow overflow-hidden">
                      <div className="font-medium truncate">{relay.url.replace(/^wss?:\/\//, '')}</div>
                      <div className="text-xs text-muted-foreground truncate">{relay.url}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Relay Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEditRelay(relay)}>
                            <PenLine className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRemoveRelay(relay.url)}>
                            <AlertCircle className="mr-2 h-4 w-4" />
                            <span>Remove</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <div className="flex space-x-1">
                        {relay.read && (
                          <Badge variant="outline" className="py-0 h-5">R</Badge>
                        )}
                        {relay.write && (
                          <Badge variant="outline" className="py-0 h-5">W</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No relays in your list yet</p>
              </div>
            )}
          </div>
          
          {/* Add new relay */}
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-relay-url">Add New Relay</Label>
              <div className="flex gap-2">
                <input 
                  id="new-relay-url"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="wss://relay.example.com"
                  value={newRelay.url}
                  onChange={(e) => setNewRelay({...newRelay, url: e.target.value})}
                />
                <Button 
                  onClick={handleAddNewRelay} 
                  disabled={!isValidRelayInput(newRelay.url)}
                >
                  Add
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="new-relay-read"
                  checked={newRelay.read}
                  onCheckedChange={(checked) => 
                    setNewRelay({...newRelay, read: checked === true})
                  }
                />
                <Label htmlFor="new-relay-read">Read</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-relay-write"
                  checked={newRelay.write}
                  onCheckedChange={(checked) => 
                    setNewRelay({...newRelay, write: checked === true})
                  }
                />
                <Label htmlFor="new-relay-write">Write</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex sm:justify-between">
            <div className="text-sm text-muted-foreground">
              NIP-65 compliant
            </div>
            <Button onClick={() => setIsManageDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Relay Dialog */}
      {editingRelay && (
        <Dialog open={!!editingRelay} onOpenChange={(open) => !open && setEditingRelay(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Relay</DialogTitle>
              <DialogDescription>
                Update relay settings for {editingRelay.url.replace(/^wss?:\/\//, '')}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="text-sm font-medium truncate">{editingRelay.url}</div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-relay-read"
                    checked={editingRelay.read}
                    onCheckedChange={(checked) => 
                      setEditingRelay({...editingRelay, read: checked === true})
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-relay-read">Read</Label>
                    <p className="text-xs text-muted-foreground">Fetch data from this relay</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="edit-relay-write"
                    checked={editingRelay.write}
                    onCheckedChange={(checked) => 
                      setEditingRelay({...editingRelay, write: checked === true})
                    }
                  />
                  <div className="space-y-1">
                    <Label htmlFor="edit-relay-write">Write</Label>
                    <p className="text-xs text-muted-foreground">Publish data to this relay</p>
                  </div>
                </div>
              </div>
              
              {/* At least one option must be selected */}
              {!editingRelay.read && !editingRelay.write && (
                <div className="text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>At least one option must be selected</span>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingRelay(null)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEdit}
                disabled={!editingRelay.read && !editingRelay.write}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}