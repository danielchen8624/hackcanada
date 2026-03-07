import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Auth0Provider } from "@auth0/nextjs-auth0";
import "./globals.css";

const inter = Inter({
  variable: "--font-utility",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "City Heatmap — Real-time Urban Intelligence",
  description: "Feed-first, AI-powered neighborhood safety platform for Waterloo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
