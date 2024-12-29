use std::vec;

use anchor_lang::prelude::*;
use solana_program::hash::Hash;
use solana_program_test::{BanksClient, ProgramTest};
use solana_sdk::{signature::Keypair, signer::Signer, transaction::Transaction};

use anchor_lang::InstructionData;
use solana_program_test::*;
use solana_sdk::instruction::Instruction;
use votingapp::{instruction, Poll};

async fn setup() -> (BanksClient, Keypair, Hash) {
    let mut program_test = ProgramTest::new("votingapp", votingapp::ID, None);
    program_test.prefer_bpf(true);
    program_test.start().await
}

#[tokio::test]
async fn should_initialize_poll() {
    // setup test
    let (mut banks, payer, blockhash) = setup().await;

    // define poll parameters
    let poll_id: u64 = 1;
    let description = "What is your favourite color?".to_string();
    let poll_start: u64 = 1234567890;
    let poll_end: u64 = poll_start + 1000000;

    // get the poll PDA
    let poll_id_as_bytes = poll_id.to_le_bytes();
    let poll_seeds = &[poll_id_as_bytes.as_ref()];
    let (poll_address, _bump) = Pubkey::find_program_address(poll_seeds, &votingapp::ID);

    // create the instruction
    let ix = Instruction {
        program_id: votingapp::ID,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(poll_address, false),
            AccountMeta::new_readonly(solana_sdk::system_program::ID, false),
        ],
        data: instruction::InitializePoll {
            poll_id,
            description: description.clone(),
            poll_start,
            poll_end,
        }
        .data(),
    };

    // execute the transaction
    let transaction =
        Transaction::new_signed_with_payer(&[ix], Some(&payer.pubkey()), &[&payer], blockhash);

    banks.process_transaction(transaction).await.unwrap();

    // fetch and verify the poll account
    let poll_account = banks.get_account(poll_address).await.unwrap().unwrap();

    let poll = Poll::try_deserialize(&mut poll_account.data.as_slice()).unwrap();

    // assertions
    assert_eq!(poll.poll_id, poll_id);
    assert_eq!(poll.description, description);
    assert_eq!(poll.poll_start, poll_start);
    assert_eq!(poll.poll_end, poll_end);
    assert_eq!(poll.candidate_amount, 0);
}

#[tokio::test]
async fn should_initialize_candidate() {
    // setup test
    let (mut banks, payer, blockhash) = setup().await;

    // define poll parameters
    let poll_id: u64 = 1;
    let description = "What is your favourite color?".to_string();
    let poll_start: u64 = 1234567890;
    let poll_end: u64 = poll_start + 1000000;

    // get the poll PDA
    let poll_id_as_bytes = poll_id.to_le_bytes();
    let poll_seeds = &[poll_id_as_bytes.as_ref()];
    let (poll_address, _bump) = Pubkey::find_program_address(poll_seeds, &votingapp::ID);

    // create the instruction
    let ix = Instruction {
        program_id: votingapp::ID,
        accounts: vec![
            AccountMeta::new(payer.pubkey(), true),
            AccountMeta::new(poll_address, false),
            AccountMeta::new_readonly(solana_sdk::system_program::ID, false),
        ],
        data: instruction::InitializePoll {
            poll_id,
            description: description.clone(),
            poll_start,
            poll_end,
        }
        .data(),
    };

    // execute the transaction
    let transaction =
        Transaction::new_signed_with_payer(&[ix], Some(&payer.pubkey()), &[&payer], blockhash);

    banks.process_transaction(transaction).await.unwrap();

    // fetch and verify the poll account
    let poll_account = banks.get_account(poll_address).await.unwrap().unwrap();

    let poll = Poll::try_deserialize(&mut poll_account.data.as_slice()).unwrap();

    // assertions
    assert_eq!(poll.poll_id, poll_id);
    assert_eq!(poll.description, description);
    assert_eq!(poll.poll_start, poll_start);
    assert_eq!(poll.poll_end, poll_end);
    assert_eq!(poll.candidate_amount, 0);
}
