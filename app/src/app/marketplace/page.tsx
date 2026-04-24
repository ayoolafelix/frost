"use client";

import { useState, useEffect } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PUSD_MINT } from "@/lib/wallet";

const MOCK_SERVICES = [
  {
    id: "1",
    title: "Smart Contract Audit",
    description: "Professional security audit for your Solana smart contracts. Full code review, vulnerability assessment, and optimization recommendations.",
    price: 500,
    provider: "7xKXa...",
    image: "🔒",
  },
  {
    id: "2", 
    title: "Token Development",
    description: "Complete SPL token creation with metadata, minting capabilities, and transfer hooks. Includes token 2022 standard.",
    price: 250,
    provider: "8mKYa...",
    image: "🪙",
  },
  {
    id: "3",
    title: "dApp Development",
    description: "End-to-end decentralized application development with Next.js frontend and Anchor backend integration.",
    price: 1000,
    provider: "9nLZb...",
    image: "🌐",
  },
  {
    id: "4",
    title: "NFT Collection Setup",
    description: "Full NFT collection deployment with candy machine, compression, and marketplace integration.",
    price: 350,
    provider: "2pMc...",
    image: "🎨",
  },
  {
    id: "5",
    title: "Solana Program Security",
    description: "Comprehensive security analysis for Anchor programs following certik methodology.",
    price: 750,
    provider: "3qNdz...",
    image: "🛡️",
  },
  {
    id: "6",
    title: "Wallet Adapter Integration",
    description: "Integrate Phantom, Slope, Solflare, and other wallets into your Next.js or React application.",
    price: 150,
    provider: "4rOep...",
    image: "👛",
  },
];

export default function Marketplace() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!publicKey) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    if (!title || !description || !price) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    setCreating(true);
    setMessage({ type: "success", text: "Service created! Redirecting to checkout..." });
    
    setTimeout(() => {
      router.push(`/checkout?service=${encodeURIComponent(title)}&price=${price}`);
    }, 1500);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleServiceClick = (serviceId: string, servicePrice: number) => {
    router.push(`/checkout?service=${serviceId}&price=${servicePrice}`);
  };

  return (
    <div>
      <h1 className="page-title">Service Marketplace</h1>
      <p className="page-subtitle">Discover professional Solana services</p>

      {message.text && (
        <div className={`${message.type === "error" ? "error-message" : "success-message"}`}>
          {message.text}
        </div>
      )}

      <div className="grid">
        {MOCK_SERVICES.map((service) => (
          <Link 
            key={service.id}
            href={`/checkout?service=${service.id}&price=${service.price}`}
            className="product-card"
          >
            <div className="product-image">{service.image}</div>
            <div className="product-body">
              <h3 className="product-title">{service.title}</h3>
              <p className="product-description">{service.description}</p>
              <div className="product-footer">
                <span className="product-price">{formatPrice(service.price)} PUSD</span>
                <button className="product-button">Buy Now</button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 className="card-title" style={{ marginBottom: "1rem" }}>List Your Service</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem", fontSize: "0.875rem" }}>
          Offer your Solana development services to the community
        </p>
        
        <form onSubmit={handleCreate}>
          <div className="form-group">
            <label className="form-label">Service Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Smart Contract Audit"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              placeholder="Describe your service in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              required
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
            {creating ? "Creating..." : "List Service"}
          </button>
        </form>
      </div>
    </div>
  );
}