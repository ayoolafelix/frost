export const metadata = {
  title: "PUSD Escrow Network",
  description: "Solana-based escrow protocol using PUSD",
};

import { Providers } from "@/components/Providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}