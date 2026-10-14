"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TaskWithDetails, TaskStatus } from "@/types/tasks";
import type { ProfileSummary } from "@/types/profiles";
import { updateTaskStatus, deleteTask, toggleArchiveTask } from "@/lib/actions/tasks";
import TaskCreateModal from "./TaskCreateModal";
import Badge from "../ui/Badge";

type TaskListProps = {
  tasks: TaskWithDetails[];
  currentUser: { id: string; role: "admin" | "comercial" };
  comerciales: ProfileSummary[];
};

const STATUS_OPTIONS: { id: TaskStatus; label: string; dotClass: string }[] = [
  { id: "pendiente", label: "Pendiente", dotClass: "bg-warning" },
  { id: "completada", label: "Completada", dotClass: "bg-success" },
];

type BlockFilter = "todas" | "vencidas" | "hoy" | "manana";

export default function TaskList({ tasks, currentUser, comerciales }: TaskListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComercial, setSelectedComercial] = useState("");
  const [activeBlock, setActiveBlock] = useState<BlockFilter>("todas");
  const [showArchived, setShowArchived] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalStatus, setActiveModalStatus] = useState<TaskStatus>("pendiente");
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<TaskWithDetails | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  // Helper to calculate numeric timestamp of task due date & time
  const getTaskDueDateTime = (task: TaskWithDetails): number => {
    if (!task.due_date) return Infinity;
    const [year, month, day] = task.due_date.split("-").map(Number);
    let hours = 23;
    let minutes = 59;
    if (task.due_time) {
      const [h, m] = task.due_time.split(":");
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }
    return new Date(year, month - 1, day, hours, minutes).getTime();
  };

  // Timing status according to requirement 5a:
  // 🔴 Rojo: tareas cuya fecha y hora programadas ya han pasado, y no se hayan completado.
  // 🟢 Verde: tareas cuya fecha y hora programadas todavía no han llegado.
  const getTaskTimingStatus = (task: TaskWithDetails): "vencida" | "futura" | "completada" | "none" => {
    if (!task.due_date) return "none";
    const dueTime = getTaskDueDateTime(task);
    const now = Date.now();
    if (dueTime < now) {
      return task.status === "completada" ? "completada" : "vencida";
    }
    return "futura";
  };

  // Format due date label
  const getDueDateLabel = (task: TaskWithDetails) => {
    if (!task.due_date) return "Sin fecha";
    
    const [, month, day] = task.due_date.split("-").map(Number);
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const formattedDay = String(day).padStart(2, "0");
    const formattedMonth = months[month - 1];
    let dateLabel = `${formattedDay}/${formattedMonth}`;

    if (task.due_time) {
      const [hoursStr, minutesStr] = task.due_time.split(":");
      const hours = parseInt(hoursStr, 10);
      const minutes = parseInt(minutesStr, 10);
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      const displayMinutes = String(minutes).padStart(2, "0");
      dateLabel += ` - ${displayHours}:${displayMinutes} ${ampm}`;
    }

    return dateLabel;
  };

  // Get remaining time text
  const getRemainingTime = (task: TaskWithDetails) => {
    if (!task.due_date || task.status === "completada") return null;

    const targetTime = getTaskDueDateTime(task);
    const now = Date.now();
    const diffMs = targetTime - now;
    const isPast = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const diffMins = Math.floor(absDiffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const remainingHours = diffHours % 24;
    const remainingMins = diffMins % 60;

    let timeText = "";
    if (diffDays > 0) {
      timeText = `${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
      if (remainingHours > 0) {
        timeText += ` y ${remainingHours} ${remainingHours === 1 ? 'hora' : 'horas'}`;
      }
    } else if (diffHours > 0) {
      timeText = `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (remainingMins > 0) {
        timeText += ` y ${remainingMins} ${remainingMins === 1 ? 'min' : 'minutos'}`;
      }
    } else {
      timeText = `${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'}`;
    }

    if (isPast) {
      return `Vencido hace ${timeText}`;
    }
    return `Faltan ${timeText}`;
  };

  // Format date time helper
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Compute local date strings for Hoy and Mañana
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  // Partition tasks into active and archived
  const activeTasksList = tasks.filter((t) => !t.archived);
  const archivedTasksList = tasks.filter((t) => !!t.archived);
  const baseTasks = showArchived ? archivedTasksList : activeTasksList;

  // Block counts for buttons
  const countVencidas = activeTasksList.filter(
    (t) => getTaskDueDateTime(t) < Date.now() && t.status !== "completada"
  ).length;
  const countHoy = activeTasksList.filter((t) => t.due_date === todayStr).length;
  const countManana = activeTasksList.filter((t) => t.due_date === tomorrowStr).length;
  const countTodas = activeTasksList.length;
  const countArchived = archivedTasksList.length;

  // Filter tasks by block, search query, and comercial
  const blockFilteredTasks = baseTasks.filter((t) => {
    if (showArchived) return true;
    if (activeBlock === "vencidas") {
      return getTaskDueDateTime(t) < Date.now() && t.status !== "completada";
    }
    if (activeBlock === "hoy") {
      return t.due_date === todayStr;
    }
    if (activeBlock === "manana") {
      return t.due_date === tomorrowStr;
    }
    return true;
  });

  const filteredTasks = blockFilteredTasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.lead?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComercial = selectedComercial === "" || t.assigned_to === selectedComercial;
    return matchesSearch && matchesComercial;
  });

  // Sort tasks by due date (Requirement 4)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const timeA = getTaskDueDateTime(a);
    const timeB = getTaskDueDateTime(b);
    if (timeA !== timeB) return timeA - timeB;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Handle status update inline
  const handleStatusChange = (taskId: string, assignedTo: string, newStatus: TaskStatus) => {
    const canMove = currentUser.role === "admin" || assignedTo === currentUser.id;
    if (!canMove) {
      alert("No tienes permiso para modificar esta tarea.");
      return;
    }

    startTransition(async () => {
      const result = await updateTaskStatus({
        task_id: taskId,
        status: newStatus,
      });

      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "Error al actualizar el estado.");
      }
    });
  };

  // Handle archiving / unarchiving (Requirement 6)
  const handleToggleArchive = (taskId: string, newArchivedState: boolean) => {
    const msg = newArchivedState
      ? "¿Deseas archivar esta tarea? Dejará de mostrarse en la lista activa."
      : "¿Deseas desarchivar esta tarea y devolverla a la lista activa?";
    if (!confirm(msg)) return;

    startTransition(async () => {
      const result = await toggleArchiveTask(taskId, newArchivedState);
      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "No se pudo actualizar el estado de archivo.");
      }
    });
  };

  const handleDeleteTask = (taskId: string, assignedTo: string) => {
    const canDelete = currentUser.role === "admin" || assignedTo === currentUser.id;
    if (!canDelete) {
      alert("No tienes permiso para eliminar esta tarea.");
      return;
    }

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

  const handleRowClick = (task: TaskWithDetails) => {
    const canManage = currentUser.role === "admin" || task.assigned_to === currentUser.id;
    if (!canManage) {
      alert("No tienes permiso para modificar esta tarea.");
      return;
    }
    setSelectedTaskToEdit(task);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedTaskToEdit(null);
    setActiveModalStatus("pendiente");
    setIsModalOpen(true);
  };

  const getStatusDotClass = (status: TaskStatus) => {
    switch (status) {
      case "pendiente":
        return "bg-warning";
      case "completada":
        return "bg-success";
      default:
        return "bg-text-disabled";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 space-y-6 text-left overflow-y-auto min-h-0 h-full">
      {/* Banner when viewing archived tasks */}
      {showArchived && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-text-primary shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[20px]">
              inventory_2
            </span>
            <span className="text-[13px] font-medium">
              Mostrando tareas archivadas ({archivedTasksList.length}). Están ocultas de la lista principal de tareas activas.
            </span>
          </div>
          <button
            onClick={() => setShowArchived(false)}
            className="text-primary hover:underline text-[13px] font-bold flex items-center gap-1 cursor-pointer ml-3 shrink-0"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Volver a tareas activas
          </button>
        </div>
      )}

      {/* Unified Toolbar: Search, Filters, Block Buttons & Action Buttons at the exact same height */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 bg-surface border border-border-default rounded-xl p-3.5 glow-effect shrink-0">
        {/* Left: Search & Commercial Selector */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center min-w-0">
          {/* Search */}
          <div className="relative w-full sm:w-[220px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Buscar tarea o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-9 pr-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary"
            />
          </div>

          {/* Comercial Selector */}
          <div className="w-full sm:w-[190px]">
            <select
              value={selectedComercial}
              onChange={(e) => setSelectedComercial(e.target.value)}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-3 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">Todos los comerciales</option>
              {comerciales.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Block Filter Buttons (Requirement 5b) */}
        {!showArchived && (
          <div className="flex flex-wrap items-center gap-1.5 select-none">
            {/* PRIMER BOTON: TAREAS VENCIDAS */}
            <button
              type="button"
              onClick={() => setActiveBlock("vencidas")}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeBlock === "vencidas"
                  ? "bg-red-500/20 text-red-400 border-red-500/50 shadow-[0_0_12px_rgba(239,68,68,0.25)] scale-[1.02]"
                  : "bg-surface-container-high/60 hover:bg-surface-container-high text-text-secondary border-border-default hover:text-text-primary"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>TAREAS VENCIDAS</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeBlock === "vencidas"
                    ? "bg-red-500/30 text-white"
                    : "bg-surface text-text-secondary"
                }`}
              >
                {countVencidas}
              </span>
            </button>

            {/* SEGUNDO BOTON: TAREAS HOY */}
            <button
              type="button"
              onClick={() => setActiveBlock("hoy")}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeBlock === "hoy"
                  ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(108,99,255,0.25)] scale-[1.02]"
                  : "bg-surface-container-high/60 hover:bg-surface-container-high text-text-secondary border-border-default hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">today</span>
              <span>TAREAS HOY</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeBlock === "hoy"
                    ? "bg-primary/30 text-white"
                    : "bg-surface text-text-secondary"
                }`}
              >
                {countHoy}
              </span>
            </button>

            {/* TERCER BOTON: TAREAS MAÑANA */}
            <button
              type="button"
              onClick={() => setActiveBlock("manana")}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeBlock === "manana"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)] scale-[1.02]"
                  : "bg-surface-container-high/60 hover:bg-surface-container-high text-text-secondary border-border-default hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">event_upcoming</span>
              <span>TAREAS MAÑANA</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  activeBlock === "manana"
                    ? "bg-emerald-500/30 text-white"
                    : "bg-surface text-text-secondary"
                }`}
              >
                {countManana}
              </span>
            </button>

            {/* BOTON TODAS */}
            <button
              type="button"
              onClick={() => setActiveBlock("todas")}
              className={`px-3 py-2 rounded-lg text-[12px] font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer border ${
                activeBlock === "todas"
                  ? "bg-surface-container-highest text-text-primary border-border-strong shadow-sm"
                  : "bg-surface-container-high/60 hover:bg-surface-container-high text-text-secondary border-border-default hover:text-text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">list</span>
              <span>TODAS</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-surface text-text-secondary">
                {countTodas}
              </span>
            </button>
          </div>
        )}

        {/* Right: Action Buttons at the exact same height */}
        <div className="flex items-center gap-2 shrink-0 justify-end">
          {/* Botón de acceso a tareas archivadas */}
          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setActiveBlock("todas");
            }}
            className={`transition-all duration-200 rounded-lg py-2 px-3 flex items-center justify-center gap-1.5 font-body-sm font-semibold text-[13px] cursor-pointer border shrink-0 ${
              showArchived
                ? "bg-primary/20 text-primary border-primary/40 shadow-sm"
                : "bg-surface-container-high/60 hover:bg-surface-container-high text-text-secondary border-border-default hover:text-text-primary"
            }`}
            title={showArchived ? "Volver a la lista de tareas activas" : "Ver tareas archivadas"}
          >
            <span className="material-symbols-outlined text-[17px]">
              {showArchived ? "arrow_back" : "inventory_2"}
            </span>
            <span>
              {showArchived ? "Volver a Activas" : `Archivadas (${countArchived})`}
            </span>
          </button>

          {!showArchived && (
            <button
              onClick={openCreateModal}
              className="bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg py-2 px-3.5 flex items-center justify-center gap-1.5 font-body-sm font-semibold text-[13px] cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>Crear Tarea</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabular Tasks List (with vertical and horizontal scroll) */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center py-12 text-center bg-surface border border-border-default rounded-xl">
          <span className="material-symbols-outlined text-text-disabled text-5xl mb-4">
            playlist_add_check
          </span>
          <h3 className="font-section-subtitle text-[17px] text-text-primary mb-1">
            {showArchived
              ? "No hay tareas archivadas"
              : activeBlock !== "todas"
              ? `No hay tareas en el bloque "${activeBlock.toUpperCase()}"`
              : "No se encontraron tareas"}
          </h3>
          <p className="font-body-sm text-[13px] text-text-secondary max-w-sm">
            {activeBlock !== "todas"
              ? "Prueba a seleccionar el bloque 'TODAS' o cambiar los filtros."
              : "Intenta cambiar los filtros o el término de búsqueda para ver más resultados."}
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto border border-border-default rounded-xl bg-surface shadow-sm">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default bg-surface-container-low select-none">
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider pl-6">
                  Tarea / Descripción
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider w-[190px]">
                  Estado
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
                  Cliente Asoc.
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider w-[260px]">
                  Vencimiento
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider">
                  Asignado A
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider w-[160px]">
                  Creada el
                </th>
                <th className="px-6 py-3.5 font-field-label text-[13px] font-semibold text-text-secondary uppercase tracking-wider text-right pr-6 w-[110px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-[14px]">
              {sortedTasks.map((task) => {
                const timing = getTaskTimingStatus(task);
                const isTaskVencida = timing === "vencida";
                const isTaskFutura = timing === "futura";
                const isTaskOwner = task.assigned_to === currentUser.id;
                const canManage = currentUser.role === "admin" || isTaskOwner;

                return (
                  <tr
                    key={task.id}
                    className={`hover:bg-surface-container-high/40 transition-colors cursor-pointer ${
                      isTaskVencida
                        ? "border-l-4 border-l-red-500 bg-red-500/[0.03]"
                        : isTaskFutura
                        ? "border-l-4 border-l-emerald-500 bg-emerald-500/[0.02]"
                        : "border-l-4 border-l-transparent"
                    }`}
                    onClick={() => handleRowClick(task)}
                  >
                    {/* Title & Description */}
                    <td className="px-6 py-4 pl-6 max-w-xs md:max-w-sm">
                      <div className="font-semibold text-text-primary text-[15px] leading-snug">
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-[13px] text-text-secondary mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Status (Interactive dropdown selector) */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <div className="flex items-center gap-1.5 relative">
                          <div
                            className={`w-2.5 h-2.5 rounded-full absolute left-2.5 ${getStatusDotClass(
                              task.status
                            )} pointer-events-none`}
                          ></div>
                          <select
                            value={task.status}
                            onChange={(e) =>
                              handleStatusChange(task.id, task.assigned_to, e.target.value as TaskStatus)
                            }
                            className="bg-bg-input text-text-primary border border-border-default rounded-lg pl-7 pr-8 py-1.5 font-body-sm text-[13px] font-medium focus:outline-none focus:border-primary cursor-pointer w-full appearance-none select-none bg-[image:var(--select-arrow)]"
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239CA3AF'%3E%3Cpath d='M7 10l5 5 5-5H7z'/%3E%3C/svg%3E")`,
                              backgroundPosition: 'right 8px center',
                              backgroundSize: '16px',
                              backgroundRepeat: 'no-repeat'
                            }}
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <Badge
                          className={`${
                            task.status === "pendiente"
                              ? "bg-warning/10 text-warning border-warning/20"
                              : "bg-success/10 text-success border-success/20"
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${getStatusDotClass(task.status)}`}></div>
                          <span className="text-[12px]">
                            {STATUS_OPTIONS.find((o) => o.id === task.status)?.label || task.status}
                          </span>
                        </Badge>
                      )}
                    </td>

                    {/* Associated Lead Link */}
                    <td className="px-6 py-4">
                      {task.lead ? (
                        <Link
                          href={`/leads/${task.lead.id}`}
                          prefetch={false}
                          onClick={(e) => e.stopPropagation()}
                          className="font-semibold text-primary hover:underline hover:text-opacity-80 transition-colors inline-flex items-center gap-1.5 text-[14px]"
                        >
                          <span className="material-symbols-outlined text-[16px]">person</span>
                          {task.lead.full_name}
                        </Link>
                      ) : (
                        <span className="text-text-disabled">—</span>
                      )}
                    </td>

                    {/* Due Date (Color coded - Requirement 5a) */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isTaskVencida && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/15 text-red-400 border border-red-500/30 whitespace-nowrap">
                              🔴 Vencida
                            </span>
                          )}
                          {isTaskFutura && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                              🟢 A tiempo
                            </span>
                          )}
                          {timing === "completada" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container-high text-text-secondary border border-border-default whitespace-nowrap">
                              Completada
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 text-[13px] font-semibold font-data-mono ${
                              task.status === "completada"
                                ? "text-text-secondary"
                                : isTaskVencida
                                ? "text-red-400 font-bold"
                                : isTaskFutura
                                ? "text-emerald-400"
                                : "text-text-secondary"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            <span>{getDueDateLabel(task)}</span>
                          </span>
                        </div>
                        {getRemainingTime(task) && (
                          <div
                            className={`text-[12px] font-medium leading-tight ${
                              isTaskVencida ? "text-red-400/90 font-semibold" : "text-emerald-400/80"
                            }`}
                          >
                            {getRemainingTime(task)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Assigned To */}
                    <td className="px-6 py-4">
                      {task.assignee ? (
                        <div className="flex items-center gap-2" title={task.assignee.full_name}>
                          <div className="w-6 h-6 rounded-full bg-border-strong flex items-center justify-center text-[11px] font-bold text-text-primary select-none">
                            {task.assignee.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-text-primary font-medium text-[14px] truncate max-w-[130px]">
                            {task.assignee.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-disabled">—</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 text-text-secondary text-[13px] font-data-mono">
                      {formatDateTime(task.created_at)}
                    </td>

                    {/* Actions: Archive & Delete */}
                    <td className="px-6 py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Archivar / Desarchivar botón (Requirement 6) */}
                          <button
                            onClick={() => handleToggleArchive(task.id, !task.archived)}
                            className="text-text-secondary hover:text-primary rounded-lg p-1.5 hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer"
                            title={task.archived ? "Desarchivar tarea (restaurar a activas)" : "Archivar tarea"}
                          >
                            <span className="material-symbols-outlined text-[19px]">
                              {task.archived ? "unarchive" : "archive"}
                            </span>
                          </button>

                          {/* Eliminar tarea botón */}
                          <button
                            onClick={() => handleDeleteTask(task.id, task.assigned_to)}
                            className="text-text-secondary hover:text-danger rounded-lg p-1.5 hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <span className="material-symbols-outlined text-[19px]">delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-text-disabled text-[13px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Task Creation/Editing Modal */}
      <TaskCreateModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskToEdit(null);
        }}
        onSuccess={handleRefresh}
        initialStatus={activeModalStatus}
        currentUserId={currentUser.id}
        taskToEdit={selectedTaskToEdit}
      />
    </div>
  );
}
