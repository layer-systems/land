import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from '@nostrify/nostrify';
import { pubkeyToCoordinates } from '@/lib/npubToCoords';

/**
 * User with calculated map position
 */
export interface MapUser {
  pubkey: string;
  x: number;
  y: number;
  metadata?: {
    name?: string;
    display_name?: string;
    picture?: string;
    about?: string;
    nip05?: string;
  };
  hasClaimed: boolean;
}

/**
 * Hook to discover all users from the network
 * 
 * @param limit - Maximum number of users to fetch (default: 500)
 * @returns Query result with all discovered users
 */
export function useAllUsers(limit: number = 500) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['all-users', limit],
    queryFn: async () => {
      // Query kind 0 events to discover users
      const metadataEvents = await nostr.query([
        {
          kinds: [0],
          limit,
        },
      ]);

      // Parse metadata and calculate positions
      const users: MapUser[] = metadataEvents.map((event: NostrEvent) => {
        const coords = pubkeyToCoordinates(event.pubkey);
        
        let metadata;
        try {
          metadata = JSON.parse(event.content);
        } catch {
          metadata = undefined;
        }

        return {
          pubkey: event.pubkey,
          x: coords.x,
          y: coords.y,
          metadata,
          hasClaimed: false, // Will be updated when we fetch bases
        };
      });

      return users;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
