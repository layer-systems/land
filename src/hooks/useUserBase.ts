import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';

/**
 * Land base data structure
 */
export interface LandBase {
  pubkey: string;
  x: number;
  y: number;
  title?: string;
  description?: string;
  claimedAt?: number;
  color?: string;
  event: NostrEvent;
}

/**
 * Validate a land base event
 */
function validateLandBase(event: NostrEvent): boolean {
  // Check if it's a kind 30078
  if (event.kind !== 30078) return false;

  // Check for required d tag
  const d = event.tags.find(([name]) => name === 'd')?.[1];
  if (d !== 'land-base') return false;

  // Check for required x and y tags
  const x = event.tags.find(([name]) => name === 'x')?.[1];
  const y = event.tags.find(([name]) => name === 'y')?.[1];
  if (!x || !y) return false;

  return true;
}

/**
 * Parse a land base event into a LandBase object
 */
function parseLandBase(event: NostrEvent): LandBase | null {
  if (!validateLandBase(event)) return null;

  const x = parseInt(event.tags.find(([name]) => name === 'x')?.[1] || '0');
  const y = parseInt(event.tags.find(([name]) => name === 'y')?.[1] || '0');
  const title = event.tags.find(([name]) => name === 'title')?.[1];
  const description = event.tags.find(([name]) => name === 'description')?.[1];
  const claimedAt = parseInt(event.tags.find(([name]) => name === 'claimed_at')?.[1] || '0');
  const color = event.tags.find(([name]) => name === 'color')?.[1];

  return {
    pubkey: event.pubkey,
    x,
    y,
    title,
    description,
    claimedAt: claimedAt || undefined,
    color,
    event,
  };
}

/**
 * Hook to get a specific user's land base
 * 
 * @param pubkey - Public key of the user
 * @returns Query result with the user's land base
 */
export function useUserBase(pubkey: string | null | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['land-base', pubkey],
    queryFn: async () => {
      if (!pubkey) return null;

      const events = await nostr.query([
        {
          kinds: [30078],
          authors: [pubkey],
          '#d': ['land-base'],
          limit: 1,
        },
      ]);

      if (events.length === 0) return null;

      return parseLandBase(events[0]);
    },
    enabled: !!pubkey,
  });
}

/**
 * Hook to get all land bases in the network
 * 
 * @param limit - Maximum number of bases to fetch (default: 500)
 * @returns Query result with all land bases
 */
export function useAllBases(limit: number = 500) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['land-bases', limit],
    queryFn: async () => {
      const events = await nostr.query([
        {
          kinds: [30078],
          '#d': ['land-base'],
          '#t': ['land'],
          limit,
        },
      ]);

      // Parse and filter valid bases
      const bases = events
        .map(parseLandBase)
        .filter((base): base is LandBase => base !== null);

      return bases;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
