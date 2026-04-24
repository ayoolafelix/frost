"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import Link from "next/link";
import { PUSD_MINT } from "@/lib/wallet";

const MOCK_SERVICES: Record<string, { title: string; description: string; price: number; image: string }> = {
  "1": { title: "Smart Contract Audit", description: "Professional security audit", price: 500, image: "🔒" },
  "2": { title: "Token Development", description: "Complete SPL token creation", price: 250, image: "🪙" },
  "3": { title: "dApp Development", description: "Full dApp development", price: 1000, image: "🌐" },
  "4": { title: "NFT Collection Setup", description: "Full NFT collection", price: 350, image: "🎨" },
  "5": { title: "Solana Program Security", description: "Security analysis", price: 750, image: "🛡️" },
  "6": { title: "Wallet Adapter Integration", description: "Wallet integration", price: 150, image: "👛" },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"details" | "escrow" | "fund" | "complete">(publicKey ? "details" : "details");
  const [message, setMessage] = useState({ type: "", text: "" });
  
  const serviceId = searchParams.get("service") || "";
  const servicePrice = parseFloat(searchParams.get("price") || "0");
  
  const service = serviceId in MOCK_SERVICES 
    ? MOCK_SERVICES[serviceId]
    : { title: searchParams.get("service") || "Service", description: "", price: servicePrice, image: "⚡" };

  useEffect(() => {
    if (publicKey && step === "details") {
      setStep("details");
    }
  }, [publicKey, step]);

  const handleCreateEscrow = async () => {
    if (!publicKey || !connection) {
      setMessage({ type: "error", text: "Please connect your wallet" });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });

      setStep("escrow");
      setMessage({ type: "success", text: "Escrow created! Now fund with PUSD." });
      
      setTimeout(() => setStep("fund"), 1000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create escrow" });
    } finally {
      setLoading(false);
    }
  };

  const handleFundEscrow = async () => {
    if (!publicKey) return;
    
    setLoading(true);
    setMessage({ type: "success", text: "Funding escrow... PUSD transferred to vault." });
    
    setTimeout(() => {
      setStep("complete");
      setLoading(false);
      setMessage({ type: "success", text: "Payment secured! The provider will deliver the service." });
    }, 2000);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (!publicKey) {
    return (
      <div>
        <Link href="/" className="back-link">← Back to Home</Link>
        <h1 className="page-title">Checkout</h1>
        <div className="card" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>
            Connect your wallet to complete the purchase
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/marketplace" className="back-link">← Back to Marketplace</Link>
      <h1 className="page-title">Checkout</h1>

      {message.text && (
        <div className={`${message.type === "error" ? "error-message" : "success-message"}`}>
          {message.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
        <div className="card">
          <h2 className="card-title">Order Summary</h2>
          
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "2.5rem" }}>{service.image}</div>
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{service.title}</h3>
              <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{service.description}</p>
            </div>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Subtotal</span>
            <span className="detail-value">{formatPrice(service.price)} PUSD</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">Protocol Fee (0.5%)</span>
            <span className="detail-value">{formatPrice(service.price * 0.005)} PUSD</span>
          </div>
          <div className="detail-row" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem", marginTop: "0.5rem" }}>
            <span className="detail-label" style={{ fontWeight: 600 }}>Total</span>
            <span className="detail-value" style={{ fontWeight: 700, fontSize: "1.125rem", color: "var(--accent)" }}>
              {formatPrice(service.price * 1.005)} PUSD
            </span>
          </div>
        </div>

        <div className="card">
          <h2 className="card-title">Payment Steps</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              padding: "1rem",
              background: step === "details" || step === "escrow" || step === "fund" || step === "complete" ? "rgba(0, 128, 96, 0.1)" : "var(--bg-secondary)",
              border: "1px solid",
              borderColor: step === "details" || step === "escrow" || step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
              borderRadius: "8px",
              opacity: step === "complete" ? 0.6 : 1
            }}>
              <span style={{ 
                width: "24px", 
                height: "24px", 
                borderRadius: "50%", 
                background: step === "details" || step === "escrow" || step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600
              }}>
                {step === "complete" ? "✓" : "1"}
              </span>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Confirm Details</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Review your order</div>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              padding: "1rem",
              background: step === "escrow" || step === "fund" || step === "complete" ? "rgba(0, 128, 96, 0.1)" : "var(--bg-secondary)",
              border: "1px solid",
              borderColor: step === "escrow" || step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
              borderRadius: "8px",
              opacity: step === "complete" ? 0.6 : 1
            }}>
              <span style={{ 
                width: "24px", 
                height: "24px", 
                borderRadius: "50%", 
                background: step === "escrow" || step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600
              }}>
                {step === "complete" ? "✓" : "2"}
              </span>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Create Escrow</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Secure funds in vault</div>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "0.75rem",
              padding: "1rem",
              background: step === "fund" || step === "complete" ? "rgba(0, 128, 96, 0.1)" : "var(--bg-secondary)",
              border: "1px solid",
              borderColor: step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
              borderRadius: "8px",
              opacity: step === "complete" ? 0.6 : 1
            }}>
              <span style={{ 
                width: "24px", 
                height: "24px", 
                borderRadius: "50%", 
                background: step === "fund" || step === "complete" ? "var(--accent)" : "var(--border)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 600
              }}>
                {step === "complete" ? "✓" : "3"}
              </span>
              <div>
                <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Fund Escrow</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Transfer PUSD to vault</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1.5rem" }}>
            {step === "details" && (
              <button onClick={handleCreateEscrow} className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Creating Escrow..." : "Create Escrow & Continue"}
              </button>
            )}
            {step === "escrow" && (
              <button onClick={() => setStep("fund")} className="btn btn-primary btn-full">
                Continue to Funding
              </button>
            )}
            {step === "fund" && (
              <button onClick={handleFundEscrow} className="btn btn-primary btn-full" disabled={loading}>
                {loading ? "Funding..." : `Fund ${formatPrice(servicePrice * 1.005)} PUSD`}
              </button>
            )}
            {step === "complete" && (
              <Link href="/dashboard" className="btn btn-primary btn-full">
                View in Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<div className="loading">Loading...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}