// app/page.tsx
import LandingPageClient from "./LandingPageClient"; // Adjust path as needed

// 1. Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Hire Top Content Creators & Influencers | Caskayd",
  description: "Find, hire, and manage Instagram, TikTok, and YouTube creators for your brand campaigns. Secure escrow payouts.",
};

export default function Page() {
  return <LandingPageClient />;
}