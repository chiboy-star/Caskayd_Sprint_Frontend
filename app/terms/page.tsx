// app/terms/page.tsx
import TermsOfServiceClient from "./TermsOfServiceClient";

export const metadata = {
  title: "Terms of Service | Caskayd",
  description: "Read the Caskayd Terms of Service to understand the rules, guidelines, and agreements for using our creator marketplace.",
};

export default function Page() {
  return <TermsOfServiceClient />;
}