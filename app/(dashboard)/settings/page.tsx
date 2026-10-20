import React from "react";
import { getCurrentProfile } from "@/lib/actions/auth";
import ThemeToggle from "@/components/ui/ThemeToggle";
import Link from "next/link";

export default async function SettingsPage() {
  const profileRes = await getCurrentProfile();
  const profile = profileRes.success ? profileRes.data : null;

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-section-title text-[22px] font-bold text-text-primary">
          Configuración
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary mt-1">
          Ajustes de la cuenta, preferencias de visualización e información del sistema.
        </p>
      </div>

      {/* Perfil del usuario */}
      <div className="bg-surface border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="font-section-subtitle text-[16px] font-semibold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">person</span>
          Perfil de Usuario
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60">
            <span className="text-text-secondary text-[12px] font-medium block">Nombre</span>
            <span className="text-text-primary font-bold text-[15px]">{profile?.full_name || "—"}</span>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60">
            <span className="text-text-secondary text-[12px] font-medium block">Correo Electrónico</span>
            <span className="text-text-primary font-bold text-[15px]">{profile?.email || "—"}</span>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60">
            <span className="text-text-secondary text-[12px] font-medium block">Rol</span>
            <span className="text-text-primary font-bold text-[15px] capitalize">{profile?.role || "—"}</span>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60">
            <span className="text-text-secondary text-[12px] font-medium block">Estado de la cuenta</span>
            <span className={`inline-flex items-center gap-1.5 font-bold text-[14px] ${profile?.active ? "text-success" : "text-danger"}`}>
              <span className={`w-2 h-2 rounded-full ${profile?.active ? "bg-success" : "bg-danger"}`} />
              {profile?.active ? "Activo" : "Inactivo"}
            </span>
          </div>
        </div>
      </div>

      {/* Preferencias de interfaz */}
      <div className="bg-surface border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="font-section-subtitle text-[16px] font-semibold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">palette</span>
          Apariencia y Visualización
        </h2>
        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-lg border border-border-default/60">
          <div>
            <span className="text-text-primary font-medium text-[14px] block">Tema de la Interfaz</span>
            <span className="text-text-secondary text-[12px]">Alternar entre modo claro y modo oscuro</span>
          </div>
          <ThemeToggle showLabel className="bg-surface border border-border-default" />
        </div>
      </div>

      {/* Accesos rápidos de administración si es Admin */}
      {profile?.role === "admin" && (
        <div className="bg-surface border border-border-default rounded-xl p-6 space-y-4">
          <h2 className="font-section-subtitle text-[16px] font-semibold text-text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">admin_panel_settings</span>
            Administración Avanzada
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <Link
              href="/admin/usuarios"
              className="p-3 bg-surface-container-low hover:bg-surface-container border border-border-default/60 rounded-lg flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">manage_accounts</span>
              <div>
                <span className="font-medium text-[13px] text-text-primary block">Gestión de Usuarios</span>
                <span className="text-[11px] text-text-secondary">Crear y administrar comerciales</span>
              </div>
            </Link>
            <Link
              href="/admin/plantillas"
              className="p-3 bg-surface-container-low hover:bg-surface-container border border-border-default/60 rounded-lg flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">chat</span>
              <div>
                <span className="font-medium text-[13px] text-text-primary block">Plantillas de WhatsApp</span>
                <span className="text-[11px] text-text-secondary">Mensajes predefinidos para leads</span>
              </div>
            </Link>
            <Link
              href="/admin/plantillas-documentos"
              className="p-3 bg-surface-container-low hover:bg-surface-container border border-border-default/60 rounded-lg flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">article</span>
              <div>
                <span className="font-medium text-[13px] text-text-primary block">Plantillas de Documentos</span>
                <span className="text-[11px] text-text-secondary">Contratos y anexos imprimibles</span>
              </div>
            </Link>
            <Link
              href="/admin/entidades-financieras"
              className="p-3 bg-surface-container-low hover:bg-surface-container border border-border-default/60 rounded-lg flex items-center gap-3 transition-colors"
            >
              <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
              <div>
                <span className="font-medium text-[13px] text-text-primary block">Entidades Financieras</span>
                <span className="text-[11px] text-text-secondary">Bancos y tipos de interés</span>
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
