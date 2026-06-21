import React from "react";

export default function PedidosPlaceholderPage() {
  return (
    <div className="p-6 space-y-6 text-left">
      <div>
        <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
          Pedidos Finalizados
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary">
          Registro histórico de contratos y operaciones cerradas
        </p>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-border-default max-w-2xl glow-effect space-y-3">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[24px]">
            inventory_2
          </span>
          <h2 className="font-section-subtitle text-[17px] text-text-primary">
            Habilitado en la Fase 4
          </h2>
        </div>
        <p className="font-body-sm text-[13px] text-text-secondary leading-relaxed">
          El listado, exportación en formato CSV e historial de pedidos cerrados
          y evaluados por banco se integrará en la **Fase 4** del plan de
          implementación.
        </p>
      </div>
    </div>
  );
}
