import React from "react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="font-section-title text-[22px] font-bold text-text-primary">
          Centro de Ayuda y Soporte
        </h1>
        <p className="font-body-sm text-[13px] text-text-secondary mt-1">
          Guía de uso, canales de asistencia e información del sistema Rangel &amp; Serrano CRM.
        </p>
      </div>

      {/* Tarjeta de soporte directo */}
      <div className="bg-surface border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="font-section-subtitle text-[16px] font-semibold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">contact_support</span>
          Asistencia Técnica
        </h2>
        <p className="text-[13px] text-text-secondary">
          Si experimentas incidencias técnicas, lentitud o necesitas soporte con alguna operación, puedes comunicarte directamente con el equipo de soporte.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">mail</span>
            <div>
              <span className="text-text-secondary text-[12px] font-medium block">Correo de Soporte</span>
              <span className="text-text-primary font-bold text-[14px]">soporte@rangelserrano.com</span>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-lg border border-border-default/60 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[22px] mt-0.5">phone_in_talk</span>
            <div>
              <span className="text-text-secondary text-[12px] font-medium block">Horario de Atención</span>
              <span className="text-text-primary font-bold text-[14px]">Lunes a Viernes, 9:00 - 19:00</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preguntas frecuentes / Atajos */}
      <div className="bg-surface border border-border-default rounded-xl p-6 space-y-4">
        <h2 className="font-section-subtitle text-[16px] font-semibold text-text-primary flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">help_outline</span>
          Preguntas Frecuentes y Consejos
        </h2>
        <div className="space-y-3 pt-1 text-[13px]">
          <div className="p-3 bg-surface-container-low rounded-lg border border-border-default/60">
            <h3 className="font-semibold text-text-primary mb-1">¿Cómo reasignar un lead rápidamente?</h3>
            <p className="text-text-secondary">
              Los administradores disponen de un panel superior en la sección de <Link href="/leads" className="text-primary hover:underline font-medium">Leads</Link> para asignar los leads pendientes con un solo clic.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg border border-border-default/60">
            <h3 className="font-semibold text-text-primary mb-1">¿Cómo organizar las tareas del día?</h3>
            <p className="text-text-secondary">
              En la sección de <Link href="/tareas" className="text-primary hover:underline font-medium">Tareas</Link>, puedes alternar entre vista lista y tablero Kanban, o usar los botones de acceso rápido para ver solo las tareas de hoy o vencidas.
            </p>
          </div>
          <div className="p-3 bg-surface-container-low rounded-lg border border-border-default/60">
            <h3 className="font-semibold text-text-primary mb-1">¿Cómo generar una simulación financiera?</h3>
            <p className="text-text-secondary">
              Accede a <Link href="/simulaciones" className="text-primary hover:underline font-medium">Simulaciones</Link> para calcular cuotas, aplicar tipos de interés por entidad y exportar el informe para el cliente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
