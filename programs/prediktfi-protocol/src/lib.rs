use anchor_lang::prelude::*;

declare_id!("7teE7a7WG52de1zAQUEhEoHoMKfokMi2SRkvofDyzEtR");

#[program]
pub mod prediktfi_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
