"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { TaskWithDetails, TaskStatus, TaskPriority } from "@/types/tasks";
import type { ProfileSummary } from "@/types/profiles";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
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

export default function TaskList({ tasks, currentUser, comerciales }: TaskListProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComercial, setSelectedComercial] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalStatus, setActiveModalStatus] = useState<TaskStatus>("pendiente");
  const [selectedTaskToEdit, setSelectedTaskToEdit] = useState<TaskWithDetails | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  // Check if a task is overdue
  const isOverdue = (task: TaskWithDetails) => {
    if (!task.due_date || task.status === "completada") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // Format due date label
  const getDueDateLabel = (task: TaskWithDetails) => {
    if (!task.due_date) return "Sin fecha";
    
    const [year, month, day] = task.due_date.split("-").map(Number);
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

    const [year, month, day] = task.due_date.split("-").map(Number);
    let hours = 23;
    let minutes = 59;
    if (task.due_time) {
      const [h, m] = task.due_time.split(":");
      hours = parseInt(h, 10);
      minutes = parseInt(m, 10);
    }
    const targetDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();
    const diffMs = targetDate.getTime() - now.getTime();
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

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.lead?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComercial = selectedComercial === "" || t.assigned_to === selectedComercial;
    return matchesSearch && matchesComercial;
  });

  // Sort tasks by created_at DESC (newest/most recent first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
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

  const getPriorityClass = (priority: TaskPriority) => {
    switch (priority) {
      case "alta":
        return "bg-error-container/20 text-danger border-danger/25";
      case "media":
        return "bg-warning/10 text-warning border-warning/20";
      case "baja":
        return "bg-surface-container-highest text-text-secondary border-border-strong";
      default:
        return "bg-surface-container text-text-secondary border-border-default";
    }
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
    <div className="flex-1 flex flex-col p-6 space-y-6 text-left">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Listado de Tareas
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary">
            Lista de tareas pendientes y de seguimiento comercial ordenadas por fecha de creación (más recientes arriba). Haz clic en una fila para modificar la tarea.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg py-2 px-4 flex items-center justify-center gap-2 font-body-sm font-medium text-[13px] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Crear Tarea
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-surface border border-border-default rounded-xl p-4 glow-effect shrink-0">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Buscar tarea o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg-input text-text-primary placeholder:text-text-disabled border border-border-default rounded-lg pl-10 pr-4 py-2 font-body-sm text-[13px] focus:outline-none focus:border-primary"
          />
        </div>

        {/* Comercial Selector */}
        <div className="w-full sm:max-w-[220px]">
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

      {/* Tabular Tasks List */}
      {sortedTasks.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center py-12 text-center bg-surface border border-border-default rounded-xl">
          <span className="material-symbols-outlined text-text-disabled text-5xl mb-4">
            playlist_add_check
          </span>
          <h3 className="font-section-subtitle text-[17px] text-text-primary mb-1">
            No se encontraron tareas
          </h3>
          <p className="font-body-sm text-[13px] text-text-secondary max-w-sm">
            Intenta cambiar los filtros o el término de búsqueda para ver más resultados.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto border border-border-default rounded-xl bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border-default bg-surface-container-low select-none">
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider pl-6">
                  Tarea / Descripción
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-[180px]">
                  Estado
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                  Cliente Asoc.
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-[225px]">
                  Vencimiento
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                  Asignado A
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider w-[150px]">
                  Creada el
                </th>
                <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right pr-6 w-[80px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
              {sortedTasks.map((task) => {
                const taskOverdue = isOverdue(task);
                const isTaskOwner = task.assigned_to === currentUser.id;
                const canManage = currentUser.role === "admin" || isTaskOwner;

                return (
                  <tr
                    key={task.id}
                    className="hover:bg-surface-container-high/40 transition-colors cursor-pointer"
                    onClick={() => handleRowClick(task)}
                  >
                    {/* Title & Description */}
                    <td className="px-6 py-4 pl-6 max-w-xs md:max-w-sm">
                      <div className="font-medium text-text-primary font-body-md leading-snug">
                        {task.title}
                      </div>
                      {task.description && (
                        <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </td>

                    {/* Status (Interactive dropdown selector) */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <div className="flex items-center gap-1.5 relative">
                          <div className={`w-2 h-2 rounded-full absolute left-2.5 ${getStatusDotClass(task.status)} pointer-events-none`}></div>
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, task.assigned_to, e.target.value as TaskStatus)}
                            className="bg-bg-input text-text-primary border border-border-default rounded-lg pl-6 pr-8 py-1 font-body-sm text-[12px] focus:outline-none focus:border-primary cursor-pointer w-full appearance-none select-none bg-[image:var(--select-arrow)]"
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
                        <Badge className={`${
                          task.status === "pendiente" ? "bg-warning/10 text-warning border-warning/20" :
                          "bg-success/10 text-success border-success/20"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${getStatusDotClass(task.status)}`}></div>
                          <span>{STATUS_OPTIONS.find(o => o.id === task.status)?.label || task.status}</span>
                        </Badge>
                      )}
                    </td>

                    {/* Associated Lead Link */}
                    <td className="px-6 py-4">
                      {task.lead ? (
                        <Link
                          href={`/leads/${task.lead.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-primary hover:underline hover:text-opacity-80 transition-colors inline-flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">person</span>
                          {task.lead.full_name}
                        </Link>
                      ) : (
                        <span className="text-text-disabled">—</span>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col space-y-0.5">
                        <div
                          className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                            task.status === "completada"
                              ? "text-success"
                              : taskOverdue
                                ? "text-danger"
                                : "text-warning"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          <span>{getDueDateLabel(task)}</span>
                        </div>
                        {getRemainingTime(task) && (
                          <div
                            className={`text-[10px] font-medium pl-5 leading-tight ${
                              taskOverdue ? "text-danger/80 animate-pulse" : "text-warning/80"
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
                          <div className="w-5 h-5 rounded-full bg-border-strong flex items-center justify-center text-[10px] font-bold text-text-primary select-none">
                            {task.assignee.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-text-primary truncate max-w-[120px]">
                            {task.assignee.full_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-disabled">—</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4 text-text-secondary text-[12px]">
                      {formatDateTime(task.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right pr-6" onClick={(e) => e.stopPropagation()}>
                      {canManage ? (
                        <button
                          onClick={() => handleDeleteTask(task.id, task.assigned_to)}
                          className="text-text-secondary hover:text-danger rounded p-1 hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer ml-auto"
                          title="Eliminar tarea"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      ) : (
                        <span className="text-text-disabled text-[12px]">—</span>
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
