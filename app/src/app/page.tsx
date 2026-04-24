"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="card">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">PUSD Escrow Network</h1>
      <p className="page-subtitle">Secure payments for Solana services</p>

      <div className="grid">
        <Link href="/marketplace" className="product-card">
          <div className="product-image">🛒</div>
          <div className="product-body">
            <h3 className="product-title">Browse Services</h3>
            <p className="product-description">Discover professional Solana development services and hire providers securely with escrow-protected payments.</p>
          </div>
        </Link>

        <Link href="/dashboard" className="product-card">
          <div className="product-image">📊</div>
          <div className="product-body">
            <h3 className="product-title">Your Dashboard</h3>
            <p className="product-description">View and manage your active escrows, track payments, and resolve disputes.</p>
          </div>
        </Link>
      </div>

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2 className="card-title">Quick Stats</h2>
        <div className="detail-row">
          <span className="detail-label">Connected Wallet</span>
          <span className="detail-value">
            {publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : "Not connected"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Protocol</span>
          <span className="detail-value">Solana Devnet</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Fee</span>
          <span className="detail-value">0.5%</span>
        </div>
      </div>

      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Need PUSD for testing? {' '}
          <a 
            href="#" 
            style={{ color: "var(--accent)" }}
            onClick={(e) => {
              e.preventDefault();
              alert("Use devnet faucet: solana airdrop 2");
            }}
          >
            Get devnet SOL
          </a>
        </p>
      </div>
    </div>
  );
}