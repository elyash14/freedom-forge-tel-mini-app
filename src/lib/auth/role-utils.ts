export const USER_ROLES = ["user", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export function isAdminRole(role: string): role is "admin" {
  return role === "admin";
}
