#![allow(unexpected_cfgs)]

use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod prediktfi_protocol {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("PrediktFi Protocol initialized!");
        Ok(())
    }

    pub fn create_prediction_market(
        ctx: Context<CreatePredictionMarket>,
        market_id: String,
        description: String,
        end_timestamp: i64,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        market.id = market_id;
        market.description = description;
        market.end_timestamp = end_timestamp;
        market.is_resolved = false;
        market.total_yes_amount = 0;
        market.total_no_amount = 0;
        market.authority = ctx.accounts.authority.key();

        msg!("Created prediction market: {}", market.description);
        Ok(())
    }

    pub fn place_prediction(
        ctx: Context<PlacePrediction>,
        amount: u64,
        prediction: bool, // true = YES, false = NO
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;

        if market.is_resolved {
            return Err(ErrorCode::MarketAlreadyResolved.into());
        }

        let clock = Clock::get()?;
        if clock.unix_timestamp > market.end_timestamp {
            return Err(ErrorCode::MarketExpired.into());
        }

        if prediction {
            market.total_yes_amount += amount;
        } else {
            market.total_no_amount += amount;
        }

        msg!("Placed prediction: {} amount: {}", prediction, amount);
        Ok(())
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: bool) -> Result<()> {
        let market = &mut ctx.accounts.market;

        if market.is_resolved {
            return Err(ErrorCode::MarketAlreadyResolved.into());
        }

        market.is_resolved = true;
        market.outcome = Some(outcome);

        msg!("Market resolved with outcome: {}", outcome);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreatePredictionMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PredictionMarket::INIT_SPACE,
        seeds = [b"market"],
        bump
    )]
    pub market: Account<'info, PredictionMarket>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlacePrediction<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub market: Account<'info, PredictionMarket>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct PredictionMarket {
    #[max_len(50)]
    pub id: String,
    #[max_len(200)]
    pub description: String,
    pub end_timestamp: i64,
    pub is_resolved: bool,
    pub outcome: Option<bool>,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub authority: Pubkey,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market has expired")]
    MarketExpired,
}
