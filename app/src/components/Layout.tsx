"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">
            <Link href="/">PUSD Escrow Network</Link>
          </h1>
          <nav className="nav">
            <Link href="/" className={pathname === "/" ? "nav-link active" : "nav-link"}>
              Create
            </Link>
            <Link href="/marketplace" className={pathname === "/marketplace" ? "nav-link active" : "nav-link"}>
              Marketplace
            </Link>
            <Link href="/dashboard" className={pathname === "/dashboard" ? "nav-link active" : "nav-link"}>
              Dashboard
            </Link>
          </nav>
          <WalletMultiButton />
        </div>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}