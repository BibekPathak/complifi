/**
 * CompliFi Demo Example
 * 
 * This example demonstrates how to integrate CompliFi into a DeFi protocol
 * to enforce compliance requirements for users, including the new PDA-based KYC attestation system.
 */

const { CompliFiSDK } = require('../sdk/src/index');
const { Keypair, Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const fs = require('fs');

// Demo configuration
const BACKEND_URL = 'http://localhost:3001';
const CONNECTION = new Connection(clusterApiUrl('devnet'));

// Jurisdiction codes
const JURISDICTIONS = {
  US: 1,
  EU: 2,
  UK: 3,
  SG: 4,
  RESTRICTED: 99
};

async function runDemo() {
  console.log('🚀 Starting CompliFi Demo');
  console.log('---------------------------');

  // Create a wallet for the demo
  const wallet = Keypair.generate();
  console.log(`📝 Demo wallet created: ${wallet.publicKey.toString()}`);

  // Initialize the CompliFi SDK
  console.log('\n📦 Initializing CompliFi SDK...');
  const compliFi = new CompliFiSDK({
    connection: CONNECTION,
    wallet,
    backendUrl: BACKEND_URL
  });

  // Demo scenario 1: Initialize compliance policy
  console.log('\n🔧 Scenario 1: Setting up compliance policy');
  try {
    await compliFi.initializePolicy({
      maxRiskScore: 75,
      requireKyc: true,
      allowedJurisdictions: [JURISDICTIONS.US, JURISDICTIONS.EU, JURISDICTIONS.UK, JURISDICTIONS.SG]
    });
    console.log('✅ Compliance policy initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize policy:', error);
  }
  
  // Demo scenario 2: Create KYC attestations for test users
  console.log('\n🔐 Scenario 2: Creating KYC attestations');
  
  // Create test users
  const users = {
    compliant: Keypair.generate(),
    highRisk: Keypair.generate(),
    noKyc: Keypair.generate(),
    restricted: Keypair.generate()
  };
  
  console.log('Creating KYC attestations for test users...');
  
  try {
    // Create attestation for compliant user
    await compliFi.createKycAttestation(
      users.compliant.publicKey,
      true, // isVerified
      JURISDICTIONS.US
    );
    console.log(`✅ Created KYC attestation for compliant user: ${users.compliant.publicKey.toString()}`);
    
    // Create attestation for high risk user
    await compliFi.createKycAttestation(
      users.highRisk.publicKey,
      true, // isVerified
      JURISDICTIONS.US
    );
    console.log(`✅ Created KYC attestation for high risk user: ${users.highRisk.publicKey.toString()}`);
    
    // No attestation for noKyc user (intentionally skipped)
    
    // Create attestation for restricted user
    await compliFi.createKycAttestation(
      users.restricted.publicKey,
      true, // isVerified
      JURISDICTIONS.RESTRICTED
    );
    console.log(`✅ Created KYC attestation for restricted user: ${users.restricted.publicKey.toString()}`);
  } catch (error) {
    console.error('❌ Failed to create KYC attestations:', error);
  }

  // Demo scenario 3: Verify compliant user
  console.log('\n🧪 Scenario 3: Verifying a compliant user');
  
  try {
    // First check KYC status
    const kycStatus = await compliFi.checkKYC(users.compliant.publicKey);
    console.log(`KYC status for compliant user: ${JSON.stringify(kycStatus, null, 2)}`);
    
    // Then verify compliance
    const result = await compliFi.verifyCompliance(users.compliant.publicKey);
    console.log(`✅ Compliance verification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }

  // Demo scenario 4: Verify non-compliant user (high risk score)
  console.log('\n🧪 Scenario 4: Verifying a high-risk user');
  
  try {
    // Override risk score for this user to be high
    compliFi.getRiskScore = async () => 90; // Mock high risk score
    
    // First check KYC status
    const kycStatus = await compliFi.checkKYC(users.highRisk.publicKey);
    console.log(`KYC status for high risk user: ${JSON.stringify(kycStatus, null, 2)}`);
    
    // Then verify compliance
    const result = await compliFi.verifyCompliance(users.highRisk.publicKey);
    console.log(`❓ Compliance verification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log('✅ Expected verification to fail due to high risk score');
    console.log(`❌ Error: ${error.message}`);
  } finally {
    // Reset risk score mock
    compliFi.getRiskScore = async () => 2;
  }

  // Demo scenario 5: Verify non-compliant user (no KYC)
  console.log('\n🧪 Scenario 5: Verifying a user without KYC');
  
  try {
    // First check KYC status
    const kycStatus = await compliFi.checkKYC(users.noKyc.publicKey);
    console.log(`KYC status for no-KYC user: ${JSON.stringify(kycStatus, null, 2)}`);
    
    // Then verify compliance
    const result = await compliFi.verifyCompliance(users.noKyc.publicKey);
    console.log(`❓ Compliance verification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log('✅ Expected verification to fail due to missing KYC');
    console.log(`❌ Error: ${error.message}`);
  }

  // Demo scenario 6: Verify non-compliant user (restricted jurisdiction)
  console.log('\n🧪 Scenario 6: Verifying a user from a restricted jurisdiction');
  
  try {
    // First check KYC status
    const kycStatus = await compliFi.checkKYC(users.restricted.publicKey);
    console.log(`KYC status for restricted jurisdiction user: ${JSON.stringify(kycStatus, null, 2)}`);
    
    // Then verify compliance
    const result = await compliFi.verifyCompliance(users.restricted.publicKey);
    console.log(`❓ Compliance verification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log('✅ Expected verification to fail due to restricted jurisdiction');
    console.log(`❌ Error: ${error.message}`);
  }

  try {
    const result = await compliFi.verifyCompliance(users.restricted.publicKey);
    console.log(`❓ Compliance verification result: ${JSON.stringify(result, null, 2)}`);
  } catch (error) {
    console.log('✅ Expected verification to fail due to restricted jurisdiction');
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✨ Demo completed successfully!');
  console.log('\n---------------------------');
  console.log('🏁 CompliFi Demo Completed');
}

// Run the demo
runDemo().catch(console.error);