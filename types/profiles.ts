export type UserRole = "admin" | "comercial";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  avatar_url: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

// Para selects y dropdowns de asignación
export type ProfileSummary = Pick<
  Profile,
  "id" | "full_name" | "email" | "role" | "active"
>;
