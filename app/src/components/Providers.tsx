"use client";

import { WalletContextProvider } from "@/lib/wallet";
import { AppLayout } from "@/components/Layout";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletContextProvider>
      <AppLayout>{children}</AppLayout>
    </WalletContextProvider>
  );
}