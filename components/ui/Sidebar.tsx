"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type SidebarProps = {
  isAdmin: boolean;
};

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/leads", label: "Leads", icon: "person_search" },
    { href: "/tareas", label: "Tareas", icon: "assignment_turned_in" },
    { href: "/simulaciones", label: "Simulaciones", icon: "calculate" },
    { href: "/pedidos", label: "Pedidos Finalizados", icon: "inventory_2" },
  ];

  if (isAdmin) {
    navItems.push({
      href: "/admin/usuarios",
      label: "Usuarios",
      icon: "manage_accounts",
    });
  }

  return (
    <aside className="hidden md:flex flex-col h-screen sticky top-0 left-0 border-r border-border-default bg-surface w-[240px] shrink-0 z-50">
      {/* Brand */}
      <div className="h-[56px] flex items-center px-4 border-b border-border-default bg-surface-container">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-on-primary-container text-sm fill">
              directions_car
            </span>
          </div>
          <div>
            <h1 className="font-display-welcome text-[14px] text-primary tracking-tight leading-none">
              Rangel &amp; Serrano CRM
            </h1>
            <span className="font-label-xs text-text-secondary leading-none text-[10px]">
              Automotive Financing
            </span>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="p-4">
        <Link
          href="/simulaciones"
          className="w-full bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nueva Simulación
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer font-body-sm text-[13px] ${
                isActive ? "active" : ""
              }`}
            >
              <span className="material-symbols-outlined nav-icon text-[20px]">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-border-default p-3 space-y-1 bg-surface-container">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">
            settings
          </span>
          <span className="font-body-sm text-[13px]">Configuración</span>
        </Link>
        <Link
          href="/support"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className="font-body-sm text-[13px]">Ayuda</span>
        </Link>
      </div>
    </aside>
  );
}
