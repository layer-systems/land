# Land - Nostr Map Explorer

A decentralized 2D map where each Nostr user (npub) has a unique, permanent position calculated from their public key. Users can claim their base, customize it, and explore the network on an interactive map.

## 🎯 Features

### Core Functionality
- **Deterministic Positioning**: Every npub automatically has a unique X,Y coordinate on a 100,000 x 100,000 map
- **Interactive Map**: Pan, zoom, and explore the Nostr network visually
- **Claim Your Base**: Login and claim your position on the map
- **Customize**: Add a name, description, and color to your base
- **NIP-05 Search**: Find any user by their NIP-05 identifier
- **Fully Decentralized**: All data stored as Nostr events (no central database)

### User Experience
- **Responsive Design**: Works beautifully on mobile and desktop
- **Real-time Discovery**: Automatically discovers users from Nostr relays
- **Statistics Dashboard**: See total users, claimed bases, and claim rate
- **Visual Legend**: Easy to distinguish between claimed, unclaimed, and your own base

## 🗺️ How It Works

### Coordinate System
Each Nostr public key (npub) maps to a specific location on the map:

1. Your npub is converted to hex format (64 characters)
2. The first 32 hex characters determine your X coordinate
3. The last 32 hex characters determine your Y coordinate
4. These are modulo'd by the map dimensions (100,000 x 100,000)

**Your position is permanent and verifiable by anyone!**

### Claiming Your Base
1. **Login**: Use any Nostr signer (browser extension, NIP-07)
2. **Find Your Base**: Your position is automatically calculated
3. **Claim It**: Click "Claim Base" to publish your land claim
4. **Customize**: Add a name, description, and choose a color

### Data Storage
All data is stored as Nostr events:

- **Kind 30078**: Your land base (addressable event)
  - Stores your base name, description, color, and coordinates
  - Replaceable: updating your base publishes a new event
  - Tagged with `#t: land` for easy filtering

## 🎮 Using the Map

### Navigation
- **Pan**: Click and drag to move around
- **Zoom**: Use the +/- buttons in the corner
- **Center**: Click the home button to center on your base (when logged in)
- **Search**: Click the search button to find users by NIP-05

### Markers
- **Green**: Your base (when logged in)
- **Blue**: Claimed bases by other users
- **Gray**: Unclaimed positions

### Interactions
- **Click any marker**: View detailed information about that base
- **Hover**: See the base owner's name (when zoomed in)

## 📊 Statistics

The sidebar shows:
- **Total Users**: Discovered from Nostr relays
- **Claimed Bases**: Users who have claimed their position
- **Claim Rate**: Percentage of users who have claimed

## 🔮 Future Features

The protocol is designed to support future game mechanics:

### Items & Resources (Kind 30079)
- Master accounts can spawn items on the map
- Users can collect, trade, and use items
- Building and decorating your base
- Resource gathering and crafting

### Social Features
- Visit other users' bases
- Leave messages or reactions
- Form alliances or territories
- Organize events at specific coordinates

## 🛠️ Technical Details

### Technology Stack
- **React 18** + TypeScript for the UI
- **Nostrify** for Nostr protocol integration
- **HTML5 Canvas** for map rendering
- **TanStack Query** for data management
- **Tailwind CSS** + shadcn/ui for styling

### NIP Compliance
- **NIP-01**: Basic event creation
- **NIP-07**: Browser signer integration
- **NIP-19**: npub identifier support
- **NIP-65**: Relay management
- **Custom NIP**: Land claiming protocol (see NIP.md)

### Performance
- Efficient canvas rendering for smooth interactions
- Smart relay queries to minimize bandwidth
- Client-side filtering and spatial indexing
- Lazy loading of off-screen markers

## 🚀 Getting Started

### For Users
1. Visit the deployed app
2. Login with your Nostr signer
3. Click "Claim Base" to claim your position
4. Customize your base and explore!

### For Developers
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## 📖 Protocol Documentation

See [NIP.md](./NIP.md) for the complete protocol specification, including:
- Event kind definitions
- Tag structure
- Coordinate calculation algorithm
- Security considerations
- Example implementations

## 🎨 Customization

The map is designed to be extensible:
- Modify `MAP_WIDTH` and `MAP_HEIGHT` in `npubToCoords.ts`
- Change colors and styling in `MapCanvas.tsx`
- Add new features by extending the event kinds
- Implement custom game mechanics

## 🤝 Contributing

This is an open-source project built with MKStack. Contributions are welcome!

Areas for improvement:
- Enhanced map visualization (terrain, regions, etc.)
- Item system implementation
- Real-time collaboration features
- Performance optimizations
- Additional game mechanics

## 📝 License

Open source - build amazing things on Nostr!

---

**Built with [MKStack](https://soapbox.pub/mkstack)** - The complete framework for building Nostr clients with AI
