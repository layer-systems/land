import { nip19 } from 'nostr-tools';

/**
 * Map dimensions
 */
export const MAP_WIDTH = 100000;
export const MAP_HEIGHT = 100000;

/**
 * Coordinates on the 2D map
 */
export interface Coordinates {
  x: number;
  y: number;
}

/**
 * Calculate deterministic coordinates from a public key (hex format)
 * 
 * @param pubkeyHex - Public key in hex format (64 characters)
 * @returns Coordinates object with x and y values
 */
export function pubkeyToCoordinates(pubkeyHex: string): Coordinates {
  if (!pubkeyHex || pubkeyHex.length !== 64) {
    throw new Error('Invalid pubkey hex: must be 64 characters');
  }

  // Use the pubkey hex directly as our hash source
  const hash = pubkeyHex;
  
  // Split hash into two parts for X and Y
  const xHex = hash.slice(0, 32); // First 32 characters
  const yHex = hash.slice(32, 64); // Last 32 characters
  
  // Convert to integers
  const xBigInt = BigInt('0x' + xHex);
  const yBigInt = BigInt('0x' + yHex);
  
  // Modulo by map dimensions to get coordinates
  const x = Number(xBigInt % BigInt(MAP_WIDTH));
  const y = Number(yBigInt % BigInt(MAP_HEIGHT));
  
  return { x, y };
}

/**
 * Calculate deterministic coordinates from an npub identifier
 * 
 * @param npub - Nostr public key in npub format (bech32)
 * @returns Coordinates object with x and y values
 */
export function npubToCoordinates(npub: string): Coordinates {
  try {
    const decoded = nip19.decode(npub);
    
    if (decoded.type !== 'npub') {
      throw new Error('Not an npub identifier');
    }
    
    return pubkeyToCoordinates(decoded.data);
  } catch (error) {
    throw new Error(`Invalid npub: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Validate that claimed coordinates match the calculated coordinates
 * 
 * @param pubkeyHex - Public key in hex format
 * @param claimedX - X coordinate claimed in the event
 * @param claimedY - Y coordinate claimed in the event
 * @returns true if coordinates match, false otherwise
 */
export function validateCoordinates(
  pubkeyHex: string,
  claimedX: number,
  claimedY: number
): boolean {
  try {
    const calculated = pubkeyToCoordinates(pubkeyHex);
    return calculated.x === claimedX && calculated.y === claimedY;
  } catch {
    return false;
  }
}

/**
 * Format coordinates as a display string
 * 
 * @param coords - Coordinates to format
 * @returns Formatted string like "(12345, 67890)"
 */
export function formatCoordinates(coords: Coordinates): string {
  return `(${coords.x.toLocaleString()}, ${coords.y.toLocaleString()})`;
}
