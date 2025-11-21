use anchor_lang::prelude::*;
mod state;
mod error;
pub use state::*;
pub use error::*;

declare_id!("8n1D2rYYeUnfrWN4qTDHAvvbEokbPop6cbeSNZ3brNeU");

// Constants for integration
const SAS_PROGRAM_ID: &str = "SASFcCrMYnS1ZZz7B4XGpBKMJHrHkGGtT9oJRKrWYAh";
const RANGE_ORACLE_PROGRAM_ID: &str = "RNG3P5GZ3WjKQjJ1f6yHSHJNLSBV4V5qrDdBvuKKTtd";

// Seeds for PDAs
pub const KYC_ATTESTATION_SEED: &[u8] = b"kyc-attestation";

#[program]
pub mod complifi {
    use super::*;

    /// Initialize the compliance verification program
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.authority = ctx.accounts.authority.key();
        state.verification_count = 0;
        state.violation_count = 0;
        Ok(())
    }

    /// Initialize a new compliance policy
    pub fn initialize_policy(ctx: Context<InitializePolicy>) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.max_risk_score = 3; // Default: Medium risk tolerance
        policy.require_kyc = true; // Default: Require KYC
        policy.allowed_jurisdictions = [0; 10]; // Default: No jurisdictions allowed
        
        msg!("Compliance policy initialized with default settings");
        Ok(())
    }
    
    /// Create or update a KYC attestation for a wallet
    pub fn create_kyc_attestation(
        ctx: Context<CreateKycAttestation>,
        wallet: Pubkey,
        is_verified: bool,
        jurisdiction: u8,
    ) -> Result<()> {
        let attestation = &mut ctx.accounts.attestation;
        let clock = Clock::get()?;
        
        attestation.wallet = wallet;
        attestation.is_verified = is_verified;
        attestation.authority = ctx.accounts.authority.key();
        attestation.timestamp = clock.unix_timestamp;
        attestation.jurisdiction = jurisdiction;
        
        emit!(KycAttestationEvent {
            wallet,
            is_verified,
            jurisdiction,
        });
        
        msg!("KYC attestation created for wallet: {}", wallet);
        Ok(())
    }

    /// Verify compliance for a user action
    pub fn verify_compliance(
        ctx: Context<VerifyCompliance>,
        user: Pubkey,
        action: String,
    ) -> Result<()> {
        let policy = &ctx.accounts.policy;
        
        // 1. Check KYC attestation using our PDA-based registry
        if policy.require_kyc {
            // Find the KYC attestation PDA for this user
            let (_attestation_pda, _) = Pubkey::find_program_address(
                &[KYC_ATTESTATION_SEED, user.as_ref()],
                &id()
            );
            
            // Check if the attestation exists and is verified
            let attestation_account: &KycAttestation = &ctx.accounts.attestation;
            
            // Verify the attestation is for the correct user
            require!(attestation_account.wallet == user, CompliFiError::KycNotVerified);
            
            // Verify the attestation is valid
            require!(attestation_account.is_verified, CompliFiError::KycNotVerified);
            
            // Check jurisdiction is allowed
            let jurisdiction_idx = (attestation_account.jurisdiction / 8) as usize;
            let jurisdiction_bit = 1 << (attestation_account.jurisdiction % 8);
            
            if jurisdiction_idx < policy.allowed_jurisdictions.len() {
                require!(
                    (policy.allowed_jurisdictions[jurisdiction_idx] & jurisdiction_bit) != 0,
                    CompliFiError::RestrictedJurisdiction
                );
            } else {
                return err!(CompliFiError::RestrictedJurisdiction);
            }
        }
        
        // 2. Get wallet risk score from Range Security Oracle
        let risk_score = get_wallet_risk_score(&ctx, &user)?;
        require!(
            risk_score <= policy.max_risk_score, 
            CompliFiError::RiskScoreTooHigh
        );
        
        // 3. Increment verification count
        let state = &mut ctx.accounts.state;
        state.verification_count = state.verification_count.checked_add(1).unwrap();
        
        // 4. Emit verification event
        emit!(VerificationEvent {
            user,
            action,
            verified: true,
            risk_score,
        });
        
        msg!("Compliance verification passed for user: {}", user);
        Ok(())
    }

    /// Admin function to set compliance policy
    pub fn set_policy(
        ctx: Context<SetPolicy>,
        max_risk_score: u8,
        require_kyc: bool,
        allowed_jurisdictions: [u8; 10],
    ) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        
        // Validate policy parameters
        require!(max_risk_score <= 10, CompliFiError::InvalidPolicyParameters);
        
        policy.max_risk_score = max_risk_score;
        policy.require_kyc = require_kyc;
        policy.allowed_jurisdictions = allowed_jurisdictions;
        
        msg!("Policy updated: max_risk_score={}, require_kyc={}", 
            max_risk_score, require_kyc);
        
        Ok(())
    }

    /// Record a compliance violation
    pub fn record_violation(
        ctx: Context<RecordViolation>,
        user: Pubkey,
        reason: String,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        state.violation_count = state.violation_count.checked_add(1).unwrap();
        
        emit!(ViolationEvent {
            user,
            reason,
        });
        
        msg!("Compliance violation recorded for user: {}", user);
        Ok(())
    }
}

// Helper function to verify attestation with SAS
fn verify_attestation(ctx: &Context<VerifyCompliance>, user: &Pubkey) -> Result<bool> {
    // In a real implementation, we would call the SAS program here
    // For hackathon purposes, we'll simulate this check
    
    msg!("Verifying KYC attestation for user: {}", user);
    
    // Simulated attestation check - in production this would call the SAS program
    // and verify the attestation cryptographically
    Ok(true)
}

// Helper function to get wallet risk score from Range Oracle
fn get_wallet_risk_score(ctx: &Context<VerifyCompliance>, user: &Pubkey) -> Result<u8> {
    // In a real implementation, we would call the Range Oracle program here
    // For hackathon purposes, we'll simulate this check
    
    msg!("Fetching risk score for user: {}", user);
    
    // Simulated risk score - in production this would call the Range Oracle
    // and fetch the actual risk score for the wallet
    Ok(2) // Low-medium risk
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ComplianceState::LEN
    )]
    pub state: Account<'info, ComplianceState>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePolicy<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + CompliancePolicy::LEN
    )]
    pub policy: Account<'info, CompliancePolicy>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCompliance<'info> {
    #[account(mut)]
    pub state: Account<'info, ComplianceState>,
    
    #[account(
        constraint = policy.authority == state.authority @ CompliFiError::Unauthorized
    )]
    pub policy: Account<'info, CompliancePolicy>,
    
    pub authority: Signer<'info>,
    
    /// CHECK: Only the public key is used to look up attestations/risk off-chain; no data is read or written.
    pub user: UncheckedAccount<'info>,
    
    #[account(
        seeds = [KYC_ATTESTATION_SEED, user.key().as_ref()],
        bump,
    )]
    pub attestation: Account<'info, KycAttestation>,
}

#[derive(Accounts)]
pub struct CreateKycAttestation<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + KycAttestation::LEN,
        seeds = [KYC_ATTESTATION_SEED, wallet.key().as_ref()],
        bump
    )]
    pub attestation: Account<'info, KycAttestation>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub state: Account<'info, ComplianceState>,
    
    /// CHECK: This is the wallet we're creating an attestation for
    pub wallet: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPolicy<'info> {
    #[account(
        mut,
        constraint = policy.authority == authority.key() @ CompliFiError::Unauthorized
    )]
    pub policy: Account<'info, CompliancePolicy>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordViolation<'info> {
    #[account(mut)]
    pub state: Account<'info, ComplianceState>,
    
    #[account(
        constraint = authority.key() == state.authority @ CompliFiError::Unauthorized
    )]
    pub authority: Signer<'info>,
}

