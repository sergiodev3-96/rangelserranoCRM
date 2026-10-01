import { getCurrentProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/ui/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentProfile();

  if (!result.success || !result.data) {
    redirect("/login");
  }

  const profile = result.data;

  // Account disabled: sign out and redirect
  if (!profile.active) {
    redirect("/login?error=account_disabled");
  }

  return (
    <DashboardShell profile={profile}>
      {children}
    </DashboardShell>
  );
}
