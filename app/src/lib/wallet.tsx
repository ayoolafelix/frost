import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo } from "react";

export const WalletContextProvider = ({ children }: { children: React.ReactNode }) => {
  const endpoint = useMemo(() => clusterApiUrl("devnet"), []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    // @ts-ignore
    <ConnectionProvider endpoint={endpoint}>
      // @ts-ignore
      <WalletProvider wallets={wallets} autoConnect>
        // @ts-ignore
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export const PROGRAM_ID = "PUSDXqSqhN7s5EvWqRGrQB3JpGtK1Z3vN7aTqzK3XqYq";
export const PUSD_MINT = "EPjFWdd5AufqSSqeM5mLPxaY6DVTNRsGZLtBfkZ16MyW";