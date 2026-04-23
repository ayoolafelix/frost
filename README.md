# PUSD Trust Layer Protocol

A production-grade decentralized escrow + marketplace + dispute resolution system on Solana.

## Overview

**PUSD Trust Layer** is a programmable financial layer combining:
- **Escrow**: Secure PUSD custody with PDA vaults
- **Marketplace**: Service listings with built-in payment flow
- **Dispute Resolution**: Arbiter-mediated arbitration
- **Protocol Fees**: 0.5% fee with Treasury PDA

Think "Stripe + Fiverr + Arbitration layer on Solana"

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PUSD Trust Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Marketplace          Escrow          Dispute            │
│  ─────────           ───────          ───────            │
│  • Create Service   • Create        • Dispute           │
│  • Update         • Fund           • Resolve            │
│  • List           • Release        • (arbiter)         │
├─────────────────────────────────────────────────────────────┤
│  Treasury (0.5% fee)     PDA Vault (custody)          │
│  • Collect fees         • Secure token holding         │
│  • Withdraw           • Signer for release           │
└─────────────────────────────────────────────────────────────┘
```

## State Machine

```
Created ──fund──► Funded ──release──► Released
                │                    ▲
                └──dispute──► Disputed │
                         │         │
                         └──────► Resolved (arbiter)
```

## Features

### 1. Marketplace
- Service providers can list services with title, description, price
- Services linked to escrow for seamless payment flow
- Active/inactive toggle

### 2. Escrow  
- **Create**: Initialize with recipient + amount + optional service_id
- **Fund**: Transfer PUSD to vault (0.5% fee deducted to treasury)
- **Release**: Transfer from vault to recipient (minus fees)
- **Dispute**: Mark as disputed for arbiter review

### 3. Dispute Resolution
- Only initializer can dispute while funded
- Only arbiter wallet can resolve
- Three resolution options:
  - `ReleaseToRecipient`: Full payment to recipient
  - `RefundInitializer`: Refund to initializer  
  - `SplitPayment`: 50/50 split

### 4. Protocol Fees
- 0.5% (50 basis points) on every escrow
- Fees collected in Treasury PDA
- Authority can withdraw collected fees

## Project Structure

```
/frost
├── program/                    # Anchor Solana program
│   ├── Cargo.toml
│   ├── Anchor.toml
│   └── src/lib.rs           # Full protocol logic
├── app/                      # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Create Escrow
│   │   │   ├── marketplace/page.tsx # Service Marketplace
│   │   │   ├── dashboard/page.tsx  # Escrow Dashboard
│   │   │   └── escrow/[pubkey]/    # Detail + Resolve
│   │   ├── lib/
│   │   │   ├── anchorClient.ts     # All Anchor methods
���   │   │   └── wallet.tsx         # Wallet config
│   │   └── styles/
│   └── package.json
└── README.md
```

## Running the Protocol

### Prerequisites
- Node.js 18+
- Anchor CLI
- Phantom Wallet
- Devnet SOL + PUSD

### Setup

```bash
# Install
cd app && npm install

# Configure
solana config set --url devnet
solana airdrop 2

# Create PUSD token
spl-token create-token --decimals 6
spl-token create-account <MINT>
spl-token mint <MINT> 1000

# Update PUSD_MINT in app/src/lib/wallet.tsx

# Build & deploy
cd program && anchor build && anchor deploy

# Run frontend
cd app && npm run dev
```

Open http://localhost:3000

---

## Demo Flow

### Option 1: Direct Escrow

**Step 1: Create Escrow**
1. Connect wallet
2. Enter recipient address
3. Enter amount
4. Click "Create Escrow"

**Step 2: Fund Escrow**
1. Go to Dashboard
2. Click escrow
3. Click "Fund Escrow"
4. PUSD moves to vault (0.5% → treasury)

**Step 3: Release**
1. Click "Release Funds"
2. PUSD transfers to recipient

### Option 2: Marketplace

**Step 1: Create Service**
1. Go to Marketplace
2. Enter title, description, price
3. Click "Create Service"

**Step 2: Open Escrow for Service**
1. (For buyer) Create escrow with service provider
2. Fund escrow

**Step 3: Complete**
1. Provider delivers service
2. Initializer releases funds

### Option 3: Dispute Resolution

**Step 1: Dispute**
1. If issues, initializer clicks "Dispute"
2. State → Disputed

**Step 2: Resolution**
1. Arbiter reviews case
2. Arbiter selects resolution method:
   - Release to Recipient (if service delivered)
   - Refund Initializer (if service undelivered)
   - Split 50/50 (compromise)

---

## Program Instructions

| Instruction | Description | Access |
|------------|-------------|-------|
| createService | Create service listing | Provider |
| updateService | Update service | Provider |
| createEscrow | Initialize escrow | Anyone |
| fundEscrow | Lock PUSD in vault | Initializer |
| releaseEscrow | Release to recipient | Initializer |
| disputeEscrow | Mark disputed | Initializer |
| resolveDispute | Resolve arbitration | Arbiter |
| withdrawFees | Withdraw treasury | Authority |

## Program Addresses

- **Program**: `PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq`
- **PUSD Mint**: (set in wallet.tsx)

## Tech Stack

- **Anchor 0.30.1** - Program + CPI
- **Next.js 14** - Frontend
- **@coral-xyz/anchor** - Client
- **Solana Wallet Adapter** - Phantom
- **SPL Token** - Token operations

## Security

- PDA vault stores tokens with escrow as authority
- State transitions enforced on-chain
- Only initializer can fund/release/dispute
- Arbiter-only dispute resolution (immutable)
- 0.5% protocol fee to prevent spam

---

## Wow Factor

- Solana PDA vaults (real on-chain security)
- Shareable escrow links
- Live state indicators
- Marketplace discovery
- Filter by status
- Animated lifecycle view
- Fund badge: "Secured by Solana PDA vault"