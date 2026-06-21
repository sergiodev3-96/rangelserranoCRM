"use client";

import React, { useState, useTransition, useEffect } from "react";
import Modal from "../ui/Modal";
import { createLead } from "@/lib/actions/leads";
import { getActiveComerciales } from "@/lib/actions/users";
import type { ProfileSummary } from "@/types/profiles";

type LeadCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function LeadCreateModal({
  isOpen,
  onClose,
  onSuccess,
}: LeadCreateModalProps) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [vehicleInterest, setVehicleInterest] = useState("");
  const [source, setSource] = useState<"manual" | "referral">("manual");
  const [assignedTo, setAssignedTo] = useState("");
  const [comerciales, setComerciales] = useState<ProfileSummary[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOpen) {
      const loadComerciales = async () => {
        const result = await getActiveComerciales();
        if (result.success && result.data) {
          setComerciales(result.data);
        }
      };
      loadComerciales();

      setFullName("");
      setPhone("");
      setEmail("");
      setVehicleInterest("");
      setSource("manual");
      setAssignedTo("");
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (fullName.trim().length < 3) {
      setErrorMessage("El nombre debe tener al menos 3 caracteres.");
      return;
    }

    startTransition(async () => {
      const result = await createLead({
        full_name: fullName,
        phone: phone || "",
        email: email || "",
        source: source,
        campaign_name: "",
        vehicle_interest: vehicleInterest || "",
        assigned_to: assignedTo || null,
      });

      if (!result.success) {
        setErrorMessage(result.error || "Ocurrió un error al crear el lead.");
      } else {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Crear Nuevo Lead Manual">
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 text-left font-body-sm text-[13px]">
            {errorMessage}
          </div>
        )}

        {/* Nombre completo */}
        <div className="space-y-1">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block">
            Nombre Completo *
          </label>
          <input
            type="text"
            required
            placeholder="Juan Pérez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isPending}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Teléfono */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Teléfono
            </label>
            <input
              type="text"
              placeholder="+34 600 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isPending}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Correo Electrónico
            </label>
            <input
              type="email"
              placeholder="juan@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Vehículo de interés */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Vehículo de Interés
            </label>
            <input
              type="text"
              placeholder="Audi A4 2024"
              value={vehicleInterest}
              onChange={(e) => setVehicleInterest(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isPending}
            />
          </div>

          {/* Origen del lead */}
          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Canal de Origen
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as any)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              disabled={isPending}
            >
              <option value="manual">Manual / Teléfono</option>
              <option value="referral">Recomendado</option>
            </select>
          </div>
        </div>

        {/* Asignación */}
        <div className="space-y-1">
          <label className="font-field-label text-[11px] text-text-secondary uppercase block">
            Asignar Comercial
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={isPending}
          >
            <option value="">Dejar sin asignar</option>
            {comerciales.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name} ({c.role === "admin" ? "Admin" : "Comercial"})
              </option>
            ))}
          </select>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-default">
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
                <span className="material-symbols-outlined animate-spin text-[16px]">
                  sync
                </span>
                Guardando...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">
                  save
                </span>
                Guardar Lead
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
