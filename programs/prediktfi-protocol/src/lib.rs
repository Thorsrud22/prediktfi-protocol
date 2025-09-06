use anchor_lang::prelude::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod prediktfi_protocol {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        protocol_state.authority = ctx.accounts.authority.key();
        protocol_state.total_markets = 0;
        protocol_state.is_paused = false;
        
        emit!(ProtocolInitialized {
            authority: protocol_state.authority,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("PrediktFi Protocol initialized!");
        Ok(())
    }

    pub fn create_prediction_market(
        ctx: Context<CreatePredictionMarket>,
        market_id: String,
        description: String,
        end_timestamp: i64,
        min_bet_amount: u64,
    ) -> Result<()> {
        let protocol_state = &mut ctx.accounts.protocol_state;
        
        require!(!protocol_state.is_paused, ErrorCode::ProtocolPaused);
        require!(market_id.len() <= 50, ErrorCode::MarketIdTooLong);
        require!(description.len() <= 500, ErrorCode::DescriptionTooLong);
        require!(min_bet_amount > 0, ErrorCode::InvalidMinBetAmount);
        
        let clock = Clock::get()?;
        require!(end_timestamp > clock.unix_timestamp, ErrorCode::InvalidEndTime);
        
        let market = &mut ctx.accounts.market;
        market.id = market_id.clone();
        market.description = description.clone();
        market.end_timestamp = end_timestamp;
        market.created_timestamp = clock.unix_timestamp;
        market.min_bet_amount = min_bet_amount;
        market.is_resolved = false;
        market.outcome = None;
        market.total_yes_amount = 0;
        market.total_no_amount = 0;
        market.total_participants = 0;
        market.authority = ctx.accounts.authority.key();
        
        protocol_state.total_markets += 1;
        
        emit!(MarketCreated {
            market_id: market_id,
            description: description,
            end_timestamp: end_timestamp,
            authority: market.authority,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Created prediction market: {} with ID: {}", market.description, market.id);
        Ok(())
    }

    pub fn place_prediction(
        ctx: Context<PlacePrediction>,
        amount: u64,
        prediction: bool, // true = YES, false = NO
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        let user_prediction = &mut ctx.accounts.user_prediction;
        
        require!(!market.is_resolved, ErrorCode::MarketAlreadyResolved);
        require!(amount >= market.min_bet_amount, ErrorCode::BetAmountTooLow);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp < market.end_timestamp, ErrorCode::MarketExpired);
        
        // Check if user already has a prediction in this market
        if user_prediction.amount > 0 {
            return Err(ErrorCode::UserAlreadyPredicted.into());
        }
        
        // For MVP, we'll use a simple SOL-based betting system
        // Transfer SOL from user to market PDA (simplified version)
        let lamports = amount;
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &market.key(),
            lamports,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.user.to_account_info(),
                market.to_account_info(),
            ],
        )?;
        
        // Update market totals
        if prediction {
            market.total_yes_amount += amount;
        } else {
            market.total_no_amount += amount;
        }
        market.total_participants += 1;
        
        // Store user prediction
        user_prediction.market = market.key();
        user_prediction.user = ctx.accounts.user.key();
        user_prediction.amount = amount;
        user_prediction.prediction = prediction;
        user_prediction.timestamp = clock.unix_timestamp;
        
        emit!(PredictionPlaced {
            market_id: market.id.clone(),
            user: ctx.accounts.user.key(),
            amount: amount,
            prediction: prediction,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Placed prediction: {} amount: {} by user: {}", 
             prediction, amount, ctx.accounts.user.key());
        Ok(())
    }

    pub fn resolve_market(
        ctx: Context<ResolveMarket>,
        outcome: bool,
    ) -> Result<()> {
        let market = &mut ctx.accounts.market;
        
        require!(!market.is_resolved, ErrorCode::MarketAlreadyResolved);
        
        let clock = Clock::get()?;
        require!(clock.unix_timestamp >= market.end_timestamp, ErrorCode::MarketNotExpired);
        
        market.is_resolved = true;
        market.outcome = Some(outcome);
        market.resolved_timestamp = Some(clock.unix_timestamp);
        
        emit!(MarketResolved {
            market_id: market.id.clone(),
            outcome: outcome,
            total_yes_amount: market.total_yes_amount,
            total_no_amount: market.total_no_amount,
            timestamp: clock.unix_timestamp,
        });
        
        msg!("Market {} resolved with outcome: {}", market.id, outcome);
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>) -> Result<()> {
        let market = &ctx.accounts.market;
        let user_prediction = &mut ctx.accounts.user_prediction;
        
        require!(market.is_resolved, ErrorCode::MarketNotResolved);
        require!(!user_prediction.claimed, ErrorCode::AlreadyClaimed);
        
        let outcome = market.outcome.ok_or(ErrorCode::MarketNotResolved)?;
        
        // Check if user won
        if user_prediction.prediction != outcome {
            return Err(ErrorCode::UserLost.into());
        }
        
        // Calculate winnings
        let total_pool = market.total_yes_amount + market.total_no_amount;
        let winning_pool = if outcome {
            market.total_yes_amount
        } else {
            market.total_no_amount
        };
        
        let user_winnings = (user_prediction.amount as u128)
            .checked_mul(total_pool as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(winning_pool as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;
        
        // Transfer winnings from market to user (simplified SOL transfer)
        **market.to_account_info().try_borrow_mut_lamports()? -= user_winnings;
        **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += user_winnings;
        
        // Mark as claimed
        user_prediction.claimed = true;
        user_prediction.winnings = user_winnings;
        
        emit!(WinningsClaimed {
            market_id: market.id.clone(),
            user: ctx.accounts.user.key(),
            amount: user_winnings,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        msg!("User {} claimed winnings: {} from market: {}", 
             ctx.accounts.user.key(), user_winnings, market.id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + ProtocolState::INIT_SPACE,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(market_id: String)]
pub struct CreatePredictionMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PredictionMarket::INIT_SPACE,
        seeds = [b"market", market_id.as_bytes()],
        bump
    )]
    pub market: Account<'info, PredictionMarket>,
    #[account(
        mut,
        seeds = [b"protocol"],
        bump
    )]
    pub protocol_state: Account<'info, ProtocolState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlacePrediction<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,
    #[account(
        init,
        payer = user,
        space = 8 + UserPrediction::INIT_SPACE,
        seeds = [b"prediction", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
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

#[derive(Accounts)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, PredictionMarket>,
    #[account(
        mut,
        seeds = [b"prediction", market.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub user_prediction: Account<'info, UserPrediction>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct ProtocolState {
    pub authority: Pubkey,
    pub total_markets: u64,
    pub is_paused: bool,
}

#[account]
#[derive(InitSpace)]
pub struct PredictionMarket {
    #[max_len(50)]
    pub id: String,
    #[max_len(500)]
    pub description: String,
    pub end_timestamp: i64,
    pub created_timestamp: i64,
    pub resolved_timestamp: Option<i64>,
    pub min_bet_amount: u64,
    pub is_resolved: bool,
    pub outcome: Option<bool>,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub total_participants: u64,
    pub authority: Pubkey,
}

#[account]
#[derive(InitSpace)]
pub struct UserPrediction {
    pub market: Pubkey,
    pub user: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub timestamp: i64,
    pub claimed: bool,
    pub winnings: u64,
}

// Events for indexing and monitoring
#[event]
pub struct ProtocolInitialized {
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct MarketCreated {
    #[index]
    pub market_id: String,
    pub description: String,
    pub end_timestamp: i64,
    pub authority: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct PredictionPlaced {
    #[index]
    pub market_id: String,
    #[index]
    pub user: Pubkey,
    pub amount: u64,
    pub prediction: bool,
    pub timestamp: i64,
}

#[event]
pub struct MarketResolved {
    #[index]
    pub market_id: String,
    pub outcome: bool,
    pub total_yes_amount: u64,
    pub total_no_amount: u64,
    pub timestamp: i64,
}

#[event]
pub struct WinningsClaimed {
    #[index]
    pub market_id: String,
    #[index]
    pub user: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Market has already been resolved")]
    MarketAlreadyResolved,
    #[msg("Market has expired")]
    MarketExpired,
    #[msg("Market has not expired yet")]
    MarketNotExpired,
    #[msg("Market has not been resolved")]
    MarketNotResolved,
    #[msg("Protocol is paused")]
    ProtocolPaused,
    #[msg("Market ID is too long")]
    MarketIdTooLong,
    #[msg("Description is too long")]
    DescriptionTooLong,
    #[msg("Invalid minimum bet amount")]
    InvalidMinBetAmount,
    #[msg("Invalid end time")]
    InvalidEndTime,
    #[msg("Bet amount is too low")]
    BetAmountTooLow,
    #[msg("User has already predicted in this market")]
    UserAlreadyPredicted,
    #[msg("Winnings already claimed")]
    AlreadyClaimed,
    #[msg("User did not win this market")]
    UserLost,
    #[msg("Math overflow")]
    MathOverflow,
}