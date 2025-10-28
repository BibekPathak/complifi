# 🔒 CompliFi - On-Chain Compliance Orchestration Layer for Solana

CompliFi is a modular on-chain compliance orchestration engine built on Solana. It allows any DeFi protocol to easily plug in regulatory checks using a single SDK or smart-contract interface.

## 🚨 Problem Statement

DeFi protocols are growing fast — but regulatory compliance remains fragmented and off-chain. Each protocol must separately integrate:
- KYC/KYB verification
- Jurisdiction restrictions
- Sanctions screening
- Transaction risk checks

This slows adoption, increases cost, and limits institutional participation. There's no composable, on-chain compliance layer that makes regulation trustless, automated, and privacy-preserving.

## 💡 Solution

CompliFi is a compliance middleware that connects wallets, risk data, and attestations — enforcing policies directly in smart contracts.

### How It Works

1. **Policy as Code**: Developers or compliance teams define rules such as "User must have valid KYC attestation AND wallet risk score < 3 AND region == allowed." CompliFi converts these into executable on-chain logic.

2. **Modular Integrations**: CompliFi integrates existing Solana compliance primitives:
   - 🪪 **Identity**: Solana Attestation Service - Verify KYC/KYB or jurisdiction proofs
   - 🧠 **Risk**: Range Security Oracle - Fetch on-chain wallet risk scores
   - 🪙 **Token Control**: Token-2022 Extensions - Enforce compliance in token transfers
   - 🧾 **Audit**: MongoDB/Express Backend - Store hashed compliance logs for dashboards

3. **Smart Contract Flow**: When a user interacts with a DeFi dApp:
   - dApp calls `CompliFi.verifyPolicy(user, action)`
   - Smart contract checks KYC attestation, wallet risk score, and jurisdiction rules
   - Returns true/false, logs compliance proof

4. **Frontend Dashboard**: Visualize total transactions verified, compliance rate, risk violations over time, and real-time compliance events.

## 🧰 Tech Stack

| Layer | Tools |
|-------|-------|
| Blockchain | Solana (Anchor, Rust) |
| Identity | Solana Attestation Service |
| Risk Oracle | Range Security |
| Compliance Rules Engine | Rust smart contract logic |
| Backend | Node.js (Express) + MongoDB |
| Frontend | React + Solana Wallet Adapter |
| APIs | Helius / Triton for event monitoring |

## 🏗️ Architecture

```
User → dApp (DEX / Lender)
          ↓
     CompliFi SDK
          ↓
  [CompliFi Smart Contract]
      ↙︎         ↘︎
SAS Attestation   Range Oracle
      ↓                 ↓
Token-2022 Hook ←→ MongoDB (audit logs)
          ↓
   React Dashboard
```

## 📁 Project Structure

```
complifi/
├── programs/
│   └── complifi/
│       └── src/
│           └── lib.rs          # Main Anchor smart contract
├── backend/
│   └── src/
│       └── index.js             # Express + MongoDB API
├── dashboard/
│   ├── src/
│   │   ├── App.js               # React main component
│   │   └── components/
│   │       └── Dashboard.js     # Dashboard UI
│   └── public/
│       └── index.html
├── sdk/
│   └── src/
│       └── index.js              # CompliFi SDK for dApp integration
└── tests/
    └── complifi.ts               # Anchor tests
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Rust and Solana CLI
- Anchor CLI
- MongoDB

### Installation

#### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 2. Install Frontend Dependencies

```bash
cd dashboard
npm install
```

#### 3. Install SDK

```bash
cd sdk
npm install
```

#### 4. Build Anchor Program

```bash
# Install Anchor if not already installed
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest

# Build the program
anchor build
```

### Running the Project

#### Start MongoDB

```bash
# Make sure MongoDB is running locally or update connection string
```

#### Start Backend Server

```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

#### Start Frontend Dashboard

```bash
cd dashboard
npm start
# Dashboard runs on http://localhost:3000
```

#### Run Tests (when Anchor is set up)

```bash
anchor test
```

## 📖 Usage

### Using the SDK in Your DeFi dApp

```javascript
import { CompliFiSDK } from './sdk/src/index.js';
import { Connection, PublicKey } from '@solana/web3.js';

// Initialize SDK
const connection = new Connection('https://api.devnet.solana.com');
const complifi = new CompliFiSDK(connection);

// Verify compliance before allowing a transaction
const user = new PublicKey('...'); // User's wallet
const action = 'swap'; // Action being performed

const isCompliant = await complifi.verifyCompliance(user, action);

if (!isCompliant) {
  throw new Error('User does not meet compliance requirements');
}

// Proceed with transaction
// ... execute swap ...
```

### Smart Contract Integration

```rust
// In your Anchor program
use complifi::cpi::accounts::VerifyCompliance;
use complifi::program::CompliFi;

pub fn execute_swap(ctx: Context<Swap>, amount: u64) -> Result<()> {
    // Call CompliFi to verify compliance
    let cpi_accounts = VerifyCompliance {
        state: ctx.accounts.complifi_state.to_account_info(),
        user: ctx.accounts.user.to_account_info(),
    };
    
    let cpi_program = ctx.accounts.complifi_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    
    complifi::cpi::verify_compliance(cpi_ctx, ctx.accounts.user.key(), "swap".to_string())?;
    
    // Proceed with swap if compliant
    // ...
    
    Ok(())
}
```

## 💸 Example Use Case

A Solana DEX integrates CompliFi to ensure:
- ✅ Only KYC'd wallets can trade >$10,000
- ✅ Wallets with risk score ≥ 4 are blocked
- ✅ Transfers from restricted jurisdictions are denied
- ✅ All enforced automatically on-chain, no manual checks

## 🔧 Development

### Adding New Compliance Rules

Edit `programs/complifi/src/lib.rs` and add new validation logic in the `verify_compliance` function.

### Customizing the Dashboard

Edit `dashboard/src/components/Dashboard.js` to customize the UI and add new metrics.

### Extending the SDK

Edit `sdk/src/index.js` to add new helper functions or integrations.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please feel free to submit a Pull Request.

