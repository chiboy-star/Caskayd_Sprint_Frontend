// app/creator/messages/page.tsx
import CreatorMessagesClient from "./CreatorMessagesClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Messages & Collaborations | Caskayd Creator",
  description: "Chat directly with brands and submit your content deliverables securely on Caskayd.",
};

export default function Page() {
  return <CreatorMessagesClient />;
}