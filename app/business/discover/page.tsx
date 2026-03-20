// app/business/discover/page.tsx
import DiscoverPageClient from "./DiscoverPageClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Discover Top Content Creators | Caskayd",
  description: "Browse, filter, and hire verified Instagram and TikTok creators for your brand's next marketing campaign.",
};

export default function Page() {
  return <DiscoverPageClient />;
}