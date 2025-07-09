use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;
use anchor_lang::solana_program::sysvar;

declare_id!("81K4v8JgJ64hz95gdkY2YFCc5PYkJa93VuQgPweu6usZ");

// Secret salt for hashing SIM numbers - in production this should be managed securely off-chain
const SIM_HASH_SALT: &[u8] = b"SIMChain_v1_secure_salt_2024";

#[program]
pub mod simchain_wallet {
    use super::*;
    use anchor_lang::solana_program::sysvar::instructions as sysvar_instructions;

    /// Initialize wallet with hashed SIM number for privacy
    pub fn initialize_wallet(
        ctx: Context<InitializeWallet>,
        sim_hash: [u8; 32],
        pin_hash: [u8; 32],
    ) -> Result<()> {
        let ix_sysvar = ctx.accounts.instructions.to_account_info();
        let current_ix = sysvar_instructions::load_current_index_checked(&ix_sysvar)?;
        if current_ix != 0 {
            return err!(SimchainError::CpiNotAllowed);
        }
        if pin_hash.iter().all(|&b| b == 0) {
            return err!(SimchainError::WeakPin);
        }
        let w = &mut ctx.accounts.wallet;
        w.sim_hash = sim_hash;
        w.balance = 0;
        w.owner = ctx.accounts.authority.key();
        w.pin_hash = pin_hash;
        w.bump = ctx.bumps.wallet;
        w.alias = [0u8; 32];
        Ok(())
    }

    pub fn set_alias(ctx: Context<ModifyWallet>, alias: [u8; 32]) -> Result<()> {
        let ix_sysvar = ctx.accounts.instructions.to_account_info();
        let current_ix = sysvar_instructions::load_current_index_checked(&ix_sysvar)?;
        if current_ix != 0 {
            return err!(SimchainError::CpiNotAllowed);
        }
        let w = &mut ctx.accounts.wallet;
        w.alias = alias;
        Ok(())
    }

    pub fn add_funds(ctx: Context<ModifyWallet>, amount: u64) -> Result<()> {
        let ix_sysvar = ctx.accounts.instructions.to_account_info();
        let current_ix = sysvar_instructions::load_current_index_checked(&ix_sysvar)?;
        if current_ix != 0 {
            return err!(SimchainError::CpiNotAllowed);
        }
        let w = &mut ctx.accounts.wallet;
        require!(amount > 0, SimchainError::InvalidAmount);
        w.balance = w.balance
            .checked_add(amount)
            .ok_or(SimchainError::ArithmeticOverflow)?;
        Ok(())
    }

    pub fn send(ctx: Context<Send>, amount: u64) -> Result<()> {
        let ix_sysvar = ctx.accounts.instructions.to_account_info();
        let current_ix = sysvar_instructions::load_current_index_checked(&ix_sysvar)?;
        if current_ix != 0 {
            return err!(SimchainError::CpiNotAllowed);
        }
        let from = &mut ctx.accounts.sender_wallet;
        let to = &mut ctx.accounts.receiver_wallet;
        require!(amount > 0, SimchainError::InvalidAmount);
        require!(from.balance >= amount, SimchainError::InsufficientBalance);
        from.balance = from.balance.checked_sub(amount).unwrap();
        to.balance = to.balance.checked_add(amount).unwrap();
        Ok(())
    }

    pub fn check_balance(ctx: Context<CheckBalance>) -> Result<()> {
        let w = &ctx.accounts.wallet;
        msg!("Balance: {} lamports", w.balance);
        Ok(())
    }
}

pub fn hash_sim_number(sim_number: &str) -> [u8; 32] {
    let mut data = SIM_HASH_SALT.to_vec();
    data.extend_from_slice(sim_number.as_bytes());
    let hash_result = hash(&data);
    hash_result.to_bytes()
}

#[derive(Accounts)]
#[instruction(sim_hash: [u8; 32])]
pub struct InitializeWallet<'info> {
    #[account(
        init,
        payer = authority,
        space = Wallet::INIT_SPACE,
        seeds = [b"wallet", &sim_hash[..]],
        bump
    )]
    pub wallet: Account<'info, Wallet>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
    /// CHECK: sysvar
    #[account(address = sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct ModifyWallet<'info> {
    #[account(
        mut,
        seeds = [b"wallet", &wallet.sim_hash[..]],
        bump = wallet.bump,
        has_one = owner
    )]
    pub wallet: Account<'info, Wallet>,
    pub owner: Signer<'info>,
    /// CHECK: sysvar
    #[account(address = sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct Send<'info> {
    #[account(
        mut,
        seeds = [b"wallet", &sender_wallet.sim_hash[..]],
        bump = sender_wallet.bump,
        has_one = owner
    )]
    pub sender_wallet: Account<'info, Wallet>,

    #[account(
        mut,
        seeds = [b"wallet", &receiver_wallet.sim_hash[..]],
        bump = receiver_wallet.bump
    )]
    pub receiver_wallet: Account<'info, Wallet>,

    pub owner: Signer<'info>,
    /// CHECK: sysvar
    #[account(address = sysvar::instructions::ID)]
    pub instructions: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct CheckBalance<'info> {
    #[account(
        seeds = [b"wallet", &wallet.sim_hash[..]],
        bump = wallet.bump
    )]
    pub wallet: Account<'info, Wallet>,
}

#[account]
pub struct Wallet {
    pub sim_hash: [u8; 32],
    pub balance: u64,
    pub owner: Pubkey,
    pub pin_hash: [u8; 32],
    pub bump: u8,
    pub alias: [u8; 32],
}

impl Wallet {
    pub const INIT_SPACE: usize = 8 + 32 + 8 + 32 + 32 + 1 + 32;
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
    #[msg("Weak PIN")]
    WeakPin,
    #[msg("CPI not allowed for this instruction")]
    CpiNotAllowed,
}