// app/creator/dashboard/page.tsx
import CreatorDashboardClient from "./CreatorDashboardClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Creator Dashboard | Caskayd",
  description: "Manage your incoming brand invites, track your escrow earnings, and oversee your influencer campaigns on Caskayd.",
};

export default function Page() {
  return <CreatorDashboardClient />;
}