import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const SECRET_KEY = new TextEncoder().encode(
  process.env.AUTH_SECRET || "smart_restaurant_super_secret_jwt_key_2026_prod_grade"
);

export type UserRole = "ADMIN" | "MANAGER" | "CASHIER" | "STAFF" | "KITCHEN" | "CUSTOMER";

const userRoles = ["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN", "CUSTOMER"] as const;

function isUserRole(role: string): role is UserRole {
  return userRoles.some((userRole) => userRole === role);
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  branchId?: string | null;
  restaurantId?: string | null;
}

export async function createToken(payload: SessionUser): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionUser;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      branchId: true,
      restaurantId: true,
    },
  });
  if (!user || user.status !== "ACTIVE" || !isUserRole(user.role)) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    branchId: user.branchId,
    restaurantId: user.restaurantId,
  };
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
