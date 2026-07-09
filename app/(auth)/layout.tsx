import { getCurrentProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const result = await getCurrentProfile();

  // If already authenticated with a valid profile, redirect to dashboard
  if (result.success && result.data) {
    redirect("/leads");
  }

  return <>{children}</>;
}
