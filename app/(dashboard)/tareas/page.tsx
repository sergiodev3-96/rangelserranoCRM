import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getTasks } from "@/lib/actions/tasks";
import { getActiveComerciales } from "@/lib/actions/users";
import TaskKanban from "@/components/tasks/TaskKanban";

export default async function TareasPage() {
  // 1. Obtener perfil del usuario actual y validar sesión
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }
  const currentUser = {
    id: profileResult.data.id,
    role: profileResult.data.role as "admin" | "comercial",
  };

  // 2. Obtener todas las tareas
  const tasksResult = await getTasks();
  const tasks = tasksResult.success && tasksResult.data ? tasksResult.data : [];

  // 3. Obtener comerciales activos para el filtro
  const comercialesResult = await getActiveComerciales();
  const comerciales = comercialesResult.success && comercialesResult.data ? comercialesResult.data : [];

  return (
    <TaskKanban
      tasks={tasks}
      currentUser={currentUser}
      comerciales={comerciales}
    />
  );
}
