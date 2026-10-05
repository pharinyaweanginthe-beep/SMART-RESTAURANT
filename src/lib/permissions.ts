import { UserRole } from "./auth";

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard",
    "/pos",
    "/kitchen",
    "/orders",
    "/menu",
    "/inventory",
    "/tables",
    "/members",
    "/reports",
    "/investment",
    "/settings",
    "/admin/users",
    "/admin/branches",
  ],
  MANAGER: [
    "/dashboard",
    "/pos",
    "/kitchen",
    "/orders",
    "/menu",
    "/inventory",
    "/tables",
    "/members",
    "/reports",
    "/investment",
    "/settings",
  ],
  CASHIER: ["/pos", "/orders", "/tables", "/reports"],
  STAFF: ["/orders", "/tables"],
  KITCHEN: ["/kitchen", "/orders"],
  CUSTOMER: ["/menu", "/order"],
};

export function hasPermission(role: UserRole, path: string): boolean {
  if (role === "ADMIN") return true;
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.some((prefix) => path.startsWith(prefix));
}
