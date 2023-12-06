use anchor_lang::prelude::*;

declare_id!("H2J7ji6Ki844eJ96C2cJxYCVrDo1GBxmmTt7f2t286eM");

const INITIAL_BALANCE: u64 = 10;

#[program]
pub mod anchor {
    use super::*;

    pub fn create_account(ctx: Context<CreateAccount>, account_owner: Pubkey) -> Result<()> {
        let account = &mut ctx.accounts.account;
        account.owner = account_owner;
        account.balance = INITIAL_BALANCE;

        Ok(())
    }

    pub fn transfer(ctx: Context<Transfer>, ammount: u64) -> Result<()> {
        /* if ctx.program_id.key() == ctx.accounts.sender_acc.key() {
            return err!(TransferError::Unauthorized);
        } */

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
        space = 8 + 8 + 32,
    )]
    account: Account<'info, BasicAccount>,
    #[account(mut)]
    authority: Signer<'info>,
    system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Transfer<'info> {
    #[account(mut, signer)]
    sender_acc: Account<'info, BasicAccount>,
    #[account(mut)]
    receiver_acc: Account<'info, BasicAccount>,
    // user: Signer<'info>,
    system_program: Program<'info, System>,
}

#[account]
pub struct BasicAccount {
    pub owner: Pubkey,
    pub balance: u64
}

#[error_code]
pub enum TransferError {
    /* #[msg("You are not authorized to perform this action")]
    Unauthorized, */
    #[msg("You do not have enough funds to perform this action")]
    InsufficientFunds,
}
