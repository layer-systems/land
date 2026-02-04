# NIP-XX: Land Claiming Protocol

`draft` `optional`

This NIP defines a protocol for claiming and managing virtual land bases on a 2D coordinate system based on Nostr public keys.

## Abstract

This protocol enables users to claim virtual land bases on a decentralized 2D map where each npub has a deterministic position calculated from their public key. Users can claim their base, customize it, and discover other users' bases on the map.

## Kinds

### Kind 30078: Land Base

An addressable event representing a user's claimed land base.

```json
{
  "kind": 30078,
  "content": "",
  "tags": [
    ["d", "land-base"],
    ["title", "<base name>"],
    ["description", "<base description>"],
    ["x", "<x coordinate>"],
    ["y", "<y coordinate>"],
    ["claimed_at", "<unix timestamp>"],
    ["color", "<hex color code>"],
    ["t", "land"]
  ]
}
```

**Required tags:**
- `d`: Must be "land-base" for the user's primary base
- `x`: X coordinate on the map (calculated from npub)
- `y`: Y coordinate on the map (calculated from npub)

**Optional tags:**
- `title`: Custom name for the base (defaults to user's display name)
- `description`: Description of the base
- `claimed_at`: Unix timestamp when the base was first claimed
- `color`: Hex color code for the base marker (e.g., "#FF5733")
- `t`: Category tag, should be "land" for filtering

### Kind 30079: Land Item

An addressable event for items that can be spawned and sent to users (future functionality).

```json
{
  "kind": 30079,
  "content": "<item description>",
  "tags": [
    ["d", "<unique item id>"],
    ["item_type", "<type of item>"],
    ["owner", "<npub of current owner>"],
    ["x", "<x coordinate>"],
    ["y", "<y coordinate>"],
    ["t", "land-item"]
  ]
}
```

**Required tags:**
- `d`: Unique identifier for the item
- `item_type`: Type of item (e.g., "resource", "building", "decoration")
- `owner`: npub of the current owner

**Optional tags:**
- `x`, `y`: Current position of the item on the map
- `t`: Category tag, should be "land-item" for filtering

### Kind 1111: Land Claim Announcement

A regular event announcing a land claim to followers.

```json
{
  "kind": 1111,
  "content": "I just claimed my land base at coordinates (<x>, <y>)! Come visit! 🗺️",
  "tags": [
    ["x", "<x coordinate>"],
    ["y", "<y coordinate>"],
    ["a", "30078:<pubkey>:land-base"],
    ["t", "land"]
  ]
}
```

**Required tags:**
- `x`, `y`: Coordinates of the claimed base
- `a`: Reference to the land-base addressable event

**Optional tags:**
- `t`: Category tag for filtering

## Coordinate Calculation

The position of a user's base is deterministically calculated from their public key (npub):

1. Take the SHA-256 hash of the public key hex string
2. Split the hash into two parts: first 16 bytes for X, last 16 bytes for Y
3. Convert each part to an integer and modulo by map dimensions to get coordinates

This ensures:
- Each npub has a unique, permanent position
- The position is verifiable by anyone
- No centralized coordinate assignment is needed

## NIP-05 Discovery

Users can search for bases using NIP-05 identifiers. The client should:

1. Resolve the NIP-05 identifier to get the pubkey
2. Calculate the coordinates from the pubkey
3. Query for the user's kind 30078 event
4. Display the base on the map

## Client Behavior

### Displaying the Map

1. Query kind 0 events to discover users on the network
2. Calculate coordinates for each user
3. Query kind 30078 events to see which users have claimed bases
4. Render the map with claimed and unclaimed bases

### Claiming a Base

1. User must be logged in with a Nostr signer
2. Calculate the user's coordinates from their npub
3. Create a kind 30078 event with the user's position
4. Optionally publish a kind 1111 announcement

### Future: Item Management

Items (kind 30079) will enable:
- Master accounts to spawn items
- Users to receive and collect items
- Trading items between users
- Placing items on bases

## Security Considerations

- Always filter kind 30078 queries by `authors` field to prevent spoofing
- Validate that claimed coordinates match the calculated position from the npub
- Use NIP-44 encryption for private item transfers (future)

## Examples

### Claiming a Base

```javascript
import { generateSecretKey, getPublicKey, finalizeEvent } from 'nostr-tools';

// Calculate coordinates from pubkey
const coords = calculateCoordinates(pubkey);

const event = {
  kind: 30078,
  content: "",
  tags: [
    ["d", "land-base"],
    ["title", "Alice's Homestead"],
    ["description", "Welcome to my corner of the map!"],
    ["x", coords.x.toString()],
    ["y", coords.y.toString()],
    ["claimed_at", Math.floor(Date.now() / 1000).toString()],
    ["color", "#FF5733"],
    ["t", "land"]
  ],
  created_at: Math.floor(Date.now() / 1000),
  pubkey: pubkey
};

const signedEvent = finalizeEvent(event, secretKey);
```

### Querying Bases in a Region

```javascript
// Get all bases in the network
const bases = await nostr.query([{
  kinds: [30078],
  '#d': ['land-base'],
  '#t': ['land'],
  limit: 1000
}]);

// Filter to a specific region (client-side)
const regionBases = bases.filter(base => {
  const x = parseInt(base.tags.find(t => t[0] === 'x')?.[1] || '0');
  const y = parseInt(base.tags.find(t => t[0] === 'y')?.[1] || '0');
  return x >= minX && x <= maxX && y >= minY && y <= maxY;
});
```

## Implementation Notes

- The map should be infinite or very large (e.g., 100,000 x 100,000)
- Zoom and pan controls are essential for navigation
- Consider implementing a minimap for orientation
- Use spatial indexing for efficient rendering of visible bases
- Show user count and claimed vs unclaimed bases as statistics

## Reference Implementation

A reference implementation is available at: [https://github.com/layer-systems/land](https://github.com/layer-systems/land)
