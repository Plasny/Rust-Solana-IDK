use anchor_lang::prelude::*;

#[error_code]
pub enum TransferError {
    /* #[msg("You are not authorized to perform this action")]
    Unauthorized, */
    #[msg("You do not have enough funds to perform this action")]
    InsufficientFunds,
}
