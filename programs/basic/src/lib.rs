// TODO create fake crypto
mod structs;
mod errors;

use anchor_lang::prelude::*;
use errors::TransferError;
use structs::BasicAccount;

declare_id!("H2J7ji6Ki844eJ96C2cJxYCVrDo1GBxmmTt7f2t286eM");

const INITIAL_BALANCE: u64 = 10;
const SEED_PREFIX: &'static str = "user_acc";

#[program]
pub mod anchor {
    use super::*;

    pub fn create_account(ctx: Context<CreateAccount>) -> Result<()> {
        let account = &mut ctx.accounts.account;
        account.balance = INITIAL_BALANCE;
        account.bump = ctx.bumps.account;

        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, ammount: u64) -> Result<()> {
        if ctx.accounts.sender_acc.balance < ammount {
            return err!(TransferError::InsufficientFunds);
        }

        let sender = &mut ctx.accounts.sender_acc;
        let receiver = &mut ctx.accounts.receiver_acc;

        sender.balance -= ammount;
        receiver.balance += ammount;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateAccount<'info> {
    #[account(
        init,
        payer = authority,
        // calculating space: https://www.anchor-lang.com/docs/space
        space = 8 + 8 + 1,
        seeds = [SEED_PREFIX.as_bytes(), authority.key().as_ref()],
        bump
    )]
    account: Account<'info, BasicAccount>,

    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(
        mut,
        seeds = [SEED_PREFIX.as_bytes(), sender.key().as_ref()],
        bump = sender_acc.bump
    )]
    sender_acc: Account<'info, BasicAccount>,

    #[account(mut)]
    receiver_acc: Account<'info, BasicAccount>,

    sender: Signer<'info>,
    system_program: Program<'info, System>,
}

