use anchor_lang::prelude::*;

#[error_code]
pub enum CompliFiError {
    #[msg("KYC verification failed or not found")]
    KycNotVerified,
    
    #[msg("Wallet risk score is too high")]
    RiskScoreTooHigh,
    
    #[msg("User is from a restricted jurisdiction")]
    RestrictedJurisdiction,
    
    #[msg("Unauthorized access")]
    Unauthorized,
    
    #[msg("Invalid policy parameters")]
    InvalidPolicyParameters,
    
    #[msg("Attestation verification failed")]
    AttestationVerificationFailed,
    
    #[msg("Oracle data fetch failed")]
    OracleDataFetchFailed,
}