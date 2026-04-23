import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, Idl, BN } from "@coral-xyz/anchor";

export type EscrowState = 
  | { Created: {} }
  | { Funded: {} }
  | { Released: {} }
  | { Disputed: {} }
  | { Resolved: {} };

export type Resolution = 
  | { ReleaseToRecipient: {} }
  | { RefundInitializer: {} }
  | { SplitPayment: {} };

export interface ServiceAccount {
  provider: PublicKey;
  title: string;
  description: string;
  price: BN;
  createdAt: number;
  active: boolean;
  bump: number;
  pubkey?: PublicKey;
}

export interface EscrowAccount {
  initializer: PublicKey;
  recipient: PublicKey;
  serviceId: number | null;
  amount: BN;
  feeTaken: BN;
  mint: PublicKey;
  vault: PublicKey;
  initializerDepositTokenAccount: PublicKey;
  initializerReceiveTokenAccount: PublicKey;
  recipientTokenAccount: PublicKey;
  state: EscrowState;
  bump: number;
  pubkey?: PublicKey;
}

export interface TreasuryAccount {
  authority: PublicKey;
  totalFeesCollected: BN;
  bump: number;
  pubkey?: PublicKey;
}

export const ESCROW_IDL = {
  version: "0.1.0",
  name: "pusd_escrow",
  instructions: [
    {
      name: "createService",
      accounts: [
        { name: "provider", isMut: true, isSigner: true },
        { name: "service", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: [
        { name: "title", type: "string" },
        { name: "description", type: "string" },
        { name: "price", type: "u64" }
      ]
    },
    {
      name: "updateService",
      accounts: [
        { name: "provider", isMut: true, isSigner: true },
        { name: "service", isMut: true, isSigner: false }
      ],
      args: [
        { name: "title", type: { option: "string" } },
        { name: "description", type: { option: "string" } },
        { name: "price", type: { option: "u64" } },
        { name: "active", type: { option: "bool" } }
      ]
    },
    {
      name: "initializeTreasury",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "systemProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "createEscrow",
      accounts: [
        { name: "initializer", isMut: true, isSigner: true },
        { name: "escrow", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "initializerDepositTokenAccount", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "recipient", isMut: true, isSigner: true },
        { name: "systemProgram", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false },
        { name: "associatedTokenProgram", isMut: false, isSigner: false },
        { name: "rent", isMut: false, isSigner: false }
      ],
      args: [
        { name: "amount", type: "u64" },
        { name: "serviceId", type: { option: "u32" } }
      ]
    },
    {
      name: "fundEscrow",
      accounts: [
        { name: "initializer", isMut: true, isSigner: true },
        { name: "escrow", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "initializerDepositTokenAccount", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "releaseEscrow",
      accounts: [
        { name: "initializer", isMut: true, isSigner: true },
        { name: "escrow", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: []
    },
    {
      name: "disputeEscrow",
      accounts: [
        { name: "initializer", isMut: true, isSigner: true },
        { name: "escrow", isMut: true, isSigner: false }
      ],
      args: []
    },
    {
      name: "resolveDispute",
      accounts: [
        { name: "arbiter", isMut: true, isSigner: true },
        { name: "escrow", isMut: true, isSigner: false },
        { name: "vault", isMut: true, isSigner: false },
        { name: "recipientTokenAccount", isMut: true, isSigner: false },
        { name: "initializerRefundAccount", isMut: true, isSigner: false },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "resolution", type: { name: "Resolution" } }]
    },
    {
      name: "withdrawFees",
      accounts: [
        { name: "authority", isMut: true, isSigner: true },
        { name: "treasury", isMut: true, isSigner: false },
        { name: "authorityTokenAccount", isMut: true, isSigner: false },
        { name: "mint", isMut: false, isSigner: false },
        { name: "tokenProgram", isMut: false, isSigner: false }
      ],
      args: [{ name: "amount", type: "u64" }]
    }
  ],
  accounts: [
    {
      name: "Service",
      type: {
        kind: "struct",
        fields: [
          { name: "provider", type: "publicKey" },
          { name: "title", type: "string" },
          { name: "description", type: "string" },
          { name: "price", type: "u64" },
          { name: "createdAt", type: "u64" },
          { name: "active", type: "bool" },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Escrow",
      type: {
        kind: "struct",
        fields: [
          { name: "initializer", type: "publicKey" },
          { name: "recipient", type: "publicKey" },
          { name: "serviceId", type: { option: "u32" } },
          { name: "amount", type: "u64" },
          { name: "feeTaken", type: "u64" },
          { name: "mint", type: "publicKey" },
          { name: "vault", type: "publicKey" },
          { name: "initializerDepositTokenAccount", type: "publicKey" },
          { name: "initializerReceiveTokenAccount", type: "publicKey" },
          { name: "recipientTokenAccount", type: "publicKey" },
          { name: "state", type: { kind: "enum", variants: [{ name: "Created" }, { name: "Funded" }, { name: "Released" }, { name: "Disputed" }, { name: "Resolved" }] } },
          { name: "bump", type: "u8" }
        ]
      }
    },
    {
      name: "Treasury",
      type: {
        kind: "struct",
        fields: [
          { name: "authority", type: "publicKey" },
          { name: "totalFeesCollected", type: "u64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  errors: [
    { code: 6000, name: "Unauthorized", msg: "Unauthorized" },
    { code: 6001, name: "UnauthorizedInitializer", msg: "Initializer does not match" },
    { code: 6002, name: "InvalidEscrowState", msg: "Invalid escrow state for this operation" },
    { code: 6003, name: "InsufficientFunds", msg: "Insufficient funds" }
  ]
};

export const ESCROW_IDL_CONST = ESCROW_IDL;

export const PROGRAM_ID = new PublicKey("PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq");
export const ESCROW_SEED = "escrow";
export const VAULT_SEED = "vault";
export const SERVICE_SEED = "service";
export const TREASURY_SEED = "treasury";

export function getEscrowAddress(initializer: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ESCROW_SEED), initializer.toBuffer()],
    PROGRAM_ID
  );
}

export function getVaultAddress(initializer: PublicKey, mint: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), initializer.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
}

export function getServiceAddress(provider: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(SERVICE_SEED), provider.toBuffer()],
    PROGRAM_ID
  );
}

export function getTreasuryAddress(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(TREASURY_SEED)],
    PROGRAM_ID
  );
}

export function getEscrowStateLabel(state: EscrowState | string): string {
  if (typeof state === "string") return state;
  if ("Created" in state) return "Created";
  if ("Funded" in state) return "Funded";
  if ("Released" in state) return "Released";
  if ("Disputed" in state) return "Disputed";
  if ("Resolved" in state) return "Resolved";
  return "Unknown";
}

export function getEscrowStateClass(state: EscrowState | string): string {
  const label = getEscrowStateLabel(state).toLowerCase();
  return `status-${label}`;
}

export async function getProgram(connection: Connection, wallet: any): Promise<Program<typeof ESCROW_IDL>> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  return new Program(ESCROW_IDL as Idl, PROGRAM_ID, provider);
}

export async function getService(
  program: Program<typeof ESCROW_IDL>,
  provider: PublicKey
): Promise<ServiceAccount | null> {
  try {
    const [servicePubkey] = getServiceAddress(provider);
    const account = await program.account.service.fetch(servicePubkey);
    if (account) {
      return { ...account, pubkey: servicePubkey } as ServiceAccount;
    }
    return null;
  } catch {
    return null;
  }
}

export async function getTreasury(program: Program<typeof ESCROW_IDL>): Promise<TreasuryAccount | null> {
  try {
    const [treasuryPubkey] = getTreasuryAddress();
    const account = await program.account.treasury.fetch(treasuryPubkey);
    if (account) {
      return { ...account, pubkey: treasuryPubkey } as TreasuryAccount;
    }
    return null;
  } catch {
    return null;
  }
}

export async function createService(
  program: Program<typeof ESCROW_IDL>,
  provider: PublicKey,
  title: string,
  description: string,
  price: BN
): Promise<string> {
  const [servicePubkey] = getServiceAddress(provider);

  const tx = await program.methods
    .createService(title, description, price)
    .accounts({
      provider,
      service: servicePubkey,
    })
    .rpc();

  return tx;
}

export async function updateService(
  program: Program<typeof ESCROW_IDL>,
  provider: PublicKey,
  title?: string,
  description?: string,
  price?: BN,
  active?: boolean
): Promise<string> {
  const [servicePubkey] = getServiceAddress(provider);

  const tx = await program.methods
    .updateService(title || null, description || null, price || null, active || null)
    .accounts({
      provider,
      service: servicePubkey,
    })
    .rpc();

  return tx;
}

export async function initializeTreasury(
  program: Program<typeof ESCROW_IDL>,
  authority: PublicKey
): Promise<string> {
  const [treasuryPubkey] = getTreasuryAddress();

  const tx = await program.methods
    .initializeTreasury()
    .accounts({
      authority,
      treasury: treasuryPubkey,
    })
    .rpc();

  return tx;
}

export async function createEscrow(
  program: Program<typeof ESCROW_IDL>,
  initializer: PublicKey,
  recipient: PublicKey,
  mint: PublicKey,
  amount: BN,
  serviceId?: number
): Promise<string> {
  const [escrowPda] = getEscrowAddress(initializer);
  const [vaultPda] = getVaultAddress(initializer, mint);

  const getAssociatedTokenAddress = (owner: PublicKey, mint: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [owner.toBuffer(), mint.toBuffer()],
      new PublicKey("ATokenGPvbdGVxr1b2hvZ2iqAkZGK4N2itwWu3oMRyFdjJd")
    )[0];
  };

  const initializerDepositATA = getAssociatedTokenAddress(initializer, mint);
  const recipientATA = getAssociatedTokenAddress(recipient, mint);
  const [treasuryPubkey] = getTreasuryAddress();

  const tx = await program.methods
    .createEscrow(amount, serviceId || null)
    .accounts({
      initializer,
      escrow: escrowPda,
      mint,
      vault: vaultPda,
      initializerDepositTokenAccount: initializerDepositATA,
      recipientTokenAccount: recipientATA,
      recipient,
      treasury: treasuryPubkey,
    })
    .rpc();

  return tx;
}

export async function fundEscrow(
  program: Program<typeof ESCROW_IDL>,
  initializer: PublicKey
): Promise<string> {
  const [escrowPda] = getEscrowAddress(initializer);
  const escrow = await program.account.escrow.fetch(escrowPda);
  
  if (!escrow) throw new Error("Escrow not found");

  const [vaultPda] = getVaultAddress(initializer, escrow.mint);
  const [treasuryPubkey] = getTreasuryAddress();

  const tx = await program.methods
    .fundEscrow()
    .accounts({
      initializer,
      escrow: escrowPda,
      vault: vaultPda,
      initializerDepositTokenAccount: escrow.initializerDepositTokenAccount,
      treasury: treasuryPubkey,
    })
    .rpc();

  return tx;
}

export async function releaseEscrow(
  program: Program<typeof ESCROW_IDL>,
  initializer: PublicKey
): Promise<string> {
  const [escrowPda] = getEscrowAddress(initializer);
  const escrow = await program.account.escrow.fetch(escrowPda);
  
  if (!escrow) throw new Error("Escrow not found");

  const [vaultPda] = getVaultAddress(initializer, escrow.mint);
  const [treasuryPubkey] = getTreasuryAddress();

  const tx = await program.methods
    .releaseEscrow()
    .accounts({
      initializer,
      escrow: escrowPda,
      vault: vaultPda,
      recipientTokenAccount: escrow.recipientTokenAccount,
      treasury: treasuryPubkey,
    })
    .rpc();

  return tx;
}

export async function disputeEscrow(
  program: Program<typeof ESCROW_IDL>,
  initializer: PublicKey
): Promise<string> {
  const [escrowPda] = getEscrowAddress(initializer);

  const tx = await program.methods
    .disputeEscrow()
    .accounts({
      initializer,
      escrow: escrowPda,
    })
    .rpc();

  return tx;
}

export async function resolveDispute(
  program: Program<typeof ESCROW_IDL>,
  escrowInitializer: PublicKey,
  resolution: "ReleaseToRecipient" | "RefundInitializer" | "SplitPayment"
): Promise<string> {
  const [escrowPda] = getEscrowAddress(escrowInitializer);
  const escrow = await program.account.escrow.fetch(escrowPda);
  
  if (!escrow) throw new Error("Escrow not found");

  const [vaultPda] = getVaultAddress(escrowInitializer, escrow.mint);
  const [treasuryPubkey] = getTreasuryAddress();

  const arbiter = program.provider.wallet.publicKey;

  const tx = await program.methods
    .resolveDispute({ [resolution]: {} })
    .accounts({
      arbiter,
      escrow: escrowPda,
      vault: vaultPda,
      recipientTokenAccount: escrow.recipientTokenAccount,
      initializerRefundAccount: escrow.initializerDepositTokenAccount,
      treasury: treasuryPubkey,
    })
    .rpc();

  return tx;
}

export async function withdrawFees(
  program: Program<typeof ESCROW_IDL>,
  authority: PublicKey,
  mint: PublicKey,
  amount: BN
): Promise<string> {
  const [treasuryPubkey] = getTreasuryAddress();

  const getAssociatedTokenAddress = (owner: PublicKey, mint: PublicKey) => {
    return PublicKey.findProgramAddressSync(
      [owner.toBuffer(), mint.toBuffer()],
      new PublicKey("ATokenGPvbdGVxr1b2hvZ2iqAkZGK4N2itwWu3oMRyFdjJd")
    )[0];
  };

  const authorityATA = getAssociatedTokenAddress(authority, mint);

  const tx = await program.methods
    .withdrawFees(amount)
    .accounts({
      authority,
      treasury: treasuryPubkey,
      authorityTokenAccount: authorityATA,
      mint,
    })
    .rpc();

  return tx;
}