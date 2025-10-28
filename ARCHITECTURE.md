# CompliFi Architecture

This document describes the architecture and design decisions for CompliFi.

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                       User Layer                              │
│  - DeFi dApp (DEX, Lending, etc.)                            │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                    CompliFi SDK Layer                         │
│  - verifyCompliance(user, action)                            │
│  - checkKYC(user)                                            │
│  - getRiskScore(user)                                         │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              Smart Contract Layer (Anchor)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  CompliFi Program (programs/complifi/)                 │  │
│  │  - verify_compliance()                                 │  │
│  │  - set_policy()                                        │  │
│  │  - record_violation()                                  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────┬──────────────────────────────────────────┬───────────┘
        │                                          │
        ▼                                          ▼
┌──────────────────┐                    ┌──────────────────────┐
│  SAS Integration │                    │  Range Risk Oracle   │
│  - KYC Checks    │                    │  - Wallet Risk Scores│
└──────────────────┘                    └──────────────────────┘
        │                                          │
        └──────────────┬───────────────────────────┘
                       ▼
        ┌──────────────────────────────┐
        │    MongoDB Backend API        │
        │  - Audit Logs                 │
        │  - Violations                 │
        │  - Statistics                 │
        └──────────────┬────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │    React Dashboard            │
        │  - Real-time Monitoring       │
        │  - Charts & Stats             │
        │  - Compliance Logs            │
        └──────────────────────────────┘
```

## Component Details

### 1. Smart Contract (Anchor Program)

**Location**: `programs/complifi/src/lib.rs`

**Responsibilities**:
- Verify user compliance before transactions
- Check KYC attestations via SAS
- Fetch wallet risk scores from Range oracle
- Enforce compliance policies
- Record violations
- Emit events for off-chain monitoring

**Key Data Structures**:
```rust
pub struct ComplianceState {
    pub authority: Pubkey,
    pub verification_count: u64,
    pub violation_count: u64,
}

pub struct CompliancePolicy {
    pub authority: Pubkey,
    pub max_risk_score: u8,
    pub require_kyc: bool,
}
```

**Key Functions**:
- `initialize()`: Initialize the program
- `verify_compliance()`: Verify user meets compliance requirements
- `set_policy()`: Admin function to update policies
- `record_violation()`: Log policy violations

### 2. Backend API (Node.js/Express)

**Location**: `backend/src/index.js`

**Responsibilities**:
- Store compliance logs in MongoDB
- Store violation records
- Provide statistics API
- Serve data to dashboard
- Real-time event processing

**API Endpoints**:
- `GET /health` - Health check
- `GET /api/stats` - Get compliance statistics
- `GET /api/logs` - Get all compliance logs
- `POST /api/logs` - Create compliance log
- `GET /api/violations` - Get all violations
- `POST /api/violations` - Log a violation

**Database Schema**:
```javascript
ComplianceLog {
  user: String,
  action: String,
  verified: Boolean,
  risk_score: Number,
  timestamp: Date,
  tx_signature: String,
  details: Object
}

ViolationLog {
  user: String,
  reason: String,
  timestamp: Date,
  tx_signature: String
}
```

### 3. React Dashboard

**Location**: `dashboard/src/`

**Responsibilities**:
- Display compliance statistics
- Show real-time compliance events
- Visualize risk score distribution
- Display recent logs and violations
- Connect Solana wallet

**Key Components**:
- `App.js`: Main app with wallet provider
- `Dashboard.js`: Dashboard component with charts and logs

**Features**:
- Real-time updates (5-second refresh)
- Responsive design
- Solana Wallet Adapter integration
- Recharts for data visualization

### 4. SDK

**Location**: `sdk/src/index.js`

**Responsibilities**:
- Provide easy-to-use API for dApp integration
- Abstract away smart contract complexity
- Handle communication with backend
- Simplify compliance verification

**Key Methods**:
```javascript
class CompliFiSDK {
  async verifyCompliance(user, action)
  async checkKYC(user)
  async getRiskScore(user)
  async logVerification(user, action, verified, riskScore)
  async logViolation(user, reason)
}
```

## Data Flow

### Compliance Verification Flow

```
1. User initiates transaction in dApp
   ↓
2. dApp calls SDK.verifyCompliance(user, action)
   ↓
3. SDK calls smart contract verify_compliance()
   ↓
4. Smart contract checks:
   - KYC attestation (via SAS)
   - Risk score (via Range oracle)
   - Jurisdiction rules
   ↓
5. Returns true/false
   ↓
6. If true, transaction proceeds
   If false, transaction rejected
   ↓
7. SDK logs to backend API
   ↓
8. Dashboard updates in real-time
```

### Event Processing

```
Smart Contract emits event
   ↓
Helius/Triton API monitors chain
   ↓
Backend API receives event
   ↓
Stores in MongoDB
   ↓
Dashboard polls API
   ↓
UI updates with new data
```

## Security Considerations

1. **Access Control**: Only authorized accounts can set policies
2. **Data Privacy**: No sensitive user data stored on-chain
3. **Oracle Security**: Risk scores come from trusted oracles
4. **Event Logging**: All compliance events are logged for audit
5. **Upgrade Path**: Program can be upgraded with governance

## Extensibility

### Adding New Compliance Rules

Edit `lib.rs` and add new checks:

```rust
pub fn verify_compliance(
    ctx: Context<VerifyCompliance>,
    user: Pubkey,
    action: String,
) -> Result<()> {
    // Existing checks
    let kyc_passed = check_attestation(&user, "KYC_PASS")?;
    let risk_score = get_wallet_risk(&user)?;
    
    // Add new check here
    let custom_check = verify_custom_rule(&user)?;
    require!(custom_check, CompliFiError::CustomRuleViolated);
    
    Ok(())
}
```

### Adding New Integrations

Add new modules in the SDK:

```javascript
async checkSanctions(user) {
  // Query sanctions list
}

async verifyJurisdiction(user) {
  // Check jurisdiction rules
}
```

## Performance Optimizations

1. **Caching**: Cache compliance results for short periods
2. **Batch Processing**: Verify multiple users in single call
3. **Event Indexing**: Use indexes on database fields
4. **Lazy Loading**: Load dashboard data on demand

## Future Enhancements

1. **ZK Proofs**: Use zero-knowledge proofs for privacy
2. **Cross-Chain**: Support multiple blockchains
3. **ML Models**: Use ML for dynamic risk scoring
4. **Governance**: DAO for policy decisions
5. **Mobile SDK**: Native mobile integration

## Deployment

### Smart Contract
```bash
anchor build
anchor deploy --provider.cluster mainnet-beta
```

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd dashboard
npm install
npm run build
# Deploy to Vercel/Netlify
```

## Monitoring

- **Health Checks**: Monitor all services
- **Error Tracking**: Log all errors
- **Performance Metrics**: Track response times
- **Security Alerts**: Monitor for suspicious activity

## Testing Strategy

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test SDK + Contract
3. **E2E Tests**: Test full flow
4. **Security Tests**: Fuzz testing

