"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getProgram, getVaultAddress, getEscrowStateLabel, getEscrowStateClass, fundEscrow, releaseEscrow, disputeEscrow, resolveDispute, EscrowAccount } from "@/lib/anchorClient";

const ARBITER_WALLET = "PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq";

export default function EscrowDetail() {
  const params = useParams();
  const router = useRouter();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [escrow, setEscrow] = useState<EscrowAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const escrowPubkey = params.pubkey as string;

  useEffect(() => {
    if (!escrowPubkey || !connection || !publicKey) {
      setLoading(false);
      return;
    }

    const fetchEscrow = async () => {
      try {
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

        const { getProgram } = await import("@/lib/anchorClient");
        const program = await getProgram(connection, anchorWallet);

        const pubkey = new PublicKey(escrowPubkey);
        const account = await program.account.escrow.fetch(pubkey);

        if (account) {
          setEscrow({ ...account, pubkey } as EscrowAccount);
        } else {
          setMessage({ type: "error", text: "Escrow not found" });
        }
      } catch (e: any) {
        console.error("Error fetching escrow:", e);
        setMessage({ type: "error", text: "Failed to load escrow" });
      } finally {
        setLoading(false);
      }
    };

    fetchEscrow();
  }, [escrowPubkey, connection, publicKey, sendTransaction]);

  const handleFund = async () => {
    if (!publicKey || !escrow) return;
    
    setTxLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

      const { getProgram, fundEscrow: doFund } = await import("@/lib/anchorClient");
      const program = await getProgram(connection, anchorWallet);

      const tx = await doFund(program, publicKey);
      
      setMessage({ type: "success", text: `Escrow funded! Tx: ${tx.slice(0, 8)}...` });
      
      setTimeout(async () => {
        const updated = await program.account.escrow.fetch(new PublicKey(escrowPubkey));
        setEscrow({ ...updated, pubkey: new PublicKey(escrowPubkey) } as EscrowAccount);
      }, 2000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to fund escrow" });
    } finally {
      setTxLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!publicKey || !escrow) return;
    
    setTxLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

      const { getProgram, releaseEscrow: doRelease } = await import("@/lib/anchorClient");
      const program = await getProgram(connection, anchorWallet);

      const tx = await doRelease(program, publicKey);
      
      setMessage({ type: "success", text: `Funds released! Tx: ${tx.slice(0, 8)}...` });
      
      setTimeout(async () => {
        const updated = await program.account.escrow.fetch(new PublicKey(escrowPubkey));
        setEscrow({ ...updated, pubkey: new PublicKey(escrowPubkey) } as EscrowAccount);
      }, 2000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to release funds" });
    } finally {
      setTxLoading(false);
    }
  };

  const handleDispute = async () => {
    if (!publicKey || !escrow) return;
    
    setTxLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

      const { getProgram, disputeEscrow: doDispute } = await import("@/lib/anchorClient");
      const program = await getProgram(connection, anchorWallet);

      const tx = await doDispute(program, publicKey);
      
      setMessage({ type: "success", text: `Escrow disputed! Tx: ${tx.slice(0, 8)}...` });
      
      setTimeout(async () => {
        const updated = await program.account.escrow.fetch(new PublicKey(escrowPubkey));
        setEscrow({ ...updated, pubkey: new PublicKey(escrowPubkey) } as EscrowAccount);
      }, 2000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to dispute escrow" });
    } finally {
      setTxLoading(false);
    }
  };

  const handleResolve = async (resolution: "ReleaseToRecipient" | "RefundInitializer" | "SplitPayment") => {
    if (!publicKey || !escrow) return;
    
    setTxLoading(true);
    setMessage({ type: "", text: "" });

    try {
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

      const { getProgram, resolveDispute: doResolve } = await import("@/lib/anchorClient");
      const program = await getProgram(connection, anchorWallet);

      const tx = await doResolve(program, escrow.initializer, resolution);
      
      setMessage({ type: "success", text: `Dispute resolved (${resolution})! Tx: ${tx.slice(0, 8)}...` });
      
      setTimeout(async () => {
        const updated = await program.account.escrow.fetch(new PublicKey(escrowPubkey));
        setEscrow({ ...updated, pubkey: new PublicKey(escrowPubkey) } as EscrowAccount);
      }, 2000);
    } catch (e: any) {
      setMessage({ type: "error", text: e.message || "Failed to resolve dispute" });
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading escrow...</div>;
  }

  if (!escrow) {
    return (
      <div>
        <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
        <div className="card">
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Escrow not found
          </p>
        </div>
      </div>
    );
  }

  const stateLabel = getEscrowStateLabel(escrow.state);
  const stateClass = getEscrowStateClass(escrow.state);
  const isInitializer = publicKey?.toBase58() === escrow.initializer?.toBase58();
  const canFund = isInitializer && stateLabel === "Created";
  const canRelease = isInitializer && stateLabel === "Funded";
  const canDispute = isInitializer && stateLabel === "Funded";
  const canResolve = stateLabel === "Disputed";

  const formatPubkey = (pubkey: PublicKey | undefined): string => {
    if (!pubkey) return "";
    const str = pubkey.toBase58();
    return str.slice(0, 8) + "..." + str.slice(-4);
  };

  const formatAmount = (amount: any): string => {
    if (!amount) return "0";
    return (Number(amount) / 1e6).toFixed(2);
  };

  return (
    <div>
      <Link href="/dashboard" className="back-link">← Back to Dashboard</Link>
      
      <h1 className="page-title">Escrow Details</h1>

      {message.text && (
        <div className={`${message.type === "error" ? "error-message" : "success-message"}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <div className="detail-section">
          <div className="detail-row">
            <span className="detail-label">Status</span>
            <span className={`status-badge ${stateClass}`}>
              {stateLabel}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Amount</span>
            <span className="detail-value">{formatAmount(escrow.amount)} PUSD</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Protocol Fee (0.5%)</span>
            <span className="detail-value">{formatAmount(escrow.feeTaken)} PUSD</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Initializer</span>
            <span className="detail-value" style={{ fontSize: "0.75rem" }}>
              {formatPubkey(escrow.initializer)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Recipient</span>
            <span className="detail-value" style={{ fontSize: "0.75rem" }}>
              {formatPubkey(escrow.recipient)}
            </span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Vault</span>
            <span className="detail-value" style={{ fontSize: "0.75rem" }}>
              {formatPubkey(escrow.vault)}
            </span>
          </div>
        </div>

        {isInitializer && (
          <div className="actions-row">
            {canFund && (
              <button
                className="btn btn-primary"
                onClick={handleFund}
                disabled={txLoading}
              >
                {txLoading ? "Funding..." : "Fund Escrow"}
              </button>
            )}
            {canRelease && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={handleRelease}
                  disabled={txLoading}
                >
                  {txLoading ? "Releasing..." : "Release Funds"}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleDispute}
                  disabled={txLoading}
                >
                  Dispute
                </button>
              </>
            )}
          </div>
        )}

        {canResolve && (
          <div className="resolve-section">
            <h3 style={{ marginBottom: "1rem", color: "var(--red)" }}>Resolve Dispute (Arbiter Only)</h3>
            <div className="actions-row">
              <button
                className="btn btn-primary"
                onClick={() => handleResolve("ReleaseToRecipient")}
                disabled={txLoading}
              >
                Release to Recipient
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleResolve("RefundInitializer")}
                disabled={txLoading}
              >
                Refund Initializer
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => handleResolve("SplitPayment")}
                disabled={txLoading}
              >
                Split 50/50
              </button>
            </div>
          </div>
        )}

        {!isInitializer && !canResolve && (
          <p style={{ marginTop: "1rem", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Only the initializer can perform actions on this escrow.
          </p>
        )}

        <div className="security-badge">
          <span className="shield-icon">🛡️</span>
          <span>Funds secured by Solana PDA vault</span>
        </div>
      </div>

      <style jsx>{`
        .resolve-section {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border);
        }
        .security-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.5rem;
          padding: 0.75rem;
          background: rgba(0, 220, 130, 0.1);
          border-radius: 8px;
          font-size: 0.875rem;
          color: var(--accent);
        }
        .shield-icon {
          font-size: 1.25rem;
        }
      `}</style>
    </div>
  );
}