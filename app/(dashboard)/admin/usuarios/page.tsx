import React from "react";

export default function UsuariosPlaceholderPage() {
  return (
    <div className="p-6 space-y-6 text-left">
      <div>
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
          Administración de Usuarios
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Alta, baja, control de accesos e invitación de comerciales al CRM
        </p>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-border-default max-w-2xl glow-effect space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[24px]">
            manage_accounts
          </span>
          <h2 className="font-section-subtitle text-[17px] text-text-primary">
            Habilitado en la Fase 5
          </h2>
        </div>
        <p className="font-body-sm text-[13px] text-text-secondary leading-relaxed">
          El panel exclusivo para administradores, que permite invitar nuevos
          comerciales, desactivar cuentas y redefinir roles, se integrará en la
          **Fase 5** del plan de implementación.
        </p>
      </div>
    </div>
  );
}
