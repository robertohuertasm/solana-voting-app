import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Votingapp } from '../target/types/votingapp';

import { startAnchor } from 'solana-bankrun';
import { BankrunProvider } from 'anchor-bankrun';
import { before } from 'node:test';

const IDL = require('../target/idl/votingapp.json');
const PROGRAM_ID = new PublicKey(IDL.address);

describe('voting.bankrun.test', () => {
  async function setup() {
    const context = await startAnchor(
      '',
      [{ name: 'votingapp', programId: PROGRAM_ID }],
      [],
    );
    const provider = new BankrunProvider(context);
    const payer = provider.wallet as anchor.Wallet;
    const program = new anchor.Program<Votingapp>(IDL, provider);

    return { context, provider, payer, program };
  }

  let program: Program<Votingapp>;

  beforeAll(async () => {
    const { program: _program } = await setup();
    program = _program;
  });

  it('should initialize a poll', async () => {
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

  it('should initialize a candidate', async () => {
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    let tx = await program.methods
      .initializeCandidate('Roberto', new anchor.BN(1))
      .accountsPartial({
        poll: pollAddress,
      })
      .rpc();

    const [robertoAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('Roberto'), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const roberto = await program.account.candidate.fetch(robertoAddress);

    const currentPoll = await program.account.poll.fetch(pollAddress);

    expect(roberto.candidateName).toEqual('Roberto');
    expect(roberto.candidateVotes.toNumber()).toEqual(0);
    expect(currentPoll.candidateAmount.toNumber()).toEqual(1);
  });

  it('should vote for a candidate', async () => {
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const [robertoAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('Roberto'), new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      program.programId,
    );

    const tx = await program.methods
      .vote('Roberto', new anchor.BN(1))
      .accountsPartial({
        poll: pollAddress,
        candidate: robertoAddress,
      })
      .rpc();

    const roberto = await program.account.candidate.fetch(robertoAddress);

    expect(roberto.candidateName).toEqual('Roberto');
    expect(roberto.candidateVotes.toNumber()).toEqual(1);
  });
});
