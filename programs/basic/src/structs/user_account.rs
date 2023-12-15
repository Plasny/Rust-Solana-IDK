use anchor_lang::prelude::*;

#[account]
pub struct BasicAccount {
    pub balance: u64,
    pub bump: u8,
}

