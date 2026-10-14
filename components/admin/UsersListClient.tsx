"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, UserRole } from "@/types/profiles";
import { updateProfileRole, toggleProfileActive, inviteNewUser, deleteUserProfile } from "@/lib/actions/users";
import Modal from "../ui/Modal";

type UsersListClientProps = {
  initialUsers: Profile[];
  currentUserId: string;
};

export default function UsersListClient({
  initialUsers,
  currentUserId,
}: UsersListClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Estados para modal de confirmación de eliminación
  const [userToDelete, setUserToDelete] = useState<Profile | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUserId) {
      alert("No puedes eliminar tu propia cuenta.");
      return;
    }

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteUserProfile(userToDelete.id);
      if (result.success) {
        setUserToDelete(null);
        router.refresh();
      } else {
        setDeleteError(result.error || "No se pudo eliminar el usuario.");
      }
    });
  };

  const handleRoleChange = (userId: string, nextRole: UserRole) => {
    if (userId === currentUserId) {
      alert("No puedes cambiar tu propio rol.");
      return;
    }

    startTransition(async () => {
      const result = await updateProfileRole(userId, nextRole);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo actualizar el rol del usuario.");
      }
    });
  };

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    if (userId === currentUserId) {
      alert("No puedes desactivar tu propia cuenta.");
      return;
    }

    const nextActive = !currentActive;
    const confirmMessage = nextActive 
      ? "¿Estás seguro de que deseas activar esta cuenta?" 
      : "¿Estás seguro de que deseas desactivar esta cuenta? El usuario perderá el acceso inmediato a la plataforma.";
    
    if (!confirm(confirmMessage)) return;

    startTransition(async () => {
      const result = await toggleProfileActive(userId, nextActive);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "No se pudo cambiar el estado del usuario.");
      }
    });
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setErrorMsg("Todos los campos son obligatorios.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const result = await inviteNewUser(inviteEmail.trim(), inviteName.trim());
      if (result.success) {
        setSuccessMsg(`Invitación enviada con éxito a ${inviteEmail}.`);
        setInviteName("");
        setInviteEmail("");
        // Cerrar modal tras un pequeño delay para que vean el éxito
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setSuccessMsg(null);
          router.refresh();
        }, 2000);
      } else {
        setErrorMsg(result.error || "No se pudo enviar la invitación.");
      }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className="p-6 space-y-6 text-left bg-bg-base text-text-primary">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="font-headline-lg text-[28px] text-primary tracking-tight leading-tight mb-1">
            Administración de Usuarios
          </h1>
          <p className="font-body-sm text-[13px] text-text-secondary mt-1">
            Gestión de roles, activación de cuentas e invitaciones para el equipo comercial.
          </p>
        </div>

        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] transition-all duration-300 rounded-lg px-4 py-2 text-[13px] font-medium cursor-pointer select-none"
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Invitar Comercial
        </button>
      </div>

      {/* Users Grid / Table */}
      <div className="w-full border border-border-default rounded-xl bg-surface overflow-x-auto">
        <table className="w-full border-collapse text-left min-w-[800px]">
          <thead>
            <tr className="border-b border-border-default bg-surface-container-low select-none">
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Nombre completo
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Correo electrónico
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Rol actual
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider">
                Estado de cuenta
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right">
                Fecha Registro
              </th>
              <th className="px-6 py-3 font-field-label text-[11px] text-text-secondary uppercase tracking-wider text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle font-body-sm text-[13px]">
            {initialUsers.map((user) => {
              const isSelf = user.id === currentUserId;
              
              return (
                <tr
                  key={user.id}
                  className="hover:bg-surface-container-high/40 transition-colors"
                >
                  {/* Name with initials avatar */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[12px] font-bold select-none shrink-0">
                        {getInitials(user.full_name)}
                      </div>
                      <div>
                        <span className="font-semibold text-text-primary font-body-md block">
                          {user.full_name}
                        </span>
                        {isSelf && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded border border-primary/20 font-bold uppercase tracking-wider inline-block mt-0.5">
                            Tú
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 text-text-secondary font-medium">
                    {user.email}
                  </td>

                  {/* Role Dropdown */}
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                      disabled={isPending || isSelf}
                      className={`inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium border focus:outline-none focus:ring-1 focus:ring-primary bg-bg-input cursor-pointer disabled:cursor-not-allowed ${
                        user.role === "admin"
                          ? "border-primary/20 text-primary"
                          : "border-border-default text-text-secondary"
                      }`}
                    >
                      <option value="comercial">Comercial</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>

                  {/* Active Toggle Switch */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(user.id, user.active)}
                        disabled={isPending || isSelf}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.active ? "bg-success" : "bg-surface-container-highest"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-inverse-on-surface shadow ring-0 transition duration-200 ease-in-out ${
                            user.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className={`text-[11px] font-medium ${user.active ? "text-success" : "text-text-disabled"}`}>
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 text-right text-text-secondary font-data-mono">
                    {new Date(user.created_at).toLocaleDateString("es-ES")}
                  </td>

                  {/* Actions (Delete) */}
                  <td className="px-6 py-4 text-right">
                    {isSelf ? (
                      <span
                        className="text-text-disabled/40 text-[12px] select-none inline-block px-2"
                        title="No puedes eliminarte a ti mismo"
                      >
                        —
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteError(null);
                        }}
                        disabled={isPending}
                        title={`Eliminar usuario ${user.full_name}`}
                        aria-label={`Eliminar usuario ${user.full_name}`}
                        className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {initialUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-disabled/40 select-none">
                  <span className="material-symbols-outlined text-4xl mb-2">group</span>
                  <p className="font-body-sm text-[13px]">No se encontraron usuarios.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite User Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => {
          if (!isPending) {
            setIsInviteModalOpen(false);
            setErrorMsg(null);
            setSuccessMsg(null);
          }
        }}
        title="Invitar Nuevo Comercial"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-left">
          {errorMsg && (
            <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-success/15 border border-success/30 text-success rounded-lg p-3 font-body-sm text-[13px]">
              {successMsg}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              disabled={isPending}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="font-field-label text-[11px] text-text-secondary uppercase block">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="juan@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              disabled={isPending}
              className="w-full bg-bg-input text-text-primary border border-border-default rounded-lg px-4 py-2.5 font-body-sm text-[13px] focus:outline-none focus:border-primary"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6">
            <button
              type="button"
              onClick={() => {
                setIsInviteModalOpen(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="px-4 py-2 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
              disabled={isPending}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || !inviteName.trim() || !inviteEmail.trim()}
              className="px-5 py-2 bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(108,99,255,0.4)] disabled:opacity-50 disabled:hover:shadow-none transition-all rounded-lg text-[13px] font-medium cursor-pointer flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                  Enviando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  Enviar Invitación
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={userToDelete !== null}
        onClose={() => {
          if (!isPending) {
            setUserToDelete(null);
            setDeleteError(null);
          }
        }}
        title="Eliminar Usuario"
      >
        {userToDelete && (
          <div className="space-y-4 text-left">
            {deleteError && (
              <div className="bg-error-container/20 border border-error/20 text-danger rounded-lg p-3 font-body-sm text-[13px]">
                {deleteError}
              </div>
            )}

            {/* User details card */}
            <div className="flex items-center gap-3 p-3 bg-surface-container-high/40 rounded-xl border border-border-default">
              <div className="w-10 h-10 rounded-full bg-danger/10 text-danger flex items-center justify-center text-[13px] font-bold select-none shrink-0">
                {getInitials(userToDelete.full_name)}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-text-primary text-[14px] block truncate">
                  {userToDelete.full_name}
                </span>
                <span className="text-[12px] text-text-secondary block truncate">
                  {userToDelete.email}
                </span>
              </div>
            </div>

            <p className="text-[13px] text-text-secondary leading-relaxed">
              ¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción dará de baja su cuenta y revocarán sus accesos.
            </p>

            {/* Lead assignment clarification */}
            <div className="bg-surface-container-high/60 border border-border-default rounded-xl p-3 text-[12px] text-text-secondary flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">
                assignment_return
              </span>
              <div className="space-y-1">
                <strong className="text-text-primary block font-medium">
                  ¿Qué ocurre con sus leads?
                </strong>
                <p className="text-text-secondary leading-normal">
                  Todos los leads que estaban asignados a este comercial pasarán automáticamente al estado{" "}
                  <span className="font-semibold text-text-primary">&quot;Sin asignar&quot;</span>.
                  Ningún dato o lead se borrará, y podrás reasignarlos fácilmente a otro comercial desde el listado de Leads.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-default mt-6">
              <button
                type="button"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2 border border-border-default text-text-secondary hover:text-text-primary rounded-lg text-[13px] font-medium transition-colors cursor-pointer"
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isPending}
                className="px-4 py-2 bg-danger hover:bg-danger/90 text-white rounded-lg text-[13px] font-medium transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">sync</span>
                    Eliminando...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Eliminar definitivamente
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
