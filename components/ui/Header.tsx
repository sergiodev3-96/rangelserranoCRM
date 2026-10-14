"use client";

import { useTransition } from "react";
import { useRouter, usePathname } from "next/navigation";
import { logout } from "@/lib/actions/auth";
import ThemeToggle from "./ThemeToggle";
import type { Profile } from "@/types/profiles";

type HeaderProps = {
  profile: Profile;
  onToggleSidebar?: () => void;
};

function getPageHeaderInfo(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith("/leads/") && pathname !== "/leads") {
    return {
      title: "Ficha del Lead",
      subtitle: "Detalle y seguimiento integral del cliente",
    };
  }
  if (pathname.startsWith("/leads")) {
    return {
      title: "Pipeline de Leads",
      subtitle: "Gestiona y asigna las solicitudes entrantes y realiza simulaciones de financiación",
    };
  }
  if (pathname.startsWith("/tareas")) {
    return {
      title: "Listado de Tareas",
      subtitle: "Tareas comerciales ordenadas por fecha de vencimiento",
    };
  }
  if (pathname.startsWith("/simulaciones")) {
    return {
      title: "Simulador de Financiación",
      subtitle: "Calcula y personaliza las cuotas mensuales de los clientes",
    };
  }
  if (pathname.startsWith("/pedidos")) {
    return {
      title: "Gestión de Pedidos",
      subtitle: "Seguimiento de operaciones y pedidos formalizados",
    };
  }
  if (pathname.startsWith("/admin/usuarios")) {
    return {
      title: "Gestión de Usuarios",
      subtitle: "Administración de accesos y roles del equipo comercial",
    };
  }
  if (pathname.startsWith("/admin/plantillas-whatsapp")) {
    return {
      title: "Plantillas de WhatsApp",
      subtitle: "Mensajes rápidos preconfigurados para comunicación comercial",
    };
  }
  if (pathname.startsWith("/admin/entidades-financieras")) {
    return {
      title: "Entidades Financieras",
      subtitle: "Configuración de bancos y tipos de interés",
    };
  }
  return {
    title: "Panel de Control",
    subtitle: "Rangel Serrano CRM",
  };
}

export default function Header({ profile, onToggleSidebar }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const { title, subtitle } = getPageHeaderInfo(pathname);

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
    <header className="h-[60px] border-b border-border-default bg-surface flex items-center justify-between px-6 z-30 shrink-0">
      {/* Page Title & Subtitle (replaces search input) */}
      <div className="flex items-center gap-3 min-w-0 mr-4">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-container transition-colors cursor-pointer shrink-0"
            aria-label="Abrir menú"
          >
            <span className="material-symbols-outlined text-[24px]">menu</span>
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-headline-lg text-[18px] sm:text-[20px] font-bold text-primary tracking-tight leading-tight truncate">
            {title}
          </h1>
          <p className="font-body-sm text-[12px] text-text-secondary truncate hidden sm:block">
            {subtitle}
          </p>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 sm:gap-3 ml-auto">
        {/* Theme Switcher */}
        <ThemeToggle />

        <div className="h-5 w-[1px] bg-border-default hidden sm:block mx-0.5" />

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
              /* eslint-disable-next-line @next/next/no-img-element */
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
