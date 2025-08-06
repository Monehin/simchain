use anchor_lang::prelude::*;

declare_id!("7nFSfkKmB7JGcfo9co8H2HbiW7HMnw3KtEzZiPbNfYFF");

#[program]
pub mod solana_program_tmp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
