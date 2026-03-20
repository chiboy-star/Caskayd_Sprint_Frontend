// app/creator/wallet/page.tsx
import CreatorWalletClient from "./CreatorWalletClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Wallet & Earnings | Caskayd Creator",
  description: "Track your total earnings, pending payments, and total transactions securely in your Caskayd Creator Wallet.",
};

export default function Page() {
  return <CreatorWalletClient />;
}