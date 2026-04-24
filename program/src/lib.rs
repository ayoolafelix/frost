use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, TokenAccount, Transfer};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq");

mod seeds {
    pub const ESCROW: &[u8] = b"escrow";
    pub const VAULT: &[u8] = b"vault";
    pub const SERVICE: &[u8] = b"service";
    pub const TREASURY: &[u8] = b"treasury";
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum EscrowState {
    Created,
    Funded,
    Released,
    Disputed,
    Resolved,
}

impl Default for EscrowState {
    fn default() -> Self {
        EscrowState::Created
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum Resolution {
    ReleaseToRecipient,
    RefundInitializer,
    SplitPayment,
}

impl Default for Resolution {
    fn default() -> Self {
        Resolution::ReleaseToRecipient
    }
}

#[account]
pub struct Service {
    pub provider: Pubkey,
    pub title: String,
    pub description: String,
    pub price: u64,
    pub created_at: u64,
    pub active: bool,
    pub bump: u8,
}

impl Space for Service {
    const INIT_SPACE: usize = 8 + 32 + 4 + 256 + 4 + 1024 + 8 + 1 + 1;
}

#[account]
pub struct Escrow {
    pub initializer: Pubkey,
    pub recipient: Pubkey,
    pub service_id: Option<u32>,
    pub amount: u64,
    pub fee_taken: u64,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub initializer_deposit_token_account: Pubkey,
    pub initializer_receive_token_account: Pubkey,
    pub recipient_token_account: Pubkey,
    pub state: EscrowState,
    pub bump: u8,
}

impl Space for Escrow {
    const INIT_SPACE: usize = 8 + 32 + 32 + 4 + 8 + 8 + 32 + 32 + 32 + 32 + 32 + 4 + 1;
}

#[account]
pub struct Treasury {
    pub authority: Pubkey,
    pub total_fees_collected: u64,
    pub bump: u8,
}

impl Space for Treasury {
    const INIT_SPACE: usize = 8 + 32 + 8 + 1;
}

#[derive(Accounts)]
pub struct CreateService<'info> {
    #[account(mut, signer)]
    pub provider: Signer<'info>,
    #[account(
        init,
        payer = provider,
        space = 8 + 32 + 4 + 256 + 4 + 1024 + 8 + 1 + 1,
        seeds = [seeds::SERVICE, provider.key().as_ref()],
        bump
    )]
    pub service: Account<'info, Service>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct UpdateService<'info> {
    #[account(mut, signer)]
    pub provider: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::SERVICE, provider.key().as_ref()],
        bump = service.bump,
        constraint = service.provider == provider.key() @ ErrorCode::Unauthorized,
    )]
    pub service: Account<'info, Service>,
}

#[derive(Accounts)]
pub struct InitializeTreasury<'info> {
    #[account(mut, signer)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [seeds::TREASURY],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(mut, signer)]
    pub initializer: Signer<'info>,
    #[account(
        init,
        payer = initializer,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [seeds::ESCROW, initializer.key().as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = initializer,
        seeds = [
            seeds::VAULT,
            initializer.key().as_ref(),
            mint.key().as_ref()
        ],
        bump,
        token::mint = mint,
        token::authority = escrow,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint,
        associated_token::owner = initializer.key(),
    )]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = initializer,
        associated_token::mint = mint,
        associated_token::owner = recipient.key(),
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    pub recipient: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut, signer)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::ESCROW, initializer.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.initializer == initializer.key() @ ErrorCode::UnauthorizedInitializer,
        constraint = escrow.state == EscrowState::Created @ ErrorCode::InvalidEscrowState,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [
            seeds::VAULT,
            initializer.key().as_ref(),
            escrow.mint.as_ref()
        ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = escrow.initializer_deposit_token_account,
    )]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [seeds::TREASURY],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReleaseEscrow<'info> {
    #[account(mut, signer)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::ESCROW, initializer.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.initializer == initializer.key() @ ErrorCode::UnauthorizedInitializer,
        constraint = escrow.state == EscrowState::Funded @ ErrorCode::InvalidEscrowState,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [
            seeds::VAULT,
            initializer.key().as_ref(),
            escrow.mint.as_ref()
        ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = escrow.recipient_token_account,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [seeds::TREASURY],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DisputeEscrow<'info> {
    #[account(mut, signer)]
    pub initializer: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::ESCROW, initializer.key().as_ref()],
        bump = escrow.bump,
        constraint = escrow.initializer == initializer.key() @ ErrorCode::UnauthorizedInitializer,
        constraint = escrow.state == EscrowState::Funded @ ErrorCode::InvalidEscrowState,
    )]
    pub escrow: Account<'info, Escrow>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, signer)]
    pub arbiter: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::ESCROW, escrow.initializer.as_ref()],
        bump = escrow.bump,
        constraint = escrow.state == EscrowState::Disputed @ ErrorCode::InvalidEscrowState,
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        mut,
        seeds = [
            seeds::VAULT,
            escrow.initializer.as_ref(),
            escrow.mint.as_ref()
        ],
        bump,
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = escrow.recipient_token_account,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        address = escrow.initializer_deposit_token_account,
    )]
    pub initializer_refund_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [seeds::TREASURY],
        bump,
    )]
    pub treasury: Account<'info, Treasury>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct WithdrawFees<'info> {
    #[account(mut, signer)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [seeds::TREASURY],
        bump = treasury.bump,
        constraint = treasury.authority == authority.key() @ ErrorCode::Unauthorized,
    )]
    pub treasury: Account<'info, Treasury>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::owner = authority.key(),
    )]
    pub authority_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}

const PROTOCOL_FEE_BPS: u64 = 50;

#[program]
pub mod pusd_escrow {
    use super::*;

    pub fn create_service(
        ctx: Context<CreateService>,
        title: String,
        description: String,
        price: u64,
    ) -> Result<()> {
        let service = &mut ctx.accounts.service;
        service.provider = ctx.accounts.provider.key();
        service.title = title;
        service.description = description;
        service.price = price;
        service.created_at = ctx.accounts.clock.unix_timestamp as u64;
        service.active = true;
        service.bump = *ctx.bumps.get("service").unwrap();
        Ok(())
    }

    pub fn update_service(
        ctx: Context<UpdateService>,
        title: Option<String>,
        description: Option<String>,
        price: Option<u64>,
        active: Option<bool>,
    ) -> Result<()> {
        let service = &mut ctx.accounts.service;
        if let Some(t) = title {
            service.title = t;
        }
        if let Some(d) = description {
            service.description = d;
        }
        if let Some(p) = price {
            service.price = p;
        }
        if let Some(a) = active {
            service.active = a;
        }
        Ok(())
    }

    pub fn initialize_treasury(ctx: Context<InitializeTreasury>) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        treasury.authority = ctx.accounts.authority.key();
        treasury.total_fees_collected = 0;
        treasury.bump = *ctx.bumps.get("treasury").unwrap();
        Ok(())
    }

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        amount: u64,
        service_id: Option<u32>,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let fee = (amount * PROTOCOL_FEE_BPS) / 10000;
        
        escrow.initializer = ctx.accounts.initializer.key();
        escrow.recipient = ctx.accounts.recipient.key();
        escrow.service_id = service_id;
        escrow.amount = amount;
        escrow.fee_taken = fee;
        escrow.mint = ctx.accounts.mint.key();
        escrow.vault = ctx.accounts.vault.key();
        escrow.initializer_deposit_token_account = ctx.accounts.initializer_deposit_token_account.key();
        escrow.initializer_receive_token_account = ctx.accounts.initializer_deposit_token_account.key();
        escrow.recipient_token_account = ctx.accounts.recipient_token_account.key();
        escrow.state = EscrowState::Created;
        escrow.bump = *ctx.bumps.get("escrow").unwrap();
        Ok(())
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let vault = &ctx.accounts.vault;
        let initializer_deposit = &ctx.accounts.initializer_deposit_token_account;
        let treasury = &mut ctx.accounts.treasury;

        let total_amount = escrow.amount;
        let fee = escrow.fee_taken;
        let vault_amount = total_amount.saturating_sub(fee);

        require!(
            initializer_deposit.amount >= total_amount,
            ErrorCode::InsufficientFunds
        );

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: initializer_deposit.to_account_info(),
                to: vault.to_account_info(),
                authority: initializer_deposit.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, total_amount)?;

        treasury.total_fees_collected = treasury.total_fees_collected.checked_add(fee).unwrap();

        ctx.accounts.escrow.state = EscrowState::Funded;
        Ok(())
    }

    pub fn release_escrow(ctx: Context<ReleaseEscrow>) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let vault = &ctx.accounts.vault;
        let recipient_token = &ctx.accounts.recipient_token_account;
        let treasury = &mut ctx.accounts.treasury;

        let release_amount = vault.amount.saturating_sub(escrow.fee_taken);

        let seeds = &[
            seeds::ESCROW,
            ctx.accounts.initializer.key().as_ref(),
            &[escrow.bump],
        ];
        let signer_seeds = &[seeds.as_slice()];

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: vault.to_account_info(),
                to: recipient_token.to_account_info(),
                authority: ctx.accounts.escrow.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, release_amount)?;

        treasury.total_fees_collected = treasury.total_fees_collected.checked_sub(escrow.fee_taken).unwrap();

        ctx.accounts.escrow.state = EscrowState::Released;
        Ok(())
    }

    pub fn dispute_escrow(ctx: Context<DisputeEscrow>) -> Result<()> {
        ctx.accounts.escrow.state = EscrowState::Disputed;
        Ok(())
    }

    pub fn resolve_dispute(
        ctx: Context<ResolveDispute>,
        resolution: Resolution,
    ) -> Result<()> {
        let escrow = &ctx.accounts.escrow;
        let vault = &ctx.accounts.vault;
        let treasury = &mut ctx.accounts.treasury;

        let total = vault.amount;
        let fee = escrow.fee_taken;
        let principal = total.saturating_sub(fee);

        let seeds = &[
            seeds::ESCROW,
            escrow.initializer.as_ref(),
            &[escrow.bump],
        ];
        let signer_seeds = &[seeds.as_slice()];

        match resolution {
            Resolution::ReleaseToRecipient => {
                let recipient_token = &ctx.accounts.recipient_token_account;
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault.to_account_info(),
                        to: recipient_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, principal)?;
                
                let fee_to_authority = &ctx.accounts.treasury;
                let fee_cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault.to_account_info(),
                        to: fee_to_authority.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(fee_cpi_ctx, fee)?;
            }
            Resolution::RefundInitializer => {
                let refund_account = &ctx.accounts.initializer_refund_account;
                let cpi_ctx = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault.to_account_info(),
                        to: refund_account.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx, total)?;
            }
            Resolution::SplitPayment => {
                let recipient_token = &ctx.accounts.recipient_token_account;
                let half = principal / 2;
                
                let cpi_ctx_1 = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault.to_account_info(),
                        to: recipient_token.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx_1, half)?;

                let refund_account = &ctx.accounts.initializer_refund_account;
                let cpi_ctx_2 = CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: vault.to_account_info(),
                        to: refund_account.to_account_info(),
                        authority: ctx.accounts.escrow.to_account_info(),
                    },
                    signer_seeds,
                );
                token::transfer(cpi_ctx_2, half)?;
            }
        }

        treasury.total_fees_collected = treasury.total_fees_collected.checked_sub(fee).unwrap();
        ctx.accounts.escrow.state = EscrowState::Resolved;
        Ok(())
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>, amount: u64) -> Result<()> {
        let treasury = &mut ctx.accounts.treasury;
        
        require!(
            treasury.total_fees_collected >= amount,
            ErrorCode::InsufficientFunds
        );

        treasury.total_fees_collected = treasury.total_fees_collected.checked_sub(amount).unwrap();
        Ok(())
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Initializer does not match")]
    UnauthorizedInitializer,
    #[msg("Invalid escrow state for this operation")]
    InvalidEscrowState,
    #[msg("Insufficient funds")]
    InsufficientFunds,
}