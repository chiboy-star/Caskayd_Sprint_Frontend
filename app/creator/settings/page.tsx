// app/creator/settings/page.tsx
import CreatorSettingsClient from "./CreatorSettingsClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Account Settings | Caskayd Creator",
  description: "Manage your Caskayd creator profile, update your rates, edit your bio, and control your account security settings.",
};

export default function Page() {
  return <CreatorSettingsClient />;
}