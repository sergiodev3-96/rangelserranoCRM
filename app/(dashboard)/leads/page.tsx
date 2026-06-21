import { getCurrentProfile } from "@/lib/actions/auth";

export default async function LeadsPage() {
  const result = await getCurrentProfile();
  const profile = result.data;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
          Pipeline de Leads
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Panel de gestión comercial y seguimiento de solicitudes de financiación
        </p>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-border-default max-w-2xl glow-effect space-y-4">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-success text-[24px]">
            verified_user
          </span>
          <h2 className="font-section-subtitle text-[17px] text-text-primary">
            ¡Autenticación de Fase 1 Verificada!
          </h2>
        </div>

        <p className="font-body-sm text-[13px] text-text-secondary leading-relaxed">
          Has iniciado sesión correctamente. Este panel está protegido mediante
          middleware de Next.js y requiere un perfil de usuario activo con rol de{" "}
          <strong>
            {profile?.role === "admin" ? "Administrador" : "Comercial"}
          </strong>
          .
        </p>

        <div className="bg-surface-container border border-border-subtle rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Usuario actual:</span>
            <span className="text-text-primary font-medium">
              {profile?.full_name}
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Email:</span>
            <span className="text-text-primary font-medium">
              {profile?.email}
            </span>
          </div>
          <div className="flex justify-between text-[13px]">
            <span className="text-text-secondary">Rol asignado:</span>
            <span className="text-text-primary font-medium capitalize">
              {profile?.role}
            </span>
          </div>
        </div>

        <div className="text-[11px] font-label-xs text-text-disabled uppercase tracking-widest pt-2">
          Listo para Fase 2 — Base de datos y Pipeline Kanban de Leads
        </div>
      </div>
    </div>
  );
}
