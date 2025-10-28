import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { CompliFi } from '../target/types/complifi';
import { expect } from 'chai';

describe('complifi', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.CompliFi as Program<CompliFi>;

  it('Initializes the compliance state', async () => {
    const state = anchor.web3.Keypair.generate();
    const authority = provider.wallet.publicKey;

    await program.methods
      .initialize()
      .accounts({
        state: state.publicKey,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([state])
      .rpc();

    const stateAccount = await program.account.complianceState.fetch(state.publicKey);
    expect(stateAccount.authority.toString()).to.equal(authority.toString());
    expect(stateAccount.verificationCount.toString()).to.equal('0');
  });

  it('Verifies compliance for a user', async () => {
    // This test would verify that the compliance check works correctly
    // Placeholder for actual test implementation
  });

  it('Records violations', async () => {
    // This test would verify violation logging
    // Placeholder for actual test implementation
  });
});

