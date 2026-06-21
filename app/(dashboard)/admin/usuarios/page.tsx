import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getAllProfiles } from "@/lib/actions/users";
import UsersListClient from "@/components/admin/UsersListClient";

export default async function UsuariosPage() {
  // 1. Obtener perfil de la sesión actual y validar rol admin
  const profileResult = await getCurrentProfile();
  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  // 2. Obtener lista de perfiles
  const profilesResult = await getAllProfiles();
  const profiles = profilesResult.success && profilesResult.data ? profilesResult.data : [];

  return (
    <UsersListClient
      initialUsers={profiles}
      currentUserId={currentUserProfile.id}
    />
  );
}
