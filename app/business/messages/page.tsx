// app/business/messages/page.tsx
import BusinessMessagesClient from "./BusinessMessagesClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Messages | Caskayd Business",
  description: "send direct messages, review deliverables, and securely fund campaigns via escrow all in one place.",
};

export default function Page() {
  return <BusinessMessagesClient />;
}