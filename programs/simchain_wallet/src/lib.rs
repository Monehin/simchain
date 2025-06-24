use anchor_lang::prelude::*;

declare_id!("HnPUDFW5r8tRDb6W69sobYFoXRhSBGDpixNJWeAfqq6Y");

#[program]
pub mod simchain_wallet {
    use super::*;

    /// Initialize at 0 lamports
    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        sim_number: String,
        pin_hash: [u8; 32],
    ) -> Result<()> {
        let w = &mut ctx.accounts.wallet;
        require!((8..=15).contains(&sim_number.len()), SimchainError::InvalidSimNumber);
        w.sim_number = sim_number;
        w.balance    = 0;                       // lamports
        w.owner      = ctx.accounts.authority.key();
        w.pin_hash   = pin_hash;
        w.bump       = ctx.bumps.wallet;
        Ok(())
    }

    /// Add lamports (must be owner)
    pub fn add_funds(ctx: Context<ModifyWallet>, amount: u64) -> Result<()> {
        let w = &mut ctx.accounts.wallet;
        require!(amount > 0, SimchainError::InvalidAmount);
        w.balance = w.balance
            .checked_add(amount)
            .ok_or(SimchainError::ArithmeticOverflow)?;
        Ok(())
    }

    /// Send lamports from one SIM to another
    pub fn send(ctx: Context<Send>, amount: u64) -> Result<()> {
        let from = &mut ctx.accounts.sender_wallet;
        let to   = &mut ctx.accounts.receiver_wallet;
        require!(amount > 0, SimchainError::InvalidAmount);
        require!(from.balance >= amount, SimchainError::InsufficientBalance);
        from.balance = from.balance.checked_sub(amount).unwrap();
        to.balance   = to.balance.checked_add(amount).unwrap();
        Ok(())
    }

    /// Log balance; client can also fetch
    pub fn check_balance(ctx: Context<CheckBalance>) -> Result<()> {
        let w = &ctx.accounts.wallet;
        msg!("Balance: {} lamports", w.balance);
        Ok(())
    }
}

// INITIALIZE
#[derive(Accounts)]
#[instruction(sim_number: String)]
pub struct InitializeWallet<'info> {
    #[account(
        init,
        payer = authority,
        space = Wallet::INIT_SPACE,
        seeds = [b"wallet", sim_number.as_bytes()],
        bump
    )]
    pub wallet: Account<'info, Wallet>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

// ADD / MODIFY (owner check)
#[derive(Accounts)]
pub struct ModifyWallet<'info> {
    #[account(
        mut,
        seeds = [b"wallet", wallet.sim_number.as_bytes()],
        bump = wallet.bump,
        has_one = owner
    )]
    pub wallet: Account<'info, Wallet>,
    pub owner: Signer<'info>,
}

// SEND
#[derive(Accounts)]
pub struct Send<'info> {
    #[account(
        mut,
        seeds = [b"wallet", sender_wallet.sim_number.as_bytes()],
        bump = sender_wallet.bump,
        has_one = owner
    )]
    pub sender_wallet: Account<'info, Wallet>,

    #[account(
        mut,
        seeds = [b"wallet", receiver_wallet.sim_number.as_bytes()],
        bump = receiver_wallet.bump
    )]
    pub receiver_wallet: Account<'info, Wallet>,

    pub owner: Signer<'info>,
}

// CHECK
#[derive(Accounts)]
pub struct CheckBalance<'info> {
    #[account(
        seeds = [b"wallet", wallet.sim_number.as_bytes()],
        bump = wallet.bump
    )]
    pub wallet: Account<'info, Wallet>,
}

// ON-CHAIN STATE
#[account]
pub struct Wallet {
    pub sim_number: String,   // up to 15 chars
    pub balance:     u64,     // lamports
    pub owner:       Pubkey,
    pub pin_hash:    [u8; 32],
    pub bump:        u8,
}

impl Wallet {
    // discriminator(8) + prefix(4)+max15 + u64(8)+Pubkey(32)+hash(32)+bump(1)
    pub const INIT_SPACE: usize = 8 + 4 + 15 + 8 + 32 + 32 + 1;
}

#[error_code]
pub enum SimchainError {
    #[msg("Invalid SIM number")]
    InvalidSimNumber,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
}