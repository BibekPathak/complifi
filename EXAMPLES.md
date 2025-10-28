# CompliFi Integration Examples

This document provides practical examples of integrating CompliFi into your DeFi dApp.

## Example 1: DEX with KYC Requirements

### Scenario
A decentralized exchange (DEX) requires KYC verification for trades over $10,000.

### Implementation

```javascript
import { CompliFiSDK } from './sdk/src/index.js';
import { Connection, PublicKey } from '@solana/web3.js';

const complifi = new CompliFiSDK(connection);

async function executeSwap(user, tokenA, tokenB, amount) {
  // Check if amount exceeds threshold
  if (amount > 10000) {
    // Verify KYC status
    const kycVerified = await complifi.checkKYC(user);
    if (!kycVerified) {
      throw new Error('KYC verification required for trades over $10,000');
    }
  }

  // Verify general compliance
  const isCompliant = await complifi.verifyCompliance(user, 'swap');
  if (!isCompliant) {
    throw new Error('User does not meet compliance requirements');
  }

  // Proceed with swap
  // ...
}
```

## Example 2: Lending Protocol with Risk-Based Limits

### Scenario
A lending protocol limits borrowing based on wallet risk scores.

### Implementation

```javascript
async function requestLoan(user, requestedAmount) {
  // Get wallet risk score
  const riskScore = await complifi.getRiskScore(user);
  
  // Higher risk = lower loan limit
  let maxLoan;
  if (riskScore === 0) {
    maxLoan = 100000; // $100k
  } else if (riskScore === 1) {
    maxLoan = 50000; // $50k
  } else if (riskScore === 2) {
    maxLoan = 25000; // $25k
  } else {
    throw new Error('Risk score too high for lending');
  }

  if (requestedAmount > maxLoan) {
    throw new Error(`Requested amount exceeds limit of $${maxLoan}`);
  }

  // Verify compliance
  const isCompliant = await complifi.verifyCompliance(user, 'lend');
  if (!isCompliant) {
    throw new Error('Compliance check failed');
  }

  // Process loan
  // ...
}
```

## Example 3: Token Transfer with Multi-Factor Compliance

### Scenario
A protocol requires multiple compliance checks before allowing token transfers.

### Implementation

```javascript
async function transferTokens(user, recipient, amount) {
  // Step 1: Verify KYC for both sender and recipient
  const senderKYC = await complifi.checkKYC(user);
  const recipientKYC = await complifi.checkKYC(recipient);
  
  if (!senderKYC || !recipientKYC) {
    throw new Error('Both parties must have KYC verification');
  }

  // Step 2: Check risk scores
  const senderRisk = await complifi.getRiskScore(user);
  const recipientRisk = await complifi.getRiskScore(recipient);
  
  if (senderRisk >= 3 || recipientRisk >= 3) {
    throw new Error('One or more wallets have high risk scores');
  }

  // Step 3: General compliance check
  const isCompliant = await complifi.verifyCompliance(user, 'transfer');
  if (!isCompliant) {
    throw new Error('Compliance verification failed');
  }

  // Log the verification
  await complifi.logVerification(
    user,
    'transfer',
    true,
    Math.max(senderRisk, recipientRisk),
    'pending'
  );

  // Execute transfer
  // ...
}
```

## Example 4: Smart Contract Integration (Anchor)

### Scenario
Integrating CompliFi into an Anchor program.

### Implementation

```rust
use anchor_lang::prelude::*;
use complifi::cpi::accounts::VerifyCompliance;
use complifi::program::CompliFi;

#[program]
pub mod my_dex {
    use super::*;

    pub fn swap(ctx: Context<Swap>, amount: u64) -> Result<()> {
        let user = &ctx.accounts.user;
        
        // Call CompliFi to verify compliance
        let cpi_accounts = VerifyCompliance {
            state: ctx.accounts.complifi_state.to_account_info(),
            user: user.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.complifi_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        complifi::cpi::verify_compliance(
            cpi_ctx,
            user.key(),
            "swap".to_string()
        )?;
        
        // If we get here, compliance passed
        // Proceed with swap logic
        // ...
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Swap<'info> {
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub complifi_state: Account<'info, complifi::state::ComplianceState>,
    
    /// CHECK: CompliFi program
    pub complifi_program: UncheckedAccount<'info>,
    
    // ... other accounts
}
```

## Example 5: Batch Verification

### Scenario
Verifying multiple users in a single batch operation.

### Implementation

```javascript
async function verifyBatch(users) {
  const results = await Promise.all(
    users.map(async (user) => {
      try {
        const isCompliant = await complifi.verifyCompliance(user, 'batch_check');
        return { user, compliant: isCompliant, error: null };
      } catch (error) {
        return { user, compliant: false, error: error.message };
      }
    })
  );

  const compliantUsers = results.filter(r => r.compliant);
  const nonCompliantUsers = results.filter(r => !r.compliant);

  return {
    total: users.length,
    compliant: compliantUsers.length,
    nonCompliant: nonCompliantUsers.length,
    results,
  };
}
```

## Example 6: Event-Driven Compliance

### Scenario
Monitoring compliance events from the blockchain.

### Implementation

```javascript
import { Connection } from '@solana/web3.js';

async function monitorComplianceEvents(connection, complifiProgramId) {
  // Listen for VerificationEvent from CompliFi program
  connection.onProgramAccountChange(
    complifiProgramId,
    (accountInfo, context) => {
      // Parse events and update dashboard
      const events = parseVerificationEvent(accountInfo.data);
      
      events.forEach(event => {
        console.log('Compliance event:', {
          user: event.user.toString(),
          action: event.action,
          verified: event.verified,
          riskScore: event.riskScore,
        });
        
        // Send to backend for logging
        complifi.logVerification(
          event.user,
          event.action,
          event.verified,
          event.riskScore,
          context.slot.toString()
        );
      });
    },
    'confirmed'
  );
}
```

## Testing Your Integration

### Unit Tests

```javascript
import { CompliFiSDK } from './sdk/src/index.js';
import { Connection } from '@solana/web3.js';
import { expect } from 'chai';

describe('CompliFi Integration', () => {
  let complifi;
  
  beforeEach(() => {
    const connection = new Connection('http://localhost:8899');
    complifi = new CompliFiSDK(connection);
  });

  it('should verify compliant user', async () => {
    const user = new PublicKey('...'); // Mock user
    const result = await complifi.verifyCompliance(user, 'swap');
    expect(result).to.be.true;
  });

  it('should reject high-risk user', async () => {
    const user = new PublicKey('...'); // Mock high-risk user
    const riskScore = await complifi.getRiskScore(user);
    expect(riskScore).to.be.above(3);
  });
});
```

## Best Practices

1. **Always verify before transactions**: Check compliance before executing any financial transaction.

2. **Cache results when possible**: Compliance checks can be expensive. Cache results for a short period.

3. **Handle errors gracefully**: Provide clear error messages to users about why a transaction failed.

4. **Log everything**: Track all compliance checks for audit purposes.

5. **Update policies regularly**: Keep your compliance policies up to date with regulatory changes.

6. **Test thoroughly**: Test your integration with various user profiles and edge cases.

## Support

For more examples and help, please see:
- Main README.md
- Dashboard: http://localhost:3000
- Backend API: http://localhost:3001

