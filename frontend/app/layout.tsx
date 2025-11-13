import "./globals.css";
import { Providers } from "./providers";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nebula Atmos — FHE-Powered Ambient Intelligence",
  description: "Privacy-preserving air quality monitoring network secured by Zama FHEVM"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
