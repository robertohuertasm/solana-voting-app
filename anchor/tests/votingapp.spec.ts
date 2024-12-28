import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingapp } from '../target/types/votingapp';

describe('votingapp', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  // NOTE: Anchor will use the wallet as the default signer.
  // const payer = provider.wallet as anchor.Wallet;
  const program = anchor.workspace.Votingapp as Program<Votingapp>;

  it('Initialize Poll', async () => {
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    // console.log('Address', pollAddress);

    const tx = await program.methods
      .initializePoll(
        new anchor.BN(1),
        'What is your favourite color?',
        new anchor.BN(Date.now()),
        new anchor.BN(Date.now() + 1000000),
      )
      // NOTE: anchor does all this implicitly
      // .accountsPartial({
      //   signer: payer.publicKey,
      //   poll: pollAddress,
      // })
      // .signers([payer.payer])
      .rpc();

    // console.log('Your transaction signature', tx);

    const currentPoll = await program.account.poll.fetch(pollAddress);

    // console.log('Current Poll', currentPoll);

    expect(currentPoll.pollId.eq(new anchor.BN(1))).toBeTruthy();
    expect(currentPoll.description).toEqual('What is your favourite color?');
  });
});
