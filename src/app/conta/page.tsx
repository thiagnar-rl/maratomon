import type { Metadata } from "next";
import { AccountDashboard } from "@/components/account/account-dashboard";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false } };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <AccountDashboard />
    </div>
  );
}
