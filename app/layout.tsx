import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import OfflineIndicator from "@/components/OfflineIndicator"
import InstallBanner from "@/components/InstallBanner"
import { SocketProvider } from "@/components/SocketContext";
 
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Caskayd - Simplifing Influencer Marketing For Businesses",
  description: "Your Partner For Strategic Influncer Marketing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <SocketProvider>
        <OfflineIndicator />
        <InstallBanner />
        {children}
        </SocketProvider>
      </body>
    </html>
  );
}
