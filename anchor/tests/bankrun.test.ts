import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingapp } from '../target/types/votingapp';

import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';

const IDL = require('../target/idl/votingapp.json');
const PROGRAM_ID = new PublicKey(IDL.address);

describe.skip('voting', () => {
  it('should initialize a poll', async () => {
    const context = await startAnchor(
      '',
      [{ name: 'votingapp', programId: PROGRAM_ID }],
      [],
    );
    const provider = new BankrunProvider(context);
    // const payer = provider.wallet as anchor.Wallet;
    const program = new anchor.Program<Votingapp>(IDL, provider);

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const tx = await program.methods
      .initializePoll(
        new anchor.BN(1),
        'What is your favourite color?',
        new anchor.BN(Date.now()),
        new anchor.BN(Date.now() + 1000000),
      )
      .rpc();

    const currentPoll = await program.account.poll.fetch(pollAddress);

    expect(currentPoll.pollId.eq(new anchor.BN(1))).toBeTruthy();
    expect(currentPoll.description).toEqual('What is your favourite color?');
  });
});
