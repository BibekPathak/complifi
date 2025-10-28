use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

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

    /// Verify compliance for a user action
    pub fn verify_compliance(
        ctx: Context<VerifyCompliance>,
        user: Pubkey,
        action: String,
    ) -> Result<()> {
        let state = &mut ctx.accounts.state;
        
        // Check KYC attestation
        let kyc_passed = true; // In production: query SAS
        require!(kyc_passed, CompliFiError::KycNotVerified);
        
        // Get wallet risk score (in production: query Range oracle)
        let risk_score = 2u8; // In production: fetch from oracle
        require!(risk_score < 4, CompliFiError::RiskScoreTooHigh);
        
        // Increment verification count
        state.verification_count = state.verification_count.checked_add(1).unwrap();
        
        emit!(VerificationEvent {
            user,
            action,
            verified: true,
            risk_score,
        });
        
        Ok(())
    }

    /// Admin function to set compliance policy
    pub fn set_policy(
        ctx: Context<SetPolicy>,
        max_risk_score: u8,
        require_kyc: bool,
    ) -> Result<()> {
        let policy = &mut ctx.accounts.policy;
        policy.max_risk_score = max_risk_score;
        policy.require_kyc = require_kyc;
        policy.authority = ctx.accounts.authority.key();
        
        msg!("Policy updated: max_risk_score={}, require_kyc={}", max_risk_score, require_kyc);
        
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
        
        Ok(())
    }
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
pub struct VerifyCompliance<'info> {
    #[account(mut)]
    pub state: Account<'info, ComplianceState>,
    
    pub user: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct SetPolicy<'info> {
    #[account(
        init_if_needed,
        payer = authority,
        space = 8 + CompliancePolicy::LEN
    )]
    pub policy: Account<'info, CompliancePolicy>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RecordViolation<'info> {
    #[account(mut)]
    pub state: Account<'info, ComplianceState>,
}

#[account]
pub struct ComplianceState {
    pub authority: Pubkey,
    pub verification_count: u64,
    pub violation_count: u64,
}

impl ComplianceState {
    pub const LEN: usize = 32 + 8 + 8;
}

#[account]
pub struct CompliancePolicy {
    pub authority: Pubkey,
    pub max_risk_score: u8,
    pub require_kyc: bool,
}

impl CompliancePolicy {
    pub const LEN: usize = 32 + 1 + 1;
}

#[event]
pub struct VerificationEvent {
    pub user: Pubkey,
    pub action: String,
    pub verified: bool,
    pub risk_score: u8,
}

#[event]
pub struct ViolationEvent {
    pub user: Pubkey,
    pub reason: String,
}

#[error_code]
pub enum CompliFiError {
    #[msg("KYC not verified")]
    KycNotVerified,
    
    #[msg("Risk score too high")]
    RiskScoreTooHigh,
    
    #[msg("Transaction amount exceeds limit for non-KYC users")]
    AmountExceedsLimit,
    
    #[msg("Jurisdiction not allowed")]
    JurisdictionNotAllowed,
}
