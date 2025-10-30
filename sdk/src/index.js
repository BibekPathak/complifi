import { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN, web3 } from '@project-serum/anchor';
import bs58 from 'bs58';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Update with your actual program ID after deployment
const COMPLIFI_PROGRAM_ID = new PublicKey('JE1YTqS1Z6MR5y7oxVnS6TpnRHTPDcJQg87TzByu5jCk');
const BACKEND_URL = 'http://localhost:3001';

/**
 * CompliFi SDK for easy integration with DeFi protocols
 */
export class CompliFiSDK {
  /**
   * Initialize the SDK
   * @param {Connection} connection - Solana connection
   * @param {string} complifiProgramId - CompliFi program ID
   * @param {string} backendUrl - CompliFi backend URL
   */
  constructor(connection, complifiProgramId = COMPLIFI_PROGRAM_ID, backendUrl = BACKEND_URL) {
    this.connection = connection;
    this.programId = new PublicKey(complifiProgramId);
    this.backendUrl = backendUrl;
    
    // Initialize program with default provider if available
    if (window.solana) {
      const provider = new AnchorProvider(
        connection, 
        window.solana, 
        { commitment: 'processed' }
      );
      this.program = new Program(this.getIDL(), this.programId, provider);
    }
  }

  /**
   * Set wallet for SDK operations
   * @param {Wallet} wallet - Solana wallet (must implement signTransaction)
   */
  setWallet(wallet) {
    const provider = new AnchorProvider(
      this.connection,
      wallet,
      { commitment: 'processed' }
    );
    this.program = new Program(this.getIDL(), this.programId, provider);
    this.wallet = wallet;
  }

  /**
   * Get the CompliFi IDL
   * This would normally be loaded from a file or fetched from the chain
   */
  getIDL() {
    return {
      version: "0.1.0",
      name: "complifi",
      instructions: [
        {
          name: "initialize",
          accounts: [
            { name: "state", isMut: true, isSigner: false },
            { name: "authority", isMut: true, isSigner: true },
            { name: "systemProgram", isMut: false, isSigner: false }
          ],
          args: []
        },
        {
          name: "initializePolicy",
          accounts: [
            { name: "policy", isMut: true, isSigner: false },
            { name: "authority", isMut: true, isSigner: true },
            { name: "systemProgram", isMut: false, isSigner: false }
          ],
          args: []
        },
        {
          name: "verifyCompliance",
          accounts: [
            { name: "state", isMut: true, isSigner: false },
            { name: "policy", isMut: false, isSigner: false },
            { name: "authority", isMut: false, isSigner: true },
            { name: "user", isMut: false, isSigner: false }
          ],
          args: [
            { name: "user", type: "publicKey" },
            { name: "action", type: "string" }
          ]
        }
      ],
      accounts: [
        {
          name: "ComplianceState",
          type: {
            kind: "struct",
            fields: [
              { name: "authority", type: "publicKey" },
              { name: "verificationCount", type: "u64" },
              { name: "violationCount", type: "u64" }
            ]
          }
        },
        {
          name: "CompliancePolicy",
          type: {
            kind: "struct",
            fields: [
              { name: "authority", type: "publicKey" },
              { name: "maxRiskScore", type: "u8" },
              { name: "requireKyc", type: "bool" },
              { name: "allowedJurisdictions", type: { array: ["u8", 10] } }
            ]
          }
        }
      ],
      events: [
        {
          name: "VerificationEvent",
          fields: [
            { name: "user", type: "publicKey", index: false },
            { name: "action", type: "string", index: false },
            { name: "verified", type: "bool", index: false },
            { name: "riskScore", type: "u8", index: false }
          ]
        },
        {
          name: "ViolationEvent",
          fields: [
            { name: "user", type: "publicKey", index: false },
            { name: "reason", type: "string", index: false }
          ]
        }
      ],
      errors: [
        { code: 6000, name: "KycNotVerified", msg: "KYC verification failed or not found" },
        { code: 6001, name: "RiskScoreTooHigh", msg: "Wallet risk score is too high" },
        { code: 6002, name: "RestrictedJurisdiction", msg: "User is from a restricted jurisdiction" },
        { code: 6003, name: "Unauthorized", msg: "Unauthorized access" },
        { code: 6004, name: "InvalidPolicyParameters", msg: "Invalid policy parameters" },
        { code: 6005, name: "AttestationVerificationFailed", msg: "Attestation verification failed" },
        { code: 6006, name: "OracleDataFetchFailed", msg: "Oracle data fetch failed" }
      ]
    };
  }

  /**
   * Verify compliance for a user action
   * @param {PublicKey} user - User's public key
   * @param {string} action - Action being performed (e.g., 'swap', 'lend', 'withdraw')
   * @returns {Promise<{verified: boolean, tx?: string, details?: object}>} - Compliance result
   */
  async verifyCompliance(user, action) {
    try {
      if (!this.program) {
        throw new Error("SDK not initialized with wallet. Call setWallet() first.");
      }

      console.log(`Verifying compliance for user: ${user.toBase58()}, action: ${action}`);
      
      // Get state and policy accounts
      const [statePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("state")],
        this.programId
      );
      
      const [policyPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("policy")],
        this.programId
      );

      // Call the on-chain program to verify compliance
      const tx = await this.program.methods
        .verifyCompliance(user, action)
        .accounts({
          state: statePDA,
          policy: policyPDA,
          authority: this.wallet.publicKey,
          user: user
        })
        .rpc();
      
      console.log("Compliance verification transaction:", tx);
      
      // Log the verification to the backend
      const riskScore = await this.getRiskScore(user);
      await this.logVerification(user, action, true, riskScore, tx);
      
      return {
        verified: true,
        tx,
        details: {
          riskScore,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Compliance verification failed:', error);
      
      // Determine the reason for failure
      let reason = "Unknown error";
      if (error.message.includes("KycNotVerified")) {
        reason = "KYC verification failed";
      } else if (error.message.includes("RiskScoreTooHigh")) {
        reason = "Risk score too high";
      } else if (error.message.includes("RestrictedJurisdiction")) {
        reason = "User from restricted jurisdiction";
      }
      
      // Log the violation to the backend
      await this.logViolation(user, reason);
      
      return {
        verified: false,
        details: {
          reason,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Check if a user has a valid KYC attestation
   * @param {PublicKey} user - User's public key
   * @returns {Promise<{isVerified: boolean, jurisdiction: number}>} - KYC verification status
   */
  async checkKYC(user) {
    try {
      console.log(`Checking KYC attestation for user: ${user.toBase58()}`);
      
      // Find the KYC attestation PDA for this user
      const [attestationPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("kyc-attestation"), user.toBuffer()],
        this.programId
      );
      
      // Try to fetch the attestation account
      try {
        const attestationAccount = await this.program.account.kycAttestation.fetch(attestationPDA);
        console.log(`Found KYC attestation for ${user.toBase58()}: ${attestationAccount.isVerified ? 'Verified' : 'Not Verified'}`);
        
        return {
          isVerified: attestationAccount.isVerified,
          jurisdiction: attestationAccount.jurisdiction,
          timestamp: new BN(attestationAccount.timestamp).toNumber()
        };
      } catch (error) {
        // If the account doesn't exist, return not verified
        console.log(`No KYC attestation found for ${user.toBase58()}`);
        return {
          isVerified: false,
          jurisdiction: 0,
          timestamp: 0
        };
      }
    } catch (error) {
      console.error('KYC check failed:', error);
      return {
        isVerified: false,
        jurisdiction: 0,
        timestamp: 0
      };
    }
  }

  /**
   * Get risk score for a wallet from Range Security Oracle
   * @param {PublicKey} user - User's public key
   * @returns {Promise<number>} - Risk score (0-10)
   */
  async getRiskScore(user) {
    try {
      // Get the wallet address as a string
      const walletAddress = user.toBase58();
      console.log(`Getting risk score for user: ${walletAddress}`);
      
      // Load risk scores from JSON file
      const riskScoresPath = path.resolve(__dirname, 'risk-scores.json');
      const riskScoresData = JSON.parse(fs.readFileSync(riskScoresPath, 'utf8'));
      
      let score;
      let source;
      let metadata = {};
      
      // Check if this wallet has a predefined risk score
      if (riskScoresData.wallets[walletAddress]) {
        score = riskScoresData.wallets[walletAddress];
        source = 'predefined';
        console.log(`Found predefined risk score for ${walletAddress}: ${score}`);
      } else {
        // For wallets not in the JSON file, generate a random score within the default range
        const { min, max } = riskScoresData.default_range;
        score = Math.floor(Math.random() * (max - min + 1)) + min;
        source = 'random';
        metadata.min = min;
        metadata.max = max;
        console.log(`Generated random risk score for ${walletAddress}: ${score}`);
      }
      
      // Log the risk score to the backend for analytics
      try {
        await this.logRiskScore(walletAddress, score, source, metadata);
      } catch (logError) {
        console.error('Failed to log risk score:', logError);
        // Continue even if logging fails
      }
      
      return score;
    } catch (error) {
      console.error('Risk score check failed:', error);
      
      // Log the error
      try {
        await this.logRiskScore(user.toBase58(), 5, 'error', { error: error.message });
      } catch (logError) {
        console.error('Failed to log risk score error:', logError);
      }
      
      return 5; // Default to medium risk on error
    }
  }
  
  /**
   * Log a risk score check to the backend
   * @param {string} wallet - Wallet address
   * @param {number} score - Risk score
   * @param {string} source - Source of the risk score (predefined, random, oracle, error)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<void>}
   */
  async logRiskScore(wallet, score, source, metadata = {}) {
    try {
      // Enhanced metadata for better analytics
      const enhancedMetadata = {
        ...metadata,
        timestamp: new Date().toISOString(),
        sdk_version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        client_timestamp: new Date().toISOString(),
        score_category: this.getRiskCategory(score),
        request_id: `risk-${wallet.slice(0, 8)}-${Date.now()}`,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'node',
      };
      
      const response = await axios.post(`${this.backendUrl}/api/risk-scores`, {
        wallet,
        score,
        source,
        timestamp: new Date().toISOString(), // Explicit timestamp for the log entry
        metadata: enhancedMetadata,
        tx_signature: metadata.tx_signature || null
      });
      
      console.log(`Risk score logged successfully for ${wallet}`);
      return response.data;
    } catch (error) {
      console.error('Failed to log risk score:', error);
      throw error;
    }
  }
  
  /**
   * Get risk category based on score
   * @param {number} score - Risk score (0-10)
   * @returns {string} - Risk category
   */
  getRiskCategory(score) {
    if (score <= 1) return 'very_low';
    if (score <= 3) return 'low';
    if (score <= 5) return 'medium';
    if (score <= 7) return 'high';
    return 'very_high';
  }
  
  /**
   * Create or update a KYC attestation for a wallet
   * @param {PublicKey} wallet - Wallet to create attestation for
   * @param {boolean} isVerified - Whether the wallet is KYC verified
   * @param {number} jurisdiction - Jurisdiction code (0-255)
   * @returns {Promise<string>} - Transaction signature
   */
  async createKycAttestation(wallet, isVerified, jurisdiction) {
    try {
      // Find the KYC attestation PDA for this wallet
      const [attestationPda] = await PublicKey.findProgramAddress(
        [Buffer.from("kyc_attestation"), wallet.toBuffer()],
        this.programId
      );
      
      // Create the attestation on-chain
      const tx = await this.program.methods
        .createKycAttestation(isVerified, jurisdiction)
        .accounts({
          attestation: attestationPda,
          authority: this.wallet.publicKey,
          state: this.statePda,
          wallet: wallet,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
        
      // Also store in backend
      await axios.post(`${this.backendUrl}/api/kyc`, {
        wallet: wallet.toBase58(),
        is_verified: isVerified,
        jurisdiction: jurisdiction,
        tx_signature: tx
      });
      
      console.log(`Created KYC attestation for ${wallet.toBase58()}: verified=${isVerified}, jurisdiction=${jurisdiction}`);
      return tx;
    } catch (error) {
      console.error("Error creating KYC attestation:", error);
      throw error;
    }
  }

  /**
   * Log a compliance verification to the backend
   * @param {PublicKey} user - User's public key
   * @param {string} action - Action being performed
   * @param {boolean} verified - Whether compliance was verified
   * @param {number} riskScore - User's risk score
   * @param {string} txSignature - Transaction signature
   */
  async logVerification(user, action, verified, riskScore, txSignature) {
    try {
      const response = await axios.post(`${this.backendUrl}/api/logs`, {
        user: user.toBase58(),
        action,
        verified,
        risk_score: riskScore,
        tx_signature: txSignature,
        details: {
          timestamp: new Date().toISOString()
        }
      });
      
      console.log('Verification logged:', response.data);
    } catch (error) {
      console.error('Failed to log verification:', error);
    }
  }

  /**
   * Log a compliance violation to the backend
   * @param {PublicKey} user - User's public key
   * @param {string} reason - Reason for violation
   */
  async logViolation(user, reason) {
    try {
      const response = await axios.post(`${this.backendUrl}/api/violations`, {
        user: user.toBase58(),
        reason,
        tx_signature: null
      });
      
      console.log('Violation logged:', response.data);
    } catch (error) {
      console.error('Failed to log violation:', error);
    }
  }

  /**
   * Initialize the CompliFi program (admin function)
   * @returns {Promise<string>} - Transaction signature
   */
  async initialize() {
    if (!this.program) {
      throw new Error("SDK not initialized with wallet. Call setWallet() first.");
    }

    const [statePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("state")],
      this.programId
    );

    const tx = await this.program.methods
      .initialize()
      .accounts({
        state: statePDA,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    
    console.log("CompliFi initialized:", tx);
    return tx;
  }
  
  /**
   * Create or update a KYC attestation for a wallet
   * @param {PublicKey} wallet - Wallet to create attestation for
   * @param {boolean} isVerified - Whether the wallet is KYC verified
   * @param {number} jurisdiction - Jurisdiction code (0-255)
   * @returns {Promise<string>} - Transaction signature
   */
  async createKycAttestation(wallet, isVerified, jurisdiction) {
    try {
      if (!this.program) {
        throw new Error("SDK not initialized with wallet. Call setWallet() first.");
      }
      
      console.log(`Creating KYC attestation for wallet: ${wallet.toBase58()}`);
      
      // Find the KYC attestation PDA for this wallet
      const [attestationPDA] = await PublicKey.findProgramAddress(
        [Buffer.from("kyc-attestation"), wallet.toBuffer()],
        this.programId
      );
      
      // Find the state PDA
      const [statePDA] = await PublicKey.findProgramAddress(
        [Buffer.from("state")],
        this.programId
      );
      
      // Create the attestation
      const tx = await this.program.methods
        .createKycAttestation(wallet, isVerified, jurisdiction)
        .accounts({
          attestation: attestationPDA,
          authority: this.wallet.publicKey,
          state: statePDA,
          wallet: wallet,
          systemProgram: SystemProgram.programId
        })
        .rpc();
      
      console.log("KYC attestation created:", tx);
      
      // Log to backend
      await axios.post(`${this.backendUrl}/api/kyc`, {
        wallet: wallet.toBase58(),
        is_verified: isVerified,
        jurisdiction,
        tx_signature: tx
      });
      
      return tx;
    } catch (error) {
      console.error('KYC attestation creation failed:', error);
      throw error;
    }
  }

  /**
   * Initialize a compliance policy (admin function)
   * @returns {Promise<string>} - Transaction signature
   */
  async initializePolicy() {
    if (!this.program) {
      throw new Error("SDK not initialized with wallet. Call setWallet() first.");
    }

    const [policyPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("policy")],
      this.programId
    );

    const tx = await this.program.methods
      .initializePolicy()
      .accounts({
        policy: policyPDA,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId
      })
      .rpc();
    
    console.log("Policy initialized:", tx);
    return tx;
  }

  /**
   * Set compliance policy parameters (admin function)
   * @param {number} maxRiskScore - Maximum allowed risk score (0-10)
   * @param {boolean} requireKyc - Whether KYC is required
   * @param {Array<number>} allowedJurisdictions - Bitmap of allowed jurisdictions
   * @returns {Promise<string>} - Transaction signature
   */
  async setPolicy(maxRiskScore, requireKyc, allowedJurisdictions = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]) {
    if (!this.program) {
      throw new Error("SDK not initialized with wallet. Call setWallet() first.");
    }

    const [policyPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("policy")],
      this.programId
    );

    const tx = await this.program.methods
      .setPolicy(maxRiskScore, requireKyc, allowedJurisdictions)
      .accounts({
        policy: policyPDA,
        authority: this.wallet.publicKey
      })
      .rpc();
    
    console.log("Policy updated:", tx);
    return tx;
  }

  /**
   * Check if a user has a valid KYC attestation
   * @param {PublicKey} user - User's public key
   * @returns {Promise<{isVerified: boolean, jurisdiction: number}>} - KYC verification status
   */
  async checkKYC(user) {
    try {
      console.log(`Checking KYC attestation for user: ${user.toBase58()}`);
      
      // Find the KYC attestation PDA for this user
      const [attestationPda] = await PublicKey.findProgramAddress(
        [Buffer.from("kyc_attestation"), user.toBuffer()],
        this.programId
      );
      
      // Try to fetch the attestation from chain
      try {
        const attestation = await this.program.account.kycAttestation.fetch(attestationPda);
        return {
          isVerified: attestation.isVerified,
          jurisdiction: attestation.jurisdiction,
          timestamp: attestation.timestamp,
          source: 'on-chain'
        };
      } catch (error) {
        // If not found on-chain, check backend
        const response = await axios.get(`${this.backendUrl}/api/kyc/${user.toBase58()}`);
        if (response.data && response.data.is_verified) {
          return {
            isVerified: response.data.is_verified,
            jurisdiction: response.data.jurisdiction,
            timestamp: response.data.timestamp,
            source: 'backend'
          };
        }
      }
    } catch (error) {
      console.log("KYC check error:", error);
    }
    
    // Default response if no attestation found
    return {
      isVerified: false,
      jurisdiction: 0,
      timestamp: null,
      source: 'none'
    };
  }

  /**
   * Get wallet risk score
   * @param {PublicKey} user - User's public key
   * @returns {Promise<number>} - Risk score (0-5)
   */
  async getRiskScore(user) {
    // In production, this would query Range Security oracle
    // For now, return a random score for demonstration
    const score = Math.floor(Math.random() * 3); // 0-2 (low risk)
    return score;
  }

  /**
   * Log compliance verification to backend
   * @param {PublicKey} user - User's public key
   * @param {string} action - Action performed
   * @param {boolean} verified - Verification result
   * @param {number} riskScore - Risk score
   * @param {string} txSignature - Transaction signature
   */
  async logVerification(user, action, verified, riskScore, txSignature = '') {
    try {
      const response = await fetch('http://localhost:3001/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.toBase58(),
          action,
          verified,
          risk_score: riskScore,
          tx_signature: txSignature,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log verification');
      }
    } catch (error) {
      console.error('Error logging verification:', error);
    }
  }

  /**
   * Log a violation
   * @param {PublicKey} user - User's public key
   * @param {string} reason - Reason for violation
   * @param {string} txSignature - Transaction signature
   */
  async logViolation(user, reason, txSignature = '') {
    try {
      const response = await fetch('http://localhost:3001/api/violations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: user.toBase58(),
          reason,
          tx_signature: txSignature,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log violation');
      }
    } catch (error) {
      console.error('Error logging violation:', error);
    }
  }
}

export default CompliFiSDK;

