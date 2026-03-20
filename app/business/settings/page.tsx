// app/business/settings/page.tsx
import BusinessSettingsClient from "./BusinessSettingsClient";

// SEO: Write SEO titles and Meta descriptions (Server-side)
export const metadata = {
  title: "Account Settings | Caskayd Business",
  description: "Manage your Caskayd business profile, update your password, and control your account settings.",
};

export default function Page() {
  return <BusinessSettingsClient />;
}