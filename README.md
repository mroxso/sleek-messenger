# Sleek Messenger

**Private, Encrypted Messaging on Nostr**

Sleek Messenger is a modern, privacy-focused messaging application built on the Nostr protocol. Have secure, encrypted 1-on-1 conversations with anyone on the decentralized Nostr network.

## 🔐 Key Features

- **🔒 End-to-End Encryption**: Private conversations using NIP-44 encryption
- **👤 1-on-1 Messaging**: Direct, secure communication with Nostr users
- **🌐 Decentralized**: No central server - messages flow through Nostr relays
- **🎨 Beautiful UI**: Clean, modern interface with light/dark theme support
- **⚡ Fast & Responsive**: Built with React 18.x and Vite for instant interactions
- **📱 Mobile-Friendly**: Responsive design that works on all devices

## 🚀 Quick Start

### Development
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

### Deploy
```bash
npm run deploy
```

## 💬 How It Works

Sleek Messenger leverages the Nostr protocol to provide truly private messaging:

1. **Connect**: Log in with your Nostr account using browser extensions (Alby, nos2x, etc.)
2. **Find Contacts**: Connect with anyone on Nostr using their npub or profile
3. **Chat Securely**: All messages are encrypted end-to-end with NIP-44
4. **Stay Private**: Your conversations are yours - no central server can read them

## 🛠 Built With

- **React 18.x**: Modern UI framework with hooks and concurrent rendering
- **TailwindCSS 3.x**: Utility-first CSS framework for beautiful styling
- **Vite**: Lightning-fast build tool and development server
- **shadcn/ui**: Polished, accessible UI components
- **Nostrify**: Nostr protocol framework for web
- **TanStack Query**: Smart data fetching and caching
- **TypeScript**: Type-safe development

### Nostr Protocol Support

- **NIP-01**: Basic event structure and relay communication
- **NIP-02**: Contact lists and social graph
- **NIP-04**: Legacy encrypted direct messages (deprecated)
- **NIP-17**: Private direct messages (Gift Wraps)
- **NIP-44**: Modern encryption for private messaging
- **NIP-07**: Browser signer extensions (Alby, nos2x, etc.)
- **NIP-19**: Nostr identifiers (npub, note, nevent, naddr)

## 🔒 Privacy & Security

- **End-to-End Encryption**: Messages encrypted with NIP-44 before leaving your device
- **No Central Server**: Decentralized architecture - no single point of failure
- **Your Keys, Your Data**: You control your identity and messages
- **Browser Signing**: Secure authentication using NIP-07 browser extensions
- **Open Source**: Transparent, auditable code

## � Features

### Messaging
- **Encrypted 1-on-1 Chats**: Private conversations with NIP-44 encryption
- **Chat History**: Persistent message storage across relays
- **Read Receipts**: See when messages are delivered
- **User Profiles**: View contact profiles with avatars and bios
- **Real-time Updates**: Instant message delivery

### User Experience
- **Clean Interface**: Intuitive chat list and conversation views
- **Dark/Light Theme**: Automatic theme switching based on preference
- **Mobile Responsive**: Works seamlessly on desktop and mobile
- **Fast & Smooth**: Optimized performance with React and Vite
- **Account Management**: Easy login with Nostr browser extensions

### Technical Features
- Multi-relay support for reliability
- Message encryption/decryption
- Event validation and filtering
- Efficient data caching
- Type-safe with TypeScript

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ installed
- A Nostr account and browser extension (recommended: [Alby](https://getalby.com/) or [nos2x](https://github.com/fiatjaf/nos2x))

### Installation

```bash
# Clone the repository
git clone https://github.com/mroxso/sleek-messenger.git
cd sleek-messenger

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. **Open the app** at `http://localhost:5173`
2. **Log in** with your Nostr browser extension
3. **Start chatting** - select a contact or start a new conversation
4. **Send encrypted messages** - all communications are automatically encrypted

## 📁 Project Structure

```
src/
├── components/           # UI components
│   ├── ui/              # shadcn/ui components
│   ├── auth/            # Login and authentication
│   ├── ChatList.tsx     # Chat list sidebar
│   ├── ChatView.tsx     # Message conversation view
│   └── NewChatDialog.tsx # Start new conversations
├── hooks/               # Custom React hooks
│   ├── useChat.ts       # Chat management
│   ├── useDecryptMessage.ts # Message decryption
│   ├── useCurrentUser.ts # Authentication state
│   └── useAuthor.ts     # User profile data
├── pages/               # Page components
│   ├── ChatPage.tsx     # Main messaging interface
│   └── Profile.tsx      # User profile view
├── lib/                 # Utility functions
└── contexts/            # React context providers
```

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run test     # Run test suite
npm run deploy   # Deploy to production
```

### Architecture

Sleek Messenger uses a modern React architecture:

- **React 18.x**: Leveraging concurrent rendering and hooks
- **TypeScript**: Full type safety across the codebase
- **TanStack Query**: Efficient data fetching and caching
- **Nostrify**: Clean abstraction over Nostr protocol
- **shadcn/ui**: Beautiful, accessible components

### Key Hooks

- `useChat`: Manage conversations and message history
- `useDecryptMessage`: Decrypt incoming encrypted messages
- `useCurrentUser`: Access logged-in user state
- `useAuthor`: Fetch user profile information
- `useNostr`: Query and publish Nostr events

## � Contributing

We welcome contributions! Whether it's:

- Bug fixes
- Feature suggestions
- UI improvements
- Documentation updates
- Testing

Please feel free to open issues or submit pull requests.

## 📄 License

Open source under the MIT License.

## � Acknowledgments

- Built with [MKStack](https://soapbox.pub/mkstack)
- Powered by the [Nostr protocol](https://nostr.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)

## 🔗 Links

- [Nostr Protocol](https://nostr.com)
- [NIP-44 Specification](https://github.com/nostr-protocol/nips/blob/master/44.md)
- [NIP-17 Specification](https://github.com/nostr-protocol/nips/blob/master/17.md)

---

**Secure messaging for the decentralized web** 🔒