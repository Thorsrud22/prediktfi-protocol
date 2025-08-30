use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod prediktfi_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("PrediktFi Protocol initialized!");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}