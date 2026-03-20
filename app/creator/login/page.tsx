// app/creator/login/page.tsx
import CreatorLoginClient from "./CreatorLoginClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Creator Login | Caskayd",
  description: "Log in to your Caskayd creator account to review brand offers, manage campaigns, and withdraw your guaranteed earnings.",
};

export default function Page() {
  return <CreatorLoginClient />;
}