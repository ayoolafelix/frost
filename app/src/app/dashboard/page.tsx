"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { useRouter } from "next/navigation";
import { getProgram, getEscrowAddress, getEscrowStateLabel, getEscrowStateClass, EscrowAccount } from "@/lib/anchorClient";

export default function Dashboard() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [escrows, setEscrows] = useState<EscrowAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!publicKey || !connection) {
      setLoading(false);
      return;
    }

    const fetchEscrows = async () => {
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

        const [escrowPda] = getEscrowAddress(publicKey);
        
        try {
          const account = await program.account.escrow.fetch(escrowPda);
          if (account) {
            const escrow = account as unknown as EscrowAccount;
            setEscrows([{ ...escrow, pubkey: escrowPda }]);
          } else {
            setEscrows([]);
          }
        } catch (e) {
          setEscrows([]);
        }
      } catch (error) {
        console.error("Error fetching escrows:", error);
        setEscrows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEscrows();
  }, [publicKey, connection, sendTransaction]);

  const filteredEscrows = escrows.filter(e => {
    if (filter === "all") return true;
    const state = getEscrowStateLabel(e.state).toLowerCase();
    return state === filter;
  });

  if (!publicKey) {
    return (
      <div>
        <h1 className="page-title">Escrow Dashboard</h1>
        <div className="card">
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Please connect your wallet to view escrows
          </p>
        </div>
      </div>
    );
  }

  const formatPubkey = (pubkey: PublicKey | undefined): string => {
    if (!pubkey) return "";
    const str = pubkey.toBase58();
    return str.slice(0, 4) + "..." + str.slice(-4);
  };

  const formatAmount = (amount: any): string => {
    if (!amount) return "0";
    return (Number(amount) / 1e6).toFixed(2);
  };

  return (
    <div>
      <h1 className="page-title">Escrow Dashboard</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Manage your escrows
      </p>

      <div className="filter-bar">
        <button 
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button 
          className={`filter-btn ${filter === "created" ? "active" : ""}`}
          onClick={() => setFilter("created")}
        >
          Created
        </button>
        <button 
          className={`filter-btn ${filter === "funded" ? "active" : ""}`}
          onClick={() => setFilter("funded")}
        >
          Funded
        </button>
        <button 
          className={`filter-btn ${filter === "disputed" ? "active" : ""}`}
          onClick={() => setFilter("disputed")}
        >
          Disputed
        </button>
        <button 
          className={`filter-btn ${filter === "released" ? "active" : ""}`}
          onClick={() => setFilter("released")}
        >
          Released
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : filteredEscrows.length === 0 ? (
        <div className="empty-state">
          <p>No {filter === "all" ? "" : filter} escrows found</p>
          <a href="/" className="btn btn-primary" style={{ marginTop: "1rem", display: "inline-flex" }}>
            Create Escrow
          </a>
        </div>
      ) : (
        <div className="escrow-list">
          {filteredEscrows.map((escrow) => (
            <a
              key={escrow.pubkey?.toBase58() || ""}
              href={`/escrow/${escrow.pubkey?.toBase58() || ""}`}
              className="escrow-item"
            >
              <div className="escrow-info">
                <h3>Escrow with {formatPubkey(escrow.recipient)}</h3>
                <p>{formatAmount(escrow.amount)} PUSD</p>
              </div>
              <div className="escrow-meta">
                <span className={`status-badge ${getEscrowStateClass(escrow.state)}`}>
                  {getEscrowStateLabel(escrow.state)}
                </span>
                <span className="share-link">Share ↗</span>
              </div>
            </a>
          ))}
        </div>
      )}

      <style jsx>{`
        .filter-bar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .filter-btn {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.2s;
        }
        .filter-btn:hover {
          border-color: var(--accent);
          color: var(--text-primary);
        }
        .filter-btn.active {
          background: var(--accent);
          color: #000;
          border-color: var(--accent);
        }
        .escrow-meta {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .share-link {
          font-size: 0.75rem;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .share-link:hover {
          color: var(--accent);
        }
      `}</style>
    </div>
  );
}