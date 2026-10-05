import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { memberSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const members = await prisma.customer.findMany({
      where,
      include: {
        memberPoints: { orderBy: { createdAt: "desc" }, take: 10 },
        orders: { take: 5, orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: members });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = memberSchema.parse(body);

    const member = await prisma.customer.create({
      data: {
        name: validated.name,
        phone: validated.phone,
        email: validated.email || null,
        points: 0,
        totalSpending: 0,
      },
    });

    return NextResponse.json({ success: true, data: member, message: "สมัครสมาชิกสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
