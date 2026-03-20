// app/business/signup/page.tsx
import BusinessSignupClient from "./BusinessSignupClient";

// 1. Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Create a Business Account | Caskayd",
  description: "Sign up as a brand on Caskayd to discover, hire, and manage top content creators. Start scaling your influencer marketing campaigns today.",
};

export default function Page() {
  return <BusinessSignupClient />;
}