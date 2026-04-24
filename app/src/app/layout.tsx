"use client";

import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletContextProvider } from "@/lib/wallet";
import { AppLayout } from "@/components/Layout";
import "@/styles/globals.css";

export const metadata = {
  title: "PUSD Escrow Network",
  description: "Solana-based escrow protocol using PUSD",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <WalletContextProvider>
          <AppLayout>{children}</AppLayout>
        </WalletContextProvider>
      </body>
    </html>
  );
}