"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskWithDetails, TaskStatus, TaskPriority } from "@/types/tasks";
import type { ProfileSummary } from "@/types/profiles";
import { updateTaskStatus, deleteTask } from "@/lib/actions/tasks";
import TaskCreateModal from "./TaskCreateModal";

type TaskKanbanProps = {
  tasks: TaskWithDetails[];
  currentUser: { id: string; role: "admin" | "comercial" };
  comerciales: ProfileSummary[];
};

const COLUMNS: { id: TaskStatus; label: string; dotClass: string; borderClass: string }[] = [
  { id: "pendiente", label: "Pendiente", dotClass: "bg-warning", borderClass: "border-warning/20" },
  { id: "en_proceso", label: "En Proceso", dotClass: "bg-primary", borderClass: "border-primary/20" },
  { id: "revision", label: "Revisión", dotClass: "bg-lead-waiting-text", borderClass: "border-lead-waiting-text/20" },
  { id: "completada", label: "Completada", dotClass: "bg-success", borderClass: "border-success/20" },
];

export default function TaskKanban({ tasks, currentUser, comerciales }: TaskKanbanProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComercial, setSelectedComercial] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeModalStatus, setActiveModalStatus] = useState<TaskStatus>("pendiente");

  // Drag states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

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
    const d = new Date(task.due_date);
    const formattedDate = d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
    
    if (isOverdue(task)) {
      return `Vencido (${formattedDate})`;
    }
    return formattedDate;
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (t.lead?.full_name || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesComercial = selectedComercial === "" || t.assigned_to === selectedComercial;
    return matchesSearch && matchesComercial;
  });

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;

    // Check permission (Admin or Assigned Commercial)
    const canMove = currentUser.role === "admin" || task.assigned_to === currentUser.id;
    if (!canMove) {
      alert("No tienes permiso para modificar esta tarea.");
      return;
    }

    startTransition(async () => {
      const result = await updateTaskStatus({
        task_id: taskId,
        status: targetStatus,
      });

      if (result.success) {
        handleRefresh();
      } else {
        alert(result.error || "Error al actualizar estado.");
      }
    });

    setDraggedTaskId(null);
  };

  const handleDeleteTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  const openCreateModal = (status: TaskStatus) => {
    setActiveModalStatus(status);
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

  return (
    <div className="flex-1 flex flex-col md:h-full md:overflow-hidden p-6 space-y-6 text-left">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Tareas y Kanban Board
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary">
            Pipeline de tareas pendientes, seguimiento y recordatorios comerciales.
          </p>
        </div>
        <button
          onClick={() => openCreateModal("pendiente")}
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

      {/* Kanban Board Container */}
      <div className="flex-1 flex gap-4 overflow-x-auto min-h-0 pb-4 scrollbar-hide">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="flex flex-col w-[300px] shrink-0 bg-surface-container-low/50 rounded-xl border border-border-subtle overflow-hidden"
            >
              {/* Column Header */}
              <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface-container-low/80 backdrop-blur-sm sticky top-0 z-10 select-none">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${col.dotClass}`}></div>
                  <h3 className="text-[15px] font-medium text-text-primary">{col.label}</h3>
                  <span className="bg-surface-container-high text-text-secondary text-[11px] px-2 py-0.5 rounded-full ml-1 font-semibold">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto kanban-scroll">
                {colTasks.map((task) => {
                  const taskOverdue = isOverdue(task);
                  const isTaskOwner = task.assigned_to === currentUser.id;
                  const canManage = currentUser.role === "admin" || isTaskOwner;

                  return (
                    <div
                      key={task.id}
                      draggable={canManage}
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={`glass-card rounded-lg p-4 cursor-grab hover:border-border-strong transition-all group relative overflow-hidden border ${
                        taskOverdue
                          ? "border-danger/30 hover:border-danger"
                          : isSelectedDragged(task.id)
                          ? "border-primary border-dashed"
                          : "border-border-default"
                      }`}
                    >
                      {/* Left color bar */}
                      <div className={`absolute top-0 left-0 w-1 h-full ${col.dotClass}`}></div>

                      {/* Header row (Priority & Actions) */}
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border uppercase select-none ${getPriorityClass(
                            task.priority
                          )}`}
                        >
                          {task.priority}
                        </span>

                        {canManage && (
                          <button
                            onClick={(e) => handleDeleteTask(task.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-danger rounded p-0.5 hover:bg-surface-container-high transition-all flex items-center justify-center cursor-pointer"
                            title="Eliminar tarea"
                          >
                            <span className="material-symbols-outlined text-[15px]">delete</span>
                          </button>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-[13px] text-text-primary font-medium mb-2 pl-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Associated Lead */}
                      {task.lead && (
                        <div className="flex items-center gap-1.5 mb-3 pl-2 select-none">
                          <span className="material-symbols-outlined text-text-secondary text-[14px]">person</span>
                          <span className="text-[11px] text-primary font-medium truncate">
                            {task.lead.full_name}
                          </span>
                        </div>
                      )}

                      {/* Footer Row (Due date & Assignee initials) */}
                      <div className="flex justify-between items-center pt-3 border-t border-border-subtle ml-2 select-none">
                        <div
                          className={`flex items-center gap-1 text-[11px] font-medium ${
                            taskOverdue ? "text-danger" : "text-text-secondary"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          <span>{getDueDateLabel(task)}</span>
                        </div>

                        {task.assignee && (
                          <div
                            className="w-5 h-5 rounded-full bg-border-strong flex items-center justify-center text-[10px] font-bold text-text-primary border border-border-default"
                            title={`Asignado a: ${task.assignee.full_name}`}
                          >
                            {task.assignee.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-text-disabled/40 select-none">
                    <span className="material-symbols-outlined text-3xl mb-1">
                      inbox
                    </span>
                    <p className="text-[11px]">Vacío</p>
                  </div>
                )}
              </div>

              {/* Column Footer "+" Button */}
              <button
                onClick={() => openCreateModal(col.id)}
                className="w-full py-2.5 bg-surface-container-low/30 border-t border-border-subtle hover:bg-surface-container-high/40 text-text-secondary hover:text-primary transition-all text-[12px] flex items-center justify-center gap-1.5 font-medium cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Añadir Tarea
              </button>
            </div>
          );
        })}
      </div>

      {/* Task Creation Modal */}
      <TaskCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleRefresh}
        initialStatus={activeModalStatus}
        currentUserId={currentUser.id}
      />
    </div>
  );

  function isSelectedDragged(id: string) {
    return draggedTaskId === id;
  }
}
