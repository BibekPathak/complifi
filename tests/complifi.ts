/* eslint-env mocha */
import * as anchor from '@coral-xyz/anchor';
import { expect } from 'chai';

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

		// verify compliance (uses UncheckedAccount for user)
		await program.methods
			.verifyCompliance(authority, 'swap')
			.accounts({
				state: state.publicKey,
				user: authority,
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

