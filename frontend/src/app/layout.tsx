import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Adrex Media OS - Agency Management",
  description: "Enterprise SaaS for Influencer & Performance Marketing Agencies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="space-deep-black"
          enableSystem={false}
          disableTransitionOnChange
          themes={[
            'space-deep-black',
            'cyber-surface',
            'premium-light',
            'executive-stark',
            'electric-violet',
            'hyper-cyan',
            'creator-pink',
            'muted-border',
            'subtext-gray',
            'enterprise-gold',
          ]}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
