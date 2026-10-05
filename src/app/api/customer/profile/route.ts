import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบเพื่อดูข้อมูลสมาชิก" }, { status: 401 });
  }
  const customer = await prisma.customer.findFirst({
    where: { email: session.email },
    select: { id: true, name: true, phone: true, points: true, totalSpending: true },
  });
  return NextResponse.json({
    success: true,
    data: {
      user: { name: session.name, email: session.email },
      member: customer
        ? {
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            points: customer.points,
            totalSpending: customer.totalSpending,
          }
        : null,
    },
  });
}
