"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import type { Profile } from "@/types/profiles";

type HeaderProps = {
  profile: Profile;
};

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const result = await logout();
      if (result.success) {
        router.push("/login");
        router.refresh();
      }
    });
  };

  return (
    <header className="h-[56px] border-b border-border-default bg-surface flex items-center justify-between px-6 z-30 shrink-0">
      {/* Search Input */}
      <div className="w-[320px] relative hidden sm:block">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
          search
        </span>
        <input
          type="text"
          placeholder="Buscar leads por nombre..."
          className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-1.5 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all duration-200"
        />
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="flex items-center gap-3">
          {/* User Info */}
          <div className="text-right">
            <p className="font-body-sm text-[13px] font-medium text-text-primary leading-none mb-1">
              {profile.full_name}
            </p>
            <span
              className={`inline-block font-label-xs text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
                profile.role === "admin"
                  ? "bg-primary-container/20 text-primary border border-primary/20"
                  : "bg-surface-container-highest text-text-secondary border border-border-strong"
              }`}
            >
              {profile.role === "admin" ? "Administrador" : "Comercial"}
            </span>
          </div>

          {/* User Avatar */}
          <div className="w-9 h-9 rounded-full bg-border-strong flex items-center justify-center text-text-primary font-medium text-sm border border-border-default select-none">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="text-text-secondary hover:text-danger hover:bg-error-container/10 p-2 rounded-lg transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          title="Cerrar sesión"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isPending ? "animate-spin" : ""
            }`}
          >
            {isPending ? "sync" : "logout"}
          </span>
        </button>
      </div>
    </header>
  );
}
