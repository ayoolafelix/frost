# PUSD Trust Layer Protocol

A production-grade decentralized escrow + trust infrastructure system on Solana using PUSD (SPL token) as the settlement asset.

## Architecture

- **Escrow Contracts**: Secure fund management with PDA vaults
- **Milestone-based Release**: Funds released upon service completion
- **Dispute Resolution**: Arbiter-mediated arbitration
- **Treasury**: 0.5% protocol fee collection

## Quick Start

```bash
# Install dependencies
cd app
npm install

# Run frontend (runs on localhost:3000)
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
/frost
├── app/                    # Next.js frontend
│   ├── src/
│   │   ├── app/            # Pages
│   │   │   ├── page.tsx           # Home
│   │   │   ├── marketplace/       # Service marketplace
│   │   │   ├── checkout/          # Checkout flow
│   │   │   └── dashboard/         # Escrow dashboard
│   │   ├── components/            # UI components
│   │   ├── lib/
│   │   │   ├── anchorClient.ts    # Anchor program client
│   │   │   └── wallet.tsx          # Wallet config
│   │   └── styles/
│   └── package.json
├── program/                # Anchor Solana program
│   ├── src/lib.rs           # Escrow program logic
│   ├── Cargo.toml
│   └── Anchor.toml
└── README.md
```

## Pages

- `/` - Home with navigation
- `/marketplace` - Browse services, click to purchase
- `/checkout?service=X&price=Y` - Escrow checkout flow
- `/dashboard` - View and manage escrows

## Escrow Flow

1. **Browse**: Select service from marketplace
2. **Checkout**: Create escrow → Confirm details
3. **Fund**: Transfer PUSD to vault (0.5% fee to treasury)
4. **Release**: Provider delivers → funds released to recipient
5. **Dispute**: If issues, initializer can dispute for arbiter resolution

## Testing on Devnet

```bash
# Get devnet SOL
solana airdrop 2

# Set network
solana config set --url devnet
```

## Tech Stack

- **Anchor 0.30.1** - Smart contract framework
- **Next.js 14** - Frontend
- **@coral-xyz/anchor** - Client SDK
- **Solana Wallet Adapter** - Phantom, Solflare

## Program ID

```
PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq
```

## Known Limitations

- TypeScript strict mode disabled due to wallet adapter type incompatibilities
- Requires devnet SOL and PUSD for testing
- Build works in dev mode, production build may have additional issues

## License

MIT