import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ดูข้อมูลโต๊ะ" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const where =
      session.role === "ADMIN"
        ? branchId
          ? { branchId }
          : {}
        : { branchId: session.branchId || "__unassigned__" };

    const tables = await prisma.table.findMany({
      where,
      orderBy: { number: "asc" },
      include: {
        orders: {
          where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
          include: { orderItems: { include: { menuItem: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: tables });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์เพิ่มโต๊ะ" }, { status: 403 });
    }
    const body = await request.json();
    if (session.role !== "ADMIN" && body.branchId !== session.branchId) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์เพิ่มโต๊ะในสาขานี้" }, { status: 403 });
    }
    const table = await prisma.table.create({
      data: {
        branchId: body.branchId,
        number: body.number,
        capacity: body.capacity || 4,
        status: body.status || "AVAILABLE",
        qrCodeUrl: `/menu/${body.number}`,
      },
    });
    return NextResponse.json({ success: true, data: table, message: "เพิ่มโต๊ะสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
