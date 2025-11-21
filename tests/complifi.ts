/* eslint-env mocha */
import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';
import { Buffer } from 'buffer';

// Use local provider (Anchor.toml -> Localnet)
const provider = (anchor as any).AnchorProvider.env();
(anchor as any).setProvider(provider);

// Program handle (no generated types needed)
const program = (anchor as any).workspace.Complifi as any;

describe('complifi program', () => {
	it('initializes compliance state', async () => {
		const state = (anchor as any).web3.Keypair.generate();
		const authority = (provider as any).wallet.publicKey;

		await program.methods
			.initialize()
			.accounts({
				state: state.publicKey,
				authority,
				systemProgram: (anchor as any).web3.SystemProgram.programId,
			})
			.signers([state])
			.rpc();

		const stateAccount = await program.account.complianceState.fetch(state.publicKey);
		expect(stateAccount.authority.toString()).to.equal(authority.toString());
		expect(stateAccount.verificationCount.toString()).to.equal('0');
		expect(stateAccount.violationCount.toString()).to.equal('0');
	});

	it('verifies compliance and increments verification_count', async () => {
		const state = (anchor as any).web3.Keypair.generate();
		const authority = (provider as any).wallet.publicKey;

		// init
		await program.methods
			.initialize()
			.accounts({
				state: state.publicKey,
				authority,
				systemProgram: (anchor as any).web3.SystemProgram.programId,
			})
			.signers([state])
			.rpc();

		// create policy
		const policy = (anchor as any).web3.Keypair.generate();
		await program.methods
			.initializePolicy()
			.accounts({
				policy: policy.publicKey,
				authority,
				systemProgram: (anchor as any).web3.SystemProgram.programId,
			})
			.signers([policy])
			.rpc();

		// set policy to allow jurisdiction 0 and higher risk threshold
		const allowed: number[] = new Array(10).fill(0);
		allowed[0] = 1; // allow jurisdiction bit 0
		await program.methods
			.setPolicy(5, true, allowed as any)
			.accounts({
				policy: policy.publicKey,
				authority,
			})
			.rpc();

		// derive attestation PDA for authority wallet
		const [attestationPda] = (anchor as any).web3.PublicKey.findProgramAddressSync(
			[Buffer.from('kyc-attestation'), authority.toBuffer()],
			program.programId,
		);

		// create KYC attestation for authority in jurisdiction 0
		await program.methods
			.createKycAttestation(authority, true, 0)
			.accounts({
				attestation: attestationPda,
				authority,
				state: state.publicKey,
				wallet: authority,
				systemProgram: (anchor as any).web3.SystemProgram.programId,
			})
			.rpc();

		// verify compliance (uses UncheckedAccount for user)
		await program.methods
			.verifyCompliance(authority, 'swap')
			.accounts({
				state: state.publicKey,
				policy: policy.publicKey,
				authority,
				user: authority,
				attestation: attestationPda,
			})
			.rpc();

		const stateAfter = await program.account.complianceState.fetch(state.publicKey);
		expect(stateAfter.verificationCount.toString()).to.equal('1');
	});

	it('records a violation and increments violation_count', async () => {
		const state = (anchor as any).web3.Keypair.generate();
		const authority = (provider as any).wallet.publicKey;

		// init
		await program.methods
			.initialize()
			.accounts({
				state: state.publicKey,
				authority,
				systemProgram: (anchor as any).web3.SystemProgram.programId,
			})
			.signers([state])
			.rpc();

		// record violation
		await program.methods
			.recordViolation(authority, 'Risk score too high')
			.accounts({
				state: state.publicKey,
			})
			.rpc();

		const stateAfter = await program.account.complianceState.fetch(state.publicKey);
		expect(stateAfter.violationCount.toString()).to.equal('1');
	});
});

