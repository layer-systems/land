# Land - Nostr Map Explorer 🗺️

**Claim Your Place on the Decentralized Map**

Land is a Nostr-based application where each user has a unique, permanent position on a 2D map calculated from their public key. Explore the network, claim your base, and customize your corner of the digital world.

![Land Map View](https://github.com/user-attachments/assets/5bbb5dc8-e1a2-4638-b328-dfeb68abab32)

## ✨ Features

- 🗺️ **Interactive 2D Map** - Pan, zoom, and explore 609+ Nostr users
- 📍 **Deterministic Positions** - Each npub has a unique, verifiable location
- 🎨 **Customizable Bases** - Name, describe, and color your land claim
- 🔍 **NIP-05 Search** - Find any user by their identifier
- 📱 **Responsive Design** - Perfect on mobile and desktop
- 🔐 **Fully Decentralized** - All data stored as Nostr events

## 🚀 Quick Start

### Try It Live
Visit the deployed application and start exploring!

### Run Locally
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🎯 How to Use

1. **Explore the Map** - View all users on the 2D map without logging in
2. **Login** - Use your Nostr signer (browser extension)
3. **Find Your Base** - Your position is automatically calculated from your npub
4. **Claim It** - Click "Claim Base" to publish your land claim
5. **Customize** - Add a name, description, and choose your marker color
6. **Search** - Find friends using their NIP-05 identifier

## 📊 Map Statistics

Current network snapshot:
- **609 Total Users** discovered from relays
- **100,000 × 100,000** coordinate space
- **Deterministic positioning** - your spot is permanent
- **0% claimed** - plenty of territory available!

## 🛠️ Technical Stack

Built with **MKStack** - the complete framework for Nostr applications:

- **React 18.x** + TypeScript
- **Nostrify** for Nostr protocol
- **HTML5 Canvas** for map rendering
- **TanStack Query** for state management
- **Tailwind CSS** + shadcn/ui components
- **Vite** for blazing-fast builds

## 📖 Documentation

- **[Land Guide](./LAND_GUIDE.md)** - Complete user and developer guide
- **[NIP Specification](./NIP.md)** - Protocol documentation for land claiming
- **[MKStack Docs](https://soapbox.pub/mkstack)** - Framework documentation

## 🎮 Protocol Overview

### Custom Nostr Kinds

- **Kind 30078**: Land base (addressable event)
  - Stores base metadata: name, description, color, coordinates
  - Replaceable for updates
  
- **Kind 30079**: Land items (future)
  - For game mechanics: spawning, trading, collecting
  
- **Kind 1111**: Claim announcements (future)
  - Share your claim with followers

### Coordinate Calculation

Each npub maps to a permanent position:
```
X = first 32 hex chars of pubkey % 100,000
Y = last 32 hex chars of pubkey % 100,000
```

**Your position is permanent and verifiable by anyone!**

## 🔮 Future Enhancements

The protocol supports exciting future features:

- **Items & Resources** - Master accounts spawn collectibles
- **Trading System** - Exchange items between users  
- **Base Building** - Construct and decorate your territory
- **Territories** - Form alliances and claim regions
- **Events** - Organize gatherings at coordinates
- **Minimap** - Better navigation of large areas

## 📸 Screenshots

<table>
<tr>
<td><img src="https://github.com/user-attachments/assets/5bbb5dc8-e1a2-4638-b328-dfeb68abab32" alt="Desktop View" width="400"/><br/><em>Desktop View</em></td>
<td><img src="https://github.com/user-attachments/assets/a9dfdb2d-22c7-404f-9939-2e7311338c60" alt="NIP-05 Search" width="400"/><br/><em>NIP-05 Search</em></td>
</tr>
<tr>
<td><img src="https://github.com/user-attachments/assets/4c5d3764-b0cd-4d7a-971c-a75bc7c195ec" alt="Mobile View" width="400"/><br/><em>Mobile Responsive</em></td>
<td><img src="https://github.com/user-attachments/assets/3662a172-84df-4e9b-9b8a-53b91fc3618e" alt="Zoomed Map" width="400"/><br/><em>Zoomed View</em></td>
</tr>
</table>

## 🤝 Contributing

Contributions are welcome! Some ideas:

- Enhanced visualizations (terrain, biomes, regions)
- Item system implementation  
- Performance optimizations
- Additional game mechanics
- Real-time collaboration features

## 🔐 Security

- ✅ No vulnerabilities found (CodeQL scan)
- ✅ All coordinates validated against pubkeys
- ✅ Events filtered by authors to prevent spoofing
- ✅ NIP-44 encryption ready for private features

## 📝 License

Open source - build amazing things on Nostr!

---

**Vibed with MKStack** - [Learn more about MKStack](https://soapbox.pub/mkstack)

*The complete framework for building Nostr clients with AI*
