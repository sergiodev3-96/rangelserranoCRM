import React from "react";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/actions/auth";
import { getAllProfiles } from "@/lib/actions/users";
import UsersListClient from "@/components/admin/UsersListClient";

export default async function UsuariosPage() {
  // 1. Obtener perfil y lista de usuarios en paralelo
  const [profileResult, profilesResult] = await Promise.all([
    getCurrentProfile(),
    getAllProfiles(),
  ]);

  if (!profileResult.success || !profileResult.data) {
    redirect("/login");
  }

  const currentUserProfile = profileResult.data;
  if (currentUserProfile.role !== "admin") {
    redirect("/leads");
  }

  const profiles = profilesResult.success && profilesResult.data ? profilesResult.data : [];

  return (
    <UsersListClient
      initialUsers={profiles}
      currentUserId={currentUserProfile.id}
    />
  );
}
