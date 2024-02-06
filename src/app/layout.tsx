import "@/styles/globals.css";
import "@/styles/data-tables-css.css";
import "@/styles/satoshi.css";

import { ClerkProvider } from "@clerk/nextjs";

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
        <body suppressHydrationWarning={true}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
