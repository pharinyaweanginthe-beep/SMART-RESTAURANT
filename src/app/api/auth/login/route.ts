import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { createToken, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: validated.email },
      include: { branch: true, restaurant: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ" },
        { status: 401 }
      );
    }

    const isValidPassword = await verifyPassword(validated.password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      branchId: user.branchId,
      restaurantId: user.restaurantId,
    };

    const token = await createToken(tokenPayload);

    const response = NextResponse.json({
      success: true,
      data: {
        user: tokenPayload,
        token,
      },
      message: "เข้าสู่ระบบสำเร็จ",
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400, // 1 day
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" },
      { status: 400 }
    );
  }
}
