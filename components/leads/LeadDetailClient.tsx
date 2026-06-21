"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeadWithAssignee } from "@/types/leads";
import type { ProfileSummary } from "@/types/profiles";
import type { LeadEventWithAuthor } from "@/types/lead-events";
import type { TaskWithDetails } from "@/types/tasks";
import type { Simulation } from "@/types/simulations";
import LeadDetailHeader from "./LeadDetailHeader";
import LeadNoteInput from "./LeadNoteInput";
import LeadTimeline from "./LeadTimeline";
import TaskCreateModal from "../tasks/TaskCreateModal";
import WhatsAppTemplatesModal from "./WhatsAppTemplatesModal";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { deleteSimulation } from "@/lib/actions/simulations";

type LeadDetailClientProps = {
  lead: LeadWithAssignee;
  currentUser: { id: string; role: "admin" | "comercial" };
  comerciales: ProfileSummary[];
  events: LeadEventWithAuthor[];
  tasks: TaskWithDetails[];
  simulations: Simulation[];
};

export default function LeadDetailClient({
  lead,
  currentUser,
  comerciales,
  events,
  tasks,
  simulations,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  const handleRefresh = () => {
    router.refresh();
  };

  const isAdmin = currentUser.role === "admin";
  const isAssigned = lead.assigned_to === currentUser.id;
  const canEdit = isAdmin || isAssigned;

  const formattedSource = lead.source
    ? lead.source.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Manual";

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("es-ES", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (task: TaskWithDetails) => {
    if (!task.due_date || task.status === "completada") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const handleToggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "completada" ? "pendiente" : "completada";
    startTransition(async () => {
      const result = await updateTaskStatus({ task_id: taskId, status: nextStatus });
      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "No se pudo actualizar la tarea.");
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;
    startTransition(async () => {
      const result = await deleteTask(taskId);
      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "No se pudo eliminar la tarea.");
      }
    });
  };

  const handleDeleteSimulation = (simId: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta simulación?")) return;
    startTransition(async () => {
      const result = await deleteSimulation(simId);
      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "No se pudo eliminar la simulación.");
      }
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-bg-base text-left">
      {/* Detail Header */}
      <LeadDetailHeader
        lead={lead}
        currentUser={currentUser}
        comerciales={comerciales}
        onRefresh={handleRefresh}
      />

      {/* Main Grid Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Contact and Lead Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Card: Información de Contacto */}
            <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
              <h2 className="font-section-subtitle text-[17px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  contact_phone
                </span>
                Información de Contacto
              </h2>

              <div className="space-y-3.5">
                {/* Teléfono */}
                <div className="space-y-1">
                  <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                    Teléfono
                  </label>
                  {lead.phone ? (
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-body-md text-[14px] text-text-primary hover:text-primary transition-colors hover:underline font-semibold"
                      >
                        {lead.phone}
                      </a>
                      <div className="flex gap-2 shrink-0">
                        <a
                          href={`tel:${lead.phone}`}
                          className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20"
                          title="Llamar"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            call
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsWhatsAppModalOpen(true)}
                          disabled={!canEdit}
                          className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-success/20 hover:text-success transition-all flex items-center justify-center border border-border-default hover:border-success/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enviar WhatsApp"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            chat
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[13px] text-text-disabled italic">
                      No registrado
                    </span>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                    Correo Electrónico
                  </label>
                  {lead.email ? (
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <a
                        href={`mailto:${lead.email}`}
                        className="font-body-md text-[14px] text-text-primary hover:text-primary transition-colors hover:underline truncate"
                      >
                        {lead.email}
                      </a>
                      <a
                        href={`mailto:${lead.email}`}
                        className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20 shrink-0"
                        title="Enviar Correo"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          mail
                        </span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-[13px] text-text-disabled italic">
                      No registrado
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Detalles del Lead */}
            <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
              <h2 className="font-section-subtitle text-[17px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  info
                </span>
                Detalles del Lead
              </h2>

              <div className="space-y-3">
                {/* Origen */}
                <div>
                  <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                    Origen (Canal)
                  </label>
                  <span className="font-body-md text-[13px] text-text-primary font-medium mt-0.5 block">
                    {formattedSource}
                  </span>
                </div>

                {/* Campaña */}
                {lead.campaign_name && (
                  <div>
                    <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                      Campaña
                    </label>
                    <span className="font-body-md text-[13px] text-primary font-medium mt-0.5 block">
                      {lead.campaign_name}
                    </span>
                  </div>
                )}

                {/* Interés Vehículo */}
                <div>
                  <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                    Vehículo de Interés
                  </label>
                  <span className="font-body-md text-[13px] text-text-primary font-medium mt-0.5 block">
                    {lead.vehicle_interest || (
                      <span className="text-text-disabled font-normal">No especificado</span>
                    )}
                  </span>
                </div>

                {/* Fechas */}
                <div className="pt-2 border-t border-border-default/40 space-y-2 select-none">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-secondary">Creado el</span>
                    <span className="text-text-primary font-medium">
                      {formatDate(lead.created_at)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-text-secondary">Actualizado el</span>
                    <span className="text-text-primary font-medium">
                      {formatDate(lead.updated_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Notes, Tasks, Simulations, Timeline */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Note Input Panel */}
            {canEdit && (
              <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
                <h2 className="font-section-subtitle text-[17px] text-text-primary flex items-center gap-2 select-none">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    edit_note
                  </span>
                  Registrar Seguimiento
                </h2>
                <LeadNoteInput leadId={lead.id} onSuccess={handleRefresh} />
              </div>
            )}

            {/* Tasks Panel */}
            <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
              <div className="flex justify-between items-center border-b border-border-default pb-3 select-none">
                <h2 className="font-section-subtitle text-[17px] text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    check_box
                  </span>
                  Tareas de Seguimiento
                </h2>
                {canEdit && (
                  <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="text-primary hover:text-text-primary text-[12px] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Añadir Tarea
                  </button>
                )}
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {tasks.map((task) => {
                  const overdue = isOverdue(task);
                  const isCompleted = task.status === "completada";

                  return (
                    <div
                      key={task.id}
                      className={`flex items-start justify-between p-3 rounded-lg bg-surface border hover:bg-surface-container-high/30 transition-colors ${
                        overdue ? "border-danger/20" : "border-border-default"
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Status Checkbox */}
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.status)}
                          disabled={!canEdit || isPending}
                          className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                            isCompleted
                              ? "bg-success border-success text-inverse-on-surface"
                              : overdue
                              ? "border-danger/60 hover:bg-danger/10"
                              : "border-border-strong hover:border-primary"
                          }`}
                        >
                          {isCompleted && (
                            <span className="material-symbols-outlined text-[14px] font-bold">
                              check
                            </span>
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-[13px] font-medium text-text-primary leading-tight truncate ${
                              isCompleted ? "line-through text-text-disabled" : ""
                            }`}
                          >
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-[11px] text-text-secondary mt-0.5 truncate">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {/* Priority Badge */}
                            <span
                              className={`text-[9px] font-semibold uppercase px-1.5 py-0.25 rounded border select-none ${
                                task.priority === "alta"
                                  ? "bg-error-container/20 text-danger border-danger/25"
                                  : task.priority === "media"
                                  ? "bg-warning/10 text-warning border-warning/20"
                                  : "bg-surface-container-high text-text-secondary border-border-strong"
                              }`}
                            >
                              {task.priority}
                            </span>

                            {/* Due date */}
                            {task.due_date && (
                              <span
                                className={`text-[10px] font-medium inline-flex items-center gap-1 select-none ${
                                  overdue ? "text-danger" : "text-text-secondary"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {overdue ? "Vencida (" : ""}
                                {new Date(task.due_date).toLocaleDateString("es-ES", {
                                  day: "2-digit",
                                  month: "short",
                                })}
                                {overdue ? ")" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Delete button */}
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-text-secondary hover:text-danger p-1 rounded hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
                          title="Eliminar tarea"
                        >
                          <span className="material-symbols-outlined text-[15px]">delete</span>
                        </button>
                      )}
                    </div>
                  );
                })}

                {tasks.length === 0 && (
                  <div className="text-center py-6 text-text-disabled/40 select-none">
                    <span className="material-symbols-outlined text-2xl mb-1">
                      assignment_turned_in
                    </span>
                    <p className="text-[12px]">No hay tareas creadas para este lead.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Simulations Panel */}
            <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
              <div className="flex justify-between items-center border-b border-border-default pb-3 select-none">
                <h2 className="font-section-subtitle text-[17px] text-text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    calculate
                  </span>
                  Historial de Simulaciones
                </h2>
                {canEdit && (
                  <Link
                    href={`/simulaciones?leadId=${lead.id}`}
                    className="text-primary hover:text-text-primary text-[12px] font-semibold flex items-center gap-1 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                    Nueva Simulación
                  </Link>
                )}
              </div>

              {/* Simulations List */}
              <div className="space-y-2">
                {simulations.map((sim) => (
                  <div
                    key={sim.id}
                    className="p-3.5 rounded-lg bg-surface border border-border-default flex items-center justify-between"
                  >
                    <div className="space-y-1.5 flex-1 text-left select-none">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-data-mono text-[16px] font-bold text-text-primary">
                          {sim.monthly_payment.toLocaleString("es-ES", {
                            style: "currency",
                            currency: "EUR",
                          })}
                          <span className="text-[11px] text-text-secondary font-body-base font-normal">/mes</span>
                        </span>
                        <span className="text-[11px] text-text-secondary px-2 py-0.5 bg-surface-container-high rounded-full font-semibold">
                          {sim.term_months} Meses ({sim.term_months / 12} Años)
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[11px] text-text-secondary flex-wrap">
                        <span>Vehículo: <strong className="text-text-primary">{sim.vehicle_price.toLocaleString()} €</strong></span>
                        <span>Financiado: <strong className="text-text-primary">{sim.financed_capital.toLocaleString()} €</strong></span>
                        <span>Banco: <strong className="text-text-primary">{sim.entity_name}</strong></span>
                        <span>TIN: <strong className="text-text-primary">{sim.tin_rate}%</strong></span>
                      </div>
                    </div>

                    {/* Delete button */}
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteSimulation(sim.id)}
                        className="text-text-secondary hover:text-danger p-1 rounded hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer"
                        title="Eliminar simulación"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    )}
                  </div>
                ))}

                {simulations.length === 0 && (
                  <div className="text-center py-6 text-text-disabled/40 select-none">
                    <span className="material-symbols-outlined text-2xl mb-1">
                      calculate
                    </span>
                    <p className="text-[12px]">No hay simulaciones guardadas para este lead.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Panel */}
            <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
              <h2 className="font-section-subtitle text-[17px] text-text-primary flex items-center gap-2 border-b border-border-default pb-3 select-none">
                <span className="material-symbols-outlined text-primary text-[20px]">
                  history
                </span>
                Historial de Eventos
              </h2>
              <div className="max-h-[600px] overflow-y-auto pr-2">
                <LeadTimeline events={events} />
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Task Creation Modal */}
      {canEdit && (
        <TaskCreateModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSuccess={handleRefresh}
          initialLeadId={lead.id}
          currentUserId={currentUser.id}
        />
      )}

      {/* WhatsApp Templates Modal */}
      {canEdit && (
        <WhatsAppTemplatesModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          onSuccess={handleRefresh}
          leadId={lead.id}
          leadName={lead.full_name}
          leadVehicle={lead.vehicle_interest}
        />
      )}
    </div>
  );
}
