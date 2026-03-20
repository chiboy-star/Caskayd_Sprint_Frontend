// app/creator/signup/page.tsx
import CreatorSignupClient from "./CreatorSignupClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Sign Up as a Content Creator | Caskayd",
  description: "Join Caskayd as a content creator to connect with premium brands, secure guaranteed payouts via escrow, and scale your influencer business.",
};

export default function Page() {
  return <CreatorSignupClient />;
}