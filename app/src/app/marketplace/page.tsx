"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useRouter } from "next/navigation";
import { getProgram, getServiceAddress, createService, ServiceAccount } from "@/lib/anchorClient";

export default function Marketplace() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [myService, setMyService] = useState<ServiceAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    if (!publicKey || !connection) {
      setLoading(false);
      return;
    }

    const fetchService = async () => {
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

        const { getProgram, getService } = await import("@/lib/anchorClient");
        const program = await getProgram(connection, anchorWallet);
        
        const service = await getService(program, publicKey);
        setMyService(service);
      } catch (error) {
        console.error("Error fetching service:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchService();
  }, [publicKey, connection, sendTransaction]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setMessage({ type: "error", text: "Please connect your wallet" });
      return;
    }

    if (!title || !description || !price) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    try {
      setCreating(true);
      setMessage({ type: "", text: "" });

      const amountNum = parseFloat(price);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error("Invalid price");
      }

      const amountLamports = Math.floor(amountNum * 1_000_000);
      const amountBN = new BN(amountLamports);

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

      const { getProgram, createService: doCreateService } = await import("@/lib/anchorClient");
      const program = await getProgram(connection, anchorWallet);

      const tx = await doCreateService(program, publicKey, title, description, amountBN);
      
      setMessage({ type: "success", text: `Service created! Tx: ${tx.slice(0, 8)}...` });
      
      setTimeout(() => {
        const fetchNew = async () => {
          const { getProgram, getService } = await import("@/lib/anchorClient");
          const prog = await getProgram(connection, anchorWallet);
          const svc = await getService(prog, publicKey);
          setMyService(svc);
        };
        fetchNew();
      }, 2000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create service" });
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (priceBN: BN | number | undefined): string => {
    if (!priceBN) return "0";
    const num = typeof priceBN === "number" ? priceBN : Number(priceBN) / 1e6;
    return num.toFixed(2);
  };

  if (!publicKey) {
    return (
      <div>
        <h1 className="page-title">Service Marketplace</h1>
        <div className="card">
          <p style={{ textAlign: "center", color: "var(--text-secondary)" }}>
            Please connect your wallet to view marketplace
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Service Marketplace</h1>
      <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
        Discover and offer professional services
      </p>

      {message.text && (
        <div className={`${message.type === "error" ? "error-message" : "success-message"}`}>
          {message.text}
        </div>
      )}

      <div className="card">
        <h2 style={{ marginBottom: "1rem" }}>Your Service</h2>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : myService ? (
          <div className="service-card">
            <div className="service-header">
              <h3>{myService.title}</h3>
              <span className={`status-badge ${myService.active ? "status-funded" : "status-created"}`}>
                {myService.active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="service-description">{myService.description}</p>
            <div className="service-price">{formatPrice(myService.price)} PUSD</div>
          </div>
        ) : (
          <form onSubmit={handleCreate}>
            <div className="form-group">
              <label className="form-label">Service Title</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Logo Design, Smart Contract Audit"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="Describe your service..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
                style={{ resize: "vertical" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Price (PUSD)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                step="0.01"
                min="0"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={creating}
            >
              {creating ? "Creating Service..." : "Create Service Listing"}
            </button>
          </form>
        )}
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 style={{ marginBottom: "1rem" }}>How It Works</h2>
        <div className="how-it-works">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Create Service</h4>
              <p>List your service with price in PUSD</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>Open Escrow</h4>
              <p>Client creates escrow for your service</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Complete Work</h4>
              <p>Deliver service and release funds</p>
            </div>
          </div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Get Paid</h4>
              <p>Funds released minus 0.5% protocol fee</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .service-card {
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .service-header h3 {
          font-size: 1.125rem;
          font-weight: 600;
        }
        .service-description {
          color: var(--text-secondary);
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
        }
        .service-price {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--accent);
        }
        .how-it-works {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }
        .step {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg-secondary);
          border-radius: 8px;
        }
        .step-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          flex-shrink: 0;
        }
        .step-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
        }
        .step-content p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        textarea.form-input {
          min-height: 80px;
        }
      `}</style>
    </div>
  );
}