use anchor_lang::prelude::*;

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
    pub allowed_jurisdictions: [u8; 10], // Bitmap of allowed jurisdictions
}

impl CompliancePolicy {
    pub const LEN: usize = 32 + 1 + 1 + 10;
}

#[account]
pub struct KycAttestation {
    pub wallet: Pubkey,      // The wallet this attestation is for
    pub is_verified: bool,   // Whether the wallet has passed KYC
    pub authority: Pubkey,   // Authority that created this attestation
    pub timestamp: i64,      // When the attestation was created/updated
    pub jurisdiction: u8,    // Jurisdiction code
}

impl KycAttestation {
    pub const LEN: usize = 32 + 1 + 32 + 8 + 1;
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

#[event]
pub struct KycAttestationEvent {
    pub wallet: Pubkey,
    pub is_verified: bool,
    pub jurisdiction: u8,
}

