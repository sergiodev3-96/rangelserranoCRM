import { getCurrentProfile } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/ui/Sidebar";
import Header from "@/components/ui/Header";

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

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-bg-base text-text-primary">
      {/* Sidebar Navigation */}
      <Sidebar isAdmin={profile.role === "admin"} />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Atmospheric glow */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

        {/* Global Dashboard Header */}
        <Header profile={profile} />

        {/* Content Area */}
        <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
