"use client";

import React, { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { LeadWithAssignee } from "@/types/leads";
import type { ProfileSummary } from "@/types/profiles";
import type { LeadEventWithAuthor } from "@/types/lead-events";
import type { TaskWithDetails } from "@/types/tasks";
import type { Simulation } from "@/types/simulations";
import LeadDetailHeader from "./LeadDetailHeader";
import LeadTimeline from "./LeadTimeline";
import TaskCreateModal from "../tasks/TaskCreateModal";
import WhatsAppTemplatesModal from "./WhatsAppTemplatesModal";
import LeadStatusSelector from "./LeadStatusSelector";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import { deleteSimulation } from "@/lib/actions/simulations";
import {
  updateLeadOperationDetails,
  getUploadUrl,
  getDownloadUrl,
  deleteLeadDocument,
  listLeadDocuments,
} from "@/lib/actions/leads";
import LeadDocumentsTab from "./LeadDocumentsTab";

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

  const [activeTab, setActiveTab] = useState<"cliente" | "pedido" | "presupuesto">("cliente");

  // Fields for operation details
  const [fullName, setFullName] = useState(lead.full_name || "");
  const [firstSurname, setFirstSurname] = useState(lead.first_surname || "");
  const [secondSurname, setSecondSurname] = useState(lead.second_surname || "");
  const [dniNie, setDniNie] = useState(lead.dni_nie || "");
  const [nationality, setNationality] = useState(lead.nationality || "");
  const [birthCountry, setBirthCountry] = useState(lead.birth_country || "");
  const [vehicleBrand, setVehicleBrand] = useState(lead.vehicle_brand || "");
  const [vehicleModel, setVehicleModel] = useState(lead.vehicle_model || "");
  const [vehicleYear, setVehicleYear] = useState(lead.vehicle_year?.toString() || "");
  const [vehiclePlate, setVehiclePlate] = useState(lead.vehicle_plate || "");
  const [vehicleVin, setVehicleVin] = useState(lead.vehicle_vin || "");
  const [vehiclePrice, setVehiclePrice] = useState(lead.vehicle_price?.toString() || "");
  const [downPayment, setDownPayment] = useState(lead.down_payment?.toString() || "");
  const [isSavingOps, setIsSavingOps] = useState(false);

  // States for documentation
  const [documents, setDocuments] = useState<
    Record<string, { name: string; size: number; path: string; created_at: string }[]>
  >({});
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<{ path: string; name: string; url: string } | null>(null);

  // Synchronization with lead prop updates
  useEffect(() => {
    setFullName(lead.full_name || "");
    setFirstSurname(lead.first_surname || "");
    setSecondSurname(lead.second_surname || "");
    setDniNie(lead.dni_nie || "");
    setNationality(lead.nationality || "");
    setBirthCountry(lead.birth_country || "");
    setVehicleBrand(lead.vehicle_brand || "");
    setVehicleModel(lead.vehicle_model || "");
    setVehicleYear(lead.vehicle_year?.toString() || "");
    setVehiclePlate(lead.vehicle_plate || "");
    setVehicleVin(lead.vehicle_vin || "");
    setVehiclePrice(lead.vehicle_price?.toString() || "");
    setDownPayment(lead.down_payment?.toString() || "");
  }, [lead]);

  // Load documents
  const loadDocs = useCallback(async () => {
    setLoadingDocs(true);
    const res = await listLeadDocuments(lead.id);
    if (res.success && res.data) {
      setDocuments(res.data);
    } else {
      console.error("Error loading docs:", res.error);
    }
    setLoadingDocs(false);
  }, [lead.id]);

  useEffect(() => {
    if (activeTab === "pedido") {
      loadDocs();
    }
  }, [activeTab, lead.id, loadDocs]);

  const handleRefresh = () => {
    router.refresh();
    if (activeTab === "pedido") {
      loadDocs();
    }
  };

  // Helper to format bytes
  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Upload handler
  const handleFileUpload = async (category: string, file: File) => {
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf", "docx", "xlsx", "xls"];
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      alert("Formato de archivo no permitido. Formatos aceptados: imagen, pdf, docx, excel.");
      return;
    }

    setUploadingCategory(category);
    setUploadProgress(15);

    try {
      const resUrl = await getUploadUrl(lead.id, category, file.name);
      if (!resUrl.success || !resUrl.data) {
        alert(resUrl.error || "No se pudo obtener la URL de subida.");
        setUploadingCategory(null);
        return;
      }

      setUploadProgress(45);

      const response = await fetch(resUrl.data.signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error al subir el archivo al almacenamiento.");
      }

      setUploadProgress(85);
      await loadDocs();
      setUploadProgress(100);

      setTimeout(() => {
        setUploadingCategory(null);
        setUploadProgress(null);
      }, 400);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err instanceof Error ? err.message : "Error al subir archivo");
      setUploadingCategory(null);
      setUploadProgress(null);
    }
  };

  // Preview handler
  const handlePreview = async (file: { path: string; name: string }) => {
    try {
      const res = await getDownloadUrl(file.path);
      if (res.success && res.data) {
        setPreviewFile({ path: file.path, name: file.name, url: res.data });
      } else {
        alert(res.error || "No se pudo cargar la vista previa.");
      }
    } catch {
      alert("Error al cargar la vista previa.");
    }
  };

  // Download handler
  const handleDownload = async (path: string) => {
    try {
      const res = await getDownloadUrl(path);
      if (res.success && res.data) {
        window.open(res.data, "_blank");
      } else {
        alert(res.error || "No se pudo descargar el archivo.");
      }
    } catch {
      alert("Error al descargar archivo.");
    }
  };

  // Delete handler
  const handleDeleteDoc = async (path: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este documento?")) return;
    try {
      const res = await deleteLeadDocument(path);
      if (res.success) {
        await loadDocs();
      } else {
        alert(res.error || "No se pudo eliminar el documento.");
      }
    } catch {
      alert("Error al eliminar documento.");
    }
  };

  // Save operation details handler
  const handleSaveOps = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOps(true);
    try {
      const parsedYear = vehicleYear ? parseInt(vehicleYear, 10) : null;
      const parsedPrice = vehiclePrice ? parseFloat(vehiclePrice) : null;
      const parsedDownPayment = downPayment ? parseFloat(downPayment) : null;

      const res = await updateLeadOperationDetails(lead.id, {
        full_name: fullName || null,
        first_surname: firstSurname || null,
        second_surname: secondSurname || null,
        dni_nie: dniNie || null,
        nationality: nationality || null,
        birth_country: birthCountry || null,
        vehicle_brand: vehicleBrand || null,
        vehicle_model: vehicleModel || null,
        vehicle_year: parsedYear,
        vehicle_plate: vehiclePlate || null,
        vehicle_vin: vehicleVin || null,
        vehicle_price: parsedPrice,
        down_payment: parsedDownPayment,
      });

      if (res.success) {
        alert("Datos de operación actualizados correctamente.");
        handleRefresh();
      } else {
        alert(res.error || "Error al actualizar los datos.");
      }
    } catch {
      alert("Ocurrió un error inesperado al guardar los datos.");
    } finally {
      setIsSavingOps(false);
    }
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
    <div className="flex-1 flex flex-col md:h-full md:overflow-hidden bg-bg-base text-left print:h-auto print:overflow-visible print:bg-white">
      {/* Detail Header */}
      <div className="no-print">
        <LeadDetailHeader
          lead={lead}
          currentUser={currentUser}
          comerciales={comerciales}
          onRefresh={handleRefresh}
        />
      </div>

      {/* Tab Selector */}
      <div className="no-print flex border-b border-border-default px-6 bg-surface select-none shrink-0 gap-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab("cliente")}
          className={`py-3.5 px-2 font-body-md text-[13px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "cliente"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Información del cliente
        </button>
        <button
          onClick={() => setActiveTab("pedido")}
          className={`py-3.5 px-2 font-body-md text-[13px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "pedido"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Información del pedido
        </button>
        <button
          onClick={() => setActiveTab("presupuesto")}
          className={`py-3.5 px-2 font-body-md text-[13px] uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "presupuesto"
              ? "border-primary text-primary"
              : "border-transparent text-text-secondary hover:text-text-primary"
          }`}
        >
          Presupuesto, contrato y garantia
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-6 print:p-0 print:overflow-visible print:h-auto">
        <div className="max-w-[1400px] mx-auto print:max-w-none print:w-full print:p-0 print:m-0">
          {activeTab === "cliente" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Contact and Lead Info */}
              <div className="lg:col-span-1 space-y-6">
                {/* Card: Información de Contacto */}
                <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
                  <h2 className="font-section-subtitle text-[18px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      contact_phone
                    </span>
                    Información de Contacto
                  </h2>

                  <div className="space-y-4">
                    {/* Teléfono */}
                    <div className="space-y-1">
                      <label className="font-field-label text-[12px] font-semibold text-text-secondary uppercase tracking-wider block">
                        Teléfono
                      </label>
                      {lead.phone ? (
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <a
                            href={`tel:${lead.phone}`}
                            className="font-body-md text-[18px] text-text-primary hover:text-primary transition-colors hover:underline font-bold tracking-wide"
                          >
                            {lead.phone}
                          </a>
                          <div className="flex gap-2.5 shrink-0">
                            <a
                              href={`tel:${lead.phone}`}
                              className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20"
                              title="Llamar"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                call
                              </span>
                            </a>
                            <button
                              type="button"
                              onClick={() => setIsWhatsAppModalOpen(true)}
                              disabled={!canEdit}
                              className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-success/20 hover:text-success transition-all flex items-center justify-center border border-border-default hover:border-success/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Enviar WhatsApp"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 448 512"
                                className="w-[22px] h-[22px] fill-[#25D366]"
                              >
                                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[14px] text-text-disabled italic">
                          No registrado
                        </span>
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                      <label className="font-field-label text-[12px] font-semibold text-text-secondary uppercase tracking-wider block">
                        Correo Electrónico
                      </label>
                      {lead.email ? (
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <a
                            href={`mailto:${lead.email}`}
                            className="font-body-md text-[15px] text-text-primary hover:text-primary transition-colors hover:underline truncate"
                          >
                            {lead.email}
                          </a>
                          <a
                            href={`mailto:${lead.email}`}
                            className="w-10 h-10 rounded-xl bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20 shrink-0"
                            title="Enviar Correo"
                          >
                            <span className="material-symbols-outlined text-[20px]">
                              mail
                            </span>
                          </a>
                        </div>
                      ) : (
                        <span className="text-[14px] text-text-disabled italic">
                          No registrado
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card: Detalles del Lead */}
                <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
                  <h2 className="font-section-subtitle text-[18px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      info
                    </span>
                    Detalles del Lead
                  </h2>

                  <div className="space-y-3.5">
                    {/* Origen */}
                    <div>
                      <label className="font-field-label text-[12px] font-semibold text-text-secondary uppercase tracking-wider block">
                        Origen (Canal)
                      </label>
                      <span className="font-body-md text-[14px] text-text-primary font-medium mt-0.5 block">
                        {formattedSource}
                      </span>
                    </div>

                    {/* Campaña */}
                    {lead.campaign_name && (
                      <div>
                        <label className="font-field-label text-[12px] font-semibold text-text-secondary uppercase tracking-wider block">
                          Campaña
                        </label>
                        <span className="font-body-md text-[14px] text-primary font-medium mt-0.5 block">
                          {lead.campaign_name}
                        </span>
                      </div>
                    )}

                    {/* Interés Vehículo */}
                    <div>
                      <label className="font-field-label text-[12px] font-semibold text-text-secondary uppercase tracking-wider block">
                        Vehículo de Interés
                      </label>
                      {lead.vehicle_interest ? (
                        <span className="font-body-md text-[16px] text-primary font-bold bg-primary/10 border border-primary/20 px-3 py-1 rounded-md inline-block mt-1">
                          {lead.vehicle_interest}
                        </span>
                      ) : (
                        <span className="text-[14px] text-text-disabled font-normal mt-0.5 block">
                          No especificado
                        </span>
                      )}
                    </div>

                    {/* Fechas */}
                    <div className="pt-2 border-t border-border-default/40 space-y-2 select-none">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-text-secondary">Creado el</span>
                        <span className="text-text-primary font-medium">
                          {formatDate(lead.created_at)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[12px]">
                        <span className="text-text-secondary">Actualizado el</span>
                        <span className="text-text-primary font-medium">
                          {formatDate(lead.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card: Estado del Lead */}
                <div className="glass-card-lead rounded-xl p-5 border border-border-default space-y-4">
                  <h2 className="font-section-subtitle text-[18px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      settings_accessibility
                    </span>
                    Estado del Lead
                  </h2>
                  <div className="pt-1">
                    <LeadStatusSelector
                      leadId={lead.id}
                      currentStatus={lead.status}
                      disabled={!canEdit}
                      onSuccess={handleRefresh}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Tasks, Simulations, Timeline */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Tasks Panel */}
                <div className="glass-card-lead rounded-xl p-6 border border-border-default space-y-4">
                  <div className="flex justify-between items-center border-b border-border-default pb-3 select-none">
                    <h2 className="font-section-subtitle text-[20px] text-text-primary flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[24px]">
                        check_box
                      </span>
                      Tareas de Seguimiento
                    </h2>
                    {canEdit && (
                      <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="text-primary hover:text-text-primary text-[14px] font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Añadir Tarea
                      </button>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const overdue = isOverdue(task);
                      const isCompleted = task.status === "completada";

                      return (
                        <div
                          key={task.id}
                          className={`flex items-start justify-between p-3.5 rounded-xl bg-surface border hover:bg-surface-container-high/30 transition-colors ${
                            overdue ? "border-danger/30" : "border-border-default"
                          }`}
                        >
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            {/* Status Checkbox */}
                            <button
                              onClick={() => handleToggleTaskStatus(task.id, task.status)}
                              disabled={!canEdit || isPending}
                              className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${
                                isCompleted
                                  ? "bg-success border-success text-inverse-on-surface"
                                  : overdue
                                  ? "border-danger/60 hover:bg-danger/10"
                                  : "border-border-strong hover:border-primary"
                              }`}
                            >
                              {isCompleted && (
                                <span className="material-symbols-outlined text-[16px] font-bold">
                                  check
                                </span>
                              )}
                            </button>

                            <div className="min-w-0 flex-1">
                              <h4
                                className={`text-[15px] font-bold text-text-primary leading-tight truncate ${
                                  isCompleted ? "line-through text-text-disabled" : ""
                                }`}
                              >
                                {task.title}
                              </h4>
                              {task.description && (
                                <p className="text-[13px] text-text-secondary mt-1">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2.5 mt-2 flex-wrap">
                                {/* Priority Badge */}
                                <span
                                  className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded-md border select-none ${
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
                                    className={`text-[13px] font-medium inline-flex items-center gap-1 select-none font-data-mono ${
                                      overdue ? "text-danger font-semibold" : "text-text-secondary"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[15px]">schedule</span>
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
                              className="text-text-secondary hover:text-danger p-1.5 rounded-lg hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer ml-2"
                              title="Eliminar tarea"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {tasks.length === 0 && (
                      <div className="text-center py-8 text-text-disabled/40 select-none">
                        <span className="material-symbols-outlined text-3xl mb-1">
                          assignment_turned_in
                        </span>
                        <p className="text-[14px]">No hay tareas creadas para este lead.</p>
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
                        className="p-3.5 rounded-lg bg-surface border border-border-default flex items-center justify-between hover:border-primary/50 transition-colors"
                      >
                        <Link
                          href={`/simulaciones?id=${sim.id}&leadId=${lead.id}`}
                          className="space-y-1.5 flex-1 text-left select-none cursor-pointer group"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-data-mono text-[16px] font-bold text-text-primary group-hover:text-primary transition-colors">
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
                        </Link>

                        {/* Delete button */}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteSimulation(sim.id)}
                            className="text-text-secondary hover:text-danger p-1 rounded hover:bg-surface-container-high transition-colors shrink-0 cursor-pointer ml-3 z-10"
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
          ) : activeTab === "pedido" ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              
              {/* Seccion 2.1: Datos Operacion */}
              <div className="glass-card-lead rounded-xl p-6 border border-border-default space-y-6 bg-surface">
                <h2 className="font-section-subtitle text-[18px] text-text-primary border-b border-border-default pb-3 flex items-center gap-2 select-none">
                  <span className="material-symbols-outlined text-primary text-[22px]">
                    assignment
                  </span>
                  Datos de la Operación
                </h2>

                <form onSubmit={handleSaveOps} className="space-y-6">
                  {/* Datos del Cliente */}
                  <div className="space-y-4">
                    <h3 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider select-none text-left">
                      Datos del Cliente
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-left">
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Nombre
                        </label>
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Primer Apellido
                        </label>
                        <input
                          type="text"
                          value={firstSurname}
                          onChange={(e) => setFirstSurname(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Segundo Apellido
                        </label>
                        <input
                          type="text"
                          value={secondSurname}
                          onChange={(e) => setSecondSurname(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          DNI / NIE
                        </label>
                        <input
                          type="text"
                          value={dniNie}
                          onChange={(e) => setDniNie(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Nacionalidad
                        </label>
                        <input
                          type="text"
                          value={nationality}
                          onChange={(e) => setNationality(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          País de Nacimiento
                        </label>
                        <input
                          type="text"
                          value={birthCountry}
                          onChange={(e) => setBirthCountry(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Datos del Vehiculo */}
                  <div className="space-y-4 pt-4 border-t border-border-default/40">
                    <h3 className="text-[12px] font-bold text-text-secondary uppercase tracking-wider select-none text-left">
                      Datos del Vehículo
                    </h3>
                    <div className="grid grid-cols-1 gap-4 text-left">
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Marca
                        </label>
                        <input
                          type="text"
                          value={vehicleBrand}
                          onChange={(e) => setVehicleBrand(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Modelo
                        </label>
                        <input
                          type="text"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Año
                        </label>
                        <input
                          type="number"
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Matrícula
                        </label>
                        <input
                          type="text"
                          value={vehiclePlate}
                          onChange={(e) => setVehiclePlate(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Número de Bastidor (VIN)
                        </label>
                        <input
                          type="text"
                          placeholder="Ej. WBA1234567890..."
                          value={vehicleVin}
                          onChange={(e) => setVehicleVin(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60 uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Precio Vehículo (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={vehiclePrice}
                          onChange={(e) => setVehiclePrice(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-field-label text-[11px] text-text-secondary uppercase tracking-wider block">
                          Entrada (€)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={downPayment}
                          onChange={(e) => setDownPayment(e.target.value)}
                          disabled={!canEdit || isSavingOps}
                          className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>

                  {canEdit && (
                    <div className="flex justify-end pt-4 border-t border-border-default/40">
                      <button
                        type="submit"
                        disabled={isSavingOps}
                        className="bg-primary text-inverse-on-surface hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] disabled:opacity-50 transition-all rounded-lg py-2 px-4 flex items-center justify-center gap-1.5 font-body-sm font-semibold text-[13px] cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        {isSavingOps ? "Guardando..." : "Guardar Datos"}
                      </button>
                    </div>
                  )}
                </form>
              </div>

              {/* Seccion 2.2: Documentacion */}
              <div className="glass-card-lead rounded-xl p-6 border border-border-default space-y-6 bg-surface">
                <div className="border-b border-border-default pb-3 select-none flex items-center justify-between">
                  <h2 className="font-section-subtitle text-[18px] text-text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">
                      folder_shared
                    </span>
                    Documentación del Expediente
                  </h2>
                  {loadingDocs && (
                    <span className="text-[11px] text-text-secondary flex items-center gap-1">
                      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                      Actualizando...
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: "dni_nie", label: "DNI/NIE", icon: "badge" },
                    { id: "dni_nie_2", label: "DNI/NIE (Segundo documento)", icon: "badge" },
                    { id: "nomina", label: "Nómina", icon: "receipt_long" },
                    { id: "vida_laboral", label: "Vida laboral", icon: "work" },
                    { id: "banco", label: "Banco", icon: "account_balance" },
                    { id: "otros", label: "Otros", icon: "folder_open" },
                  ].map((cat) => {
                    const catFiles = documents[cat.id] || [];
                    const isUploading = uploadingCategory === cat.id;
                    const isDragging = dragOverCategory === cat.id;

                    return (
                      <div
                        key={cat.id}
                        className="glass-card-lead rounded-xl p-4 border border-border-default/60 hover:border-border-default transition-all flex flex-col min-h-[90px] space-y-3 bg-surface-container-lowest/50"
                      >
                        <div className="flex items-center justify-between border-b border-border-default/40 pb-2 select-none text-left">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">
                              {cat.icon}
                            </span>
                            <span className="text-[11px] font-bold text-text-primary uppercase tracking-wider">
                              {cat.label}
                            </span>
                          </div>
                          {catFiles.length > 0 ? (
                            <span className="material-symbols-outlined text-success text-[18px] font-bold select-none" title="Archivo subido">
                              check_circle
                            </span>
                          ) : (
                            <span className="material-symbols-outlined text-warning text-[18px] font-bold select-none" title="Pendiente de subir">
                              schedule
                            </span>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                          {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-4 space-y-2 select-none">
                              <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                              <span className="text-[10px] text-text-secondary font-medium animate-pulse">
                                Subiendo... {uploadProgress}%
                              </span>
                            </div>
                          ) : catFiles.length > 0 ? (
                            <div className="space-y-2 py-1">
                              {catFiles.map((file) => (
                                <div
                                  key={file.path}
                                  className="flex items-center justify-between p-2 rounded-lg bg-surface border border-border-default hover:bg-surface-container-high/30 transition-all gap-2"
                                >
                                  <div className="min-w-0 flex-1 flex items-center gap-2 text-left">
                                    <span className="material-symbols-outlined text-[18px] text-text-secondary">
                                      {file.name.endsWith(".pdf") ? "picture_as_pdf" : "description"}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                      <p
                                        className="text-[11px] font-semibold text-text-primary truncate"
                                        title={file.name}
                                      >
                                        {file.name}
                                      </p>
                                      <p className="text-[9px] text-text-secondary select-none font-medium">
                                        {formatBytes(file.size)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handlePreview(file)}
                                      className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20 cursor-pointer"
                                      title="Vista Previa"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">
                                        visibility
                                      </span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDownload(file.path)}
                                      className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-primary/20 hover:text-primary transition-all flex items-center justify-center border border-border-default hover:border-primary/20 cursor-pointer"
                                      title="Descargar"
                                    >
                                      <span className="material-symbols-outlined text-[13px]">
                                        download
                                      </span>
                                    </button>
                                    {canEdit && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteDoc(file.path)}
                                        className="w-7 h-7 rounded-lg bg-surface-container-high hover:bg-danger/25 hover:text-danger transition-all flex items-center justify-center border border-border-default hover:border-danger/20 cursor-pointer"
                                        title="Eliminar"
                                      >
                                        <span className="material-symbols-outlined text-[13px]">
                                          delete
                                        </span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setDragOverCategory(cat.id);
                              }}
                              onDragLeave={() => setDragOverCategory(null)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setDragOverCategory(null);
                                if (!canEdit) return;
                                const files = e.dataTransfer.files;
                                if (files && files[0]) {
                                  handleFileUpload(cat.id, files[0]);
                                }
                              }}
                              onClick={() => {
                                if (!canEdit) return;
                                document.getElementById(`file-input-${cat.id}`)?.click();
                              }}
                              className={`border border-dashed rounded-lg p-2 flex items-center justify-center gap-2 cursor-pointer transition-all h-[46px] ${
                                isDragging
                                  ? "border-primary bg-primary/5 scale-[0.98]"
                                  : "border-border-default hover:border-primary/50 hover:bg-surface-container-low/40"
                              } ${!canEdit ? "opacity-60 cursor-not-allowed" : ""}`}
                            >
                              <input
                                type="file"
                                id={`file-input-${cat.id}`}
                                className="hidden"
                                disabled={!canEdit}
                                accept="image/*,.pdf,.docx,.xlsx,.xls"
                                onChange={(e) => {
                                  const files = e.target.files;
                                  if (files && files[0]) {
                                    handleFileUpload(cat.id, files[0]);
                                  }
                                }}
                              />
                              <span className="material-symbols-outlined text-[16px] text-text-disabled shrink-0">
                                cloud_upload
                              </span>
                              <span className="text-[10px] font-semibold text-text-secondary">
                                Arrastra o selecciona archivo
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <LeadDocumentsTab
              lead={lead}
              canEdit={canEdit}
              onRefresh={handleRefresh}
            />
          )}
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

      {/* Document Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm cursor-pointer"
            onClick={() => setPreviewFile(null)}
          />

          {/* Modal Dialog */}
          <div className="relative z-10 w-full max-w-4xl bg-surface-container border border-border-default rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-default bg-surface shrink-0">
              <h3 className="font-section-subtitle text-[17px] text-text-primary truncate">
                Vista previa: {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-text-secondary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-container-high transition-colors flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col justify-center items-center bg-surface-container-lowest">
              {previewFile.name.toLowerCase().endsWith(".pdf") ? (
                <iframe
                  src={previewFile.url}
                  className="w-full h-full border-0 rounded-lg bg-white"
                  title="PDF Preview"
                />
              ) : /\.(jpg|jpeg|png|webp)$/i.test(previewFile.name) ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFile.url}
                  alt={previewFile.name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                />
              ) : (
                <div className="text-center p-6 space-y-4 max-w-sm">
                  <span className="material-symbols-outlined text-text-disabled text-5xl">
                    info
                  </span>
                  <h4 className="text-[15px] font-semibold text-text-primary">
                    Vista previa no disponible
                  </h4>
                  <p className="text-[12px] text-text-secondary">
                    La vista previa directa en el navegador no está soportada para este formato de archivo (Word/Excel).
                  </p>
                  <button
                    onClick={() => handleDownload(previewFile.path)}
                    className="mx-auto bg-primary text-inverse-on-surface hover:shadow-lg transition-all rounded-lg py-2 px-4 flex items-center justify-center gap-1.5 font-body-sm font-semibold text-[13px] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px]">download</span>
                    Descargar Archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
