import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/useToast';
import { Search, Loader2 } from 'lucide-react';
import { pubkeyToCoordinates, formatCoordinates } from '@/lib/npubToCoords';
import type { Coordinates } from '@/lib/npubToCoords';

interface NIP05SearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResultFound?: (pubkey: string, coords: Coordinates) => void;
}

interface FormData {
  nip05: string;
}

interface SearchResult {
  pubkey: string;
  coordinates: Coordinates;
  nip05: string;
}

export function NIP05Search({ open, onOpenChange, onResultFound }: NIP05SearchProps) {
  const { toast } = useToast();
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    setIsSearching(true);
    setResult(null);

    try {
      // Parse NIP-05 identifier
      const nip05 = data.nip05.trim();
      
      if (!nip05.includes('@')) {
        throw new Error('Invalid NIP-05 format. Expected: username@domain.com');
      }

      const [name, domain] = nip05.split('@');

      // Fetch NIP-05 data
      const url = `https://${domain}/.well-known/nostr.json?name=${name}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('NIP-05 identifier not found');
      }

      const json = await response.json();
      const pubkey = json.names?.[name];

      if (!pubkey) {
        throw new Error('Public key not found for this NIP-05 identifier');
      }

      // Calculate coordinates
      const coordinates = pubkeyToCoordinates(pubkey);

      setResult({
        pubkey,
        coordinates,
        nip05,
      });

      if (onResultFound) {
        onResultFound(pubkey, coordinates);
      }

      toast({
        title: 'User Found!',
        description: `Located ${nip05} at ${formatCoordinates(coordinates)}`,
      });
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: error instanceof Error ? error.message : 'Failed to find user',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = () => {
    reset();
    setResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Search NIP-05</DialogTitle>
          <DialogDescription>
            Enter a NIP-05 identifier to find a user's base on the map.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nip05">NIP-05 Identifier</Label>
            <div className="flex gap-2">
              <Input
                id="nip05"
                placeholder="username@domain.com"
                {...register('nip05', {
                  required: 'NIP-05 identifier is required',
                })}
                disabled={isSearching}
              />
              <Button type="submit" disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.nip05 && (
              <p className="text-sm text-red-500">{errors.nip05.message}</p>
            )}
          </div>

          {result && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Found User</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>NIP-05:</strong> {result.nip05}
                </p>
                <p>
                  <strong>Coordinates:</strong> {formatCoordinates(result.coordinates)}
                </p>
                <p className="text-xs text-muted-foreground break-all">
                  <strong>Public Key:</strong> {result.pubkey}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Close
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
