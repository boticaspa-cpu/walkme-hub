export type UserRole = "admin" | "seller";

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  approval_status: "approved" | "pending" | "rejected" | "disabled";
}
