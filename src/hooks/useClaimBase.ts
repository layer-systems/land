import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { pubkeyToCoordinates } from '@/lib/npubToCoords';
import type { LandBase } from './useUserBase';

/**
 * Data for claiming a land base
 */
export interface ClaimBaseData {
  title?: string;
  description?: string;
  color?: string;
  pubkey: string;
  existingBase?: LandBase | null;
}

/**
 * Hook to claim a land base
 * 
 * @returns Mutation for claiming a land base
 */
export function useClaimBase() {
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClaimBaseData) => {
      // Calculate coordinates from pubkey
      const coords = pubkeyToCoordinates(data.pubkey);

      // Build tags
      const tags: string[][] = [
        ['d', 'land-base'],
        ['x', coords.x.toString()],
        ['y', coords.y.toString()],
        ['claimed_at', Math.floor(Date.now() / 1000).toString()],
        ['t', 'land'],
      ];

      if (data.title) {
        tags.push(['title', data.title]);
      }

      if (data.description) {
        tags.push(['description', data.description]);
      }

      if (data.color) {
        tags.push(['color', data.color]);
      }

      // Create the land base event
      await createEvent({
        kind: 30078,
        content: '',
        tags,
      });

      return coords;
    },
    onSuccess: (coords, variables) => {
      // Invalidate queries to refetch the base
      queryClient.invalidateQueries({ queryKey: ['land-base', variables.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['land-bases'] });
    },
  });
}

/**
 * Hook to update a land base
 * 
 * @returns Mutation for updating a land base
 */
export function useUpdateBase() {
  const { mutateAsync: createEvent } = useNostrPublish();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClaimBaseData) => {
      // Calculate coordinates from pubkey
      const coords = pubkeyToCoordinates(data.pubkey);

      // Build tags
      const tags: string[][] = [
        ['d', 'land-base'],
        ['x', coords.x.toString()],
        ['y', coords.y.toString()],
        ['t', 'land'],
      ];

      // Preserve original claimed_at timestamp if updating existing base
      if (data.existingBase?.claimedAt) {
        tags.push(['claimed_at', data.existingBase.claimedAt.toString()]);
      }

      if (data.title) {
        tags.push(['title', data.title]);
      }

      if (data.description) {
        tags.push(['description', data.description]);
      }

      if (data.color) {
        tags.push(['color', data.color]);
      }

      // Create the updated land base event
      await createEvent({
        kind: 30078,
        content: '',
        tags,
      });

      return coords;
    },
    onSuccess: (coords, variables) => {
      // Invalidate queries to refetch the base
      queryClient.invalidateQueries({ queryKey: ['land-base', variables.pubkey] });
      queryClient.invalidateQueries({ queryKey: ['land-bases'] });
    },
  });
}
