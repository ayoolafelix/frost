"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useRouter } from "next/navigation";
import { getProgram, getEscrowAddress, getVaultAddress, createEscrow } from "@/lib/anchorClient";
import { PUSD_MINT } from "@/lib/wallet";

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!recipient || !amount) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      const recipientPubkey = new PublicKey(recipient);
      const amountNum = parseFloat(amount);
      
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid amount");
      }

      const amountLamports = Math.floor(amountNum * 1_000_000);
      const amountBN = new BN(amountLamports);
      const mint = new PublicKey(PUSD_MINT);

      const anchorWallet = {
        publicKey: publicKey,
        signTransaction: async (tx: any) => {
          return await sendTransaction(tx, connection);
        },
        signAllTransactions: async (txs: any[]) => {
          const signedTxs = [];
          for (const tx of txs) {
            signedTxs.push(await sendTransaction(tx, connection));
          }
          return signedTxs;
        },
      };

      const program = await getProgram(connection, anchorWallet);
      const [escrowPda] = getEscrowAddress(publicKey);
      const [vaultPda] = getVaultAddress(publicKey, mint);

      const { findProgramAddressSync } = await import("@solana/web3.js");
      
      const getAssociatedTokenAddress = (owner: PublicKey, mint: PublicKey) => {
        return findProgramAddressSync(
          [owner.toBuffer(), mint.toBuffer()],
          new PublicKey("ATokenGPvbdGVxr1b2hvZ2iqAkZGK4N2itwWu3oMRyFdjJd")
        )[0];
      };

      const initializerDepositATA = getAssociatedTokenAddress(publicKey, mint);
      const initializerReceiveATA = getAssociatedTokenAddress(recipientPubkey, mint);

      try {
        const tx = await program.methods
          .createEscrow(amountBN)
          .accounts({
            initializer: publicKey,
            escrow: escrowPda,
            mint: mint,
            vault: vaultPda,
            initializerDepositTokenAccount: initializerDepositATA,
            initializerReceiveTokenAccount: initializerReceiveATA,
            recipient: recipientPubkey,
          })
          .rpc();

        setMessage({ type: "success", text: `Escrow created! Tx: ${tx.slice(0, 8)}...` });
        setTimeout(() => router.push("/dashboard"), 1500);
      } catch (err: any) {
        console.error("Create escrow error:", err);
        if (err.message?.includes("0x0") || err.message?.includes("already in use")) {
          setMessage({ type: "error", text: "Escrow already exists for this wallet" });
        } else {
          setMessage({ type: "error", text: err.message || "Failed to create escrow" });
        }
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create escrow" });
    } finally {
      setLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="card">
        <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          Please connect your wallet to create an escrow
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Create Escrow</h1>
      
      {message.text && (
        <div className={`${message.type === "error" ? "error-message" : "success-message"}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Recipient Wallet</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter recipient wallet address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Amount (PUSD)</label>
            <input
              type="number"
              className="form-input"
              placeholder="Enter amount in PUSD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.000001"
              min="0"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? "Creating Escrow..." : "Create Escrow"}
          </button>
        </form>
      </div>
    </div>
  );
}