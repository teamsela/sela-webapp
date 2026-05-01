import "@/styles/globals.css";
import "@/styles/data-tables-css.css";
import "@/styles/satoshi.css";

import { Analytics } from "@vercel/analytics/next"
import { Quicksand } from "next/font/google";

import { ClerkProvider } from "@clerk/nextjs";

import { Metadata } from "next";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sela | Bible Poetry"
  // other metadata
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#ffc400"
        }
      }}>
      <html lang="en" className={quicksand.variable}>
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <body suppressHydrationWarning={true}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
