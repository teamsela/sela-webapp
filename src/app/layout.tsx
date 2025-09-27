import "@/styles/globals.css";
import "@/styles/data-tables-css.css";
import "@/styles/satoshi.css";

import { Analytics } from "@vercel/analytics/next"

import { ClerkProvider } from "@clerk/nextjs";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | Sela Bible Poetry"
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
      <html lang="en">
        <link rel="icon" href="/images/favicon.ico" sizes="any" />
        <body suppressHydrationWarning={true}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
