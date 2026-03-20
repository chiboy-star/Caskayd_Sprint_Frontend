// app/business/login/page.tsx
import BusinessLoginClient from "./BusinessLoginClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Business Login | Caskayd",
  description: "Log in to your Caskayd business account to discover top creators, manage your campaigns, and release secure escrow payouts.",
};

export default function Page() {
  return <BusinessLoginClient />;
}