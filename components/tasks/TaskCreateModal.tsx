"use client";

import React, { useState, useTransition, useEffect } from "react";
import Modal from "../ui/Modal";
import { createTask } from "@/lib/actions/tasks";
import { getActiveComerciales } from "@/lib/actions/users";
import { getLeads } from "@/lib/actions/leads";
import type { ProfileSummary } from "@/types/profiles";
import type { TaskStatus, TaskPriority } from "@/types/tasks";

type TaskCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string | null;
  initialStatus?: TaskStatus;
  currentUserId: string;
};

export default function TaskCreateModal({
  isOpen,
  onClose,
  onSuccess,
  initialLeadId = null,
  initialStatus = "pendiente",
  currentUserId,
}: TaskCreateModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [leadId, setLeadId] = useState("");
  const [assignedTo, setAssignedTo] = useState(currentUserId);
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>("media");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const [comerciales, setComerciales] = useState<ProfileSummary[]>([]);
  const [leads, setLeads] = useState<{ id: string; full_name: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        // Load active profiles
        const profilesRes = await getActiveComerciales();
        if (profilesRes.success && profilesRes.data) {
          setComerciales(profilesRes.data);
        }

        // Load active leads for the selector
        const leadsRes = await getLeads({ pageSize: 150 });
        if (leadsRes.success && leadsRes.data) {
          setLeads(
            leadsRes.data.leads.map((l) => ({
              id: l.id,
              full_name: l.full_name,
            }))
          );
        }
      };

      loadData();

      // Reset form fields
      setTitle("");
      setDescription("");
      setLeadId(initialLeadId || "");
      setAssignedTo(currentUserId);
      setStatus(initialStatus);
      setPriority("media");
      setDueDate("");
      setDueTime("");
      setErrorMessage(null);
    }
  }, [isOpen, initialLeadId, initialStatus, currentUserId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 3) {
      setErrorMessage("El título debe tener al menos 3 caracteres.");
      return;
    }

    if (!assignedTo) {
      setErrorMessage("Debe asignar la tarea a un comercial.");
      return;
    }

    startTransition(async () => {
      const result = await createTask({
        title: title.trim(),
        description: description.trim() || "",
        lead_id: leadId || null,
        assigned_to: assignedTo,
        status,
        priority,
        due_date: dueDate || null,
        due_time: dueTime || null,
      });

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(result.error || "Ocurrió un error al crear la tarea.");
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nueva Tarea">
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {errorMessage && (
          <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
            {errorMessage}
          </div>
        )}

        {/* Título */}
        <div className="space-y-1">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block">
            Título de la Tarea *
          </label>
          <input
            type="text"
            required
            placeholder="Llamar para verificar nómina"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary"
            disabled={isPending}
          />
        </div>

        {/* Descripción */}
        <div className="space-y-1">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block">
            Descripción
          </label>
          <textarea
            placeholder="Detalles sobre la tarea..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary resize-none"
            disabled={isPending}
          />
        </div>

        {/* Lead Asociado */}
        <div className="space-y-1">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block">
            Vincular a Lead
          </label>
          <select
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
            disabled={isPending}
          >
            <option value="">Ninguno</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Asignación */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Comercial Asignado
            </label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              disabled={isPending}
            >
              {comerciales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Prioridad */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Prioridad
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              disabled={isPending}
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Fecha Limite */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Fecha Vencimiento
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              disabled={isPending}
            />
          </div>

          {/* Hora Limite */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Hora Vencimiento
            </label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
              disabled={isPending}
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
            disabled={isPending}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-on-primary hover:shadow-[0_0_10px_rgba(108,99,255,0.3)] rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            disabled={isPending}
          >
            {isPending ? (
              <>
                <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">save</span>
                Guardar Tarea
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
