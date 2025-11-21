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

- **Node.js 18+**
- **Rust and Solana CLI** (installed and configured)
- **MongoDB** (local instance or MongoDB Atlas)
- **WSL/Ubuntu** (recommended on Windows for Anchor development)
- **Rust Toolchain 1.74.1** (required for Anchor 0.32.1 compatibility)
- **Anchor CLI 0.32.1**

### Setup Instructions

#### 1. Configure Rust Toolchain (IMPORTANT)

Anchor 0.32.1 requires Rust 1.74.1. If you're using a newer version, you'll encounter build errors.

**In WSL/Ubuntu:**

```bash
# Install and set Rust 1.74.1
rustup toolchain install 1.74.1
cd /mnt/d/compliFi  # or your project path
rustup override set 1.74.1

# Verify version
rustc --version  # should show 1.74.1
```

#### 2. Install Anchor CLI

```bash
# Option A: Install via cargo (may require newer Rust temporarily)
rustup toolchain install 1.82.1
rustup default 1.82.1
cargo install --locked --force anchor-cli --version 0.32.1
rustup default 1.74.1  # Switch back

# Option B: Use AVM (Anchor Version Manager)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1

# Verify installation
anchor --version  # should show 0.32.1
```

#### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

#### 4. Install Frontend Dependencies

```bash
cd dashboard
npm install
```

#### 5. Install Test Dependencies

```bash
# From project root
npm install -D ts-mocha ts-node typescript chai @types/chai @types/mocha @coral-xyz/anchor
```

#### 6. Build Anchor Program

```bash
# Make sure you're using Rust 1.74.1
rustup override set 1.74.1

# Build the program
anchor build
```

### Running the Project

#### Start MongoDB

**Option A: Docker (Recommended)**

```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: MongoDB Atlas**

Update the connection string in `backend/src/index.js`:

```javascript
const MONGODB_URI = process.env.MONGODB_URI || 'your-atlas-connection-string';
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

#### Run Tests

```bash
# From project root (in WSL/Ubuntu)
anchor test
```

### Project Features

This implementation includes:

- **Mock SAS (Solana Attestation Service)** with PDA-based registry for KYC attestations
- **Mock Range Security Oracle** with risk scores from 0-5
- **On-chain compliance verification** with KYC, risk score, and jurisdiction checks
- **Express backend** for audit logging and violation tracking
- **React dashboard** with Solana Wallet Adapter integration
- **SDK** for easy dApp integration

### Troubleshooting

#### Build Errors

**Error: `no method named local_file found for struct proc_macro::Span`**

This means your Rust toolchain is too new. Ensure you're using Rust 1.74.1:

```bash
rustup override set 1.74.1
cargo clean
anchor build
```

**Error: `Stack offset exceeded`**

Also a toolchain issue. Use Rust 1.74.1 as specified above.

**Error: `DeclaredProgramIdMismatch`**

The program ID in `programs/complifi/src/lib.rs` must match `Anchor.toml`. Current ID: `JE1YTqS1Z6MR5y7oxVnS6TpnRHTPDcJQg87TzByu5jCk`

#### Frontend Issues

If you see webpack errors about missing polyfills (`crypto`, `stream`), the `config-overrides.js` should handle this. If not:

```bash
cd dashboard
rm -rf node_modules package-lock.json
npm install
```

#### Backend Issues

If the backend returns 500 errors, check MongoDB connection. The API gracefully handles missing MongoDB with empty responses for demo purposes.

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

