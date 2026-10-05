import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus } from "@/services/order.service";
import { getSession } from "@/lib/auth";
import { resolveCustomerTable } from "@/services/customer.service";
import { z } from "zod";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await getSession();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        table: true,
        branch: { include: { restaurant: true } },
        orderItems: { include: { menuItem: true } },
        payment: true,
        customer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "ไม่พบออเดอร์" }, { status: 404 });
    }
    if (session && ["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN"].includes(session.role)) {
      if (session.role !== "ADMIN" && order.branchId !== session.branchId) {
        return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ดูออเดอร์นี้" }, { status: 403 });
      }
    } else {
      const tableRef = searchParams.get("table");
      const table = tableRef ? await resolveCustomerTable(tableRef, searchParams.get("qr")) : null;
      if (!table || table.id !== order.tableId) {
        return NextResponse.json({ success: false, error: "ไม่พบออเดอร์นี้สำหรับ QR Code ที่ระบุ" }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "KITCHEN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์แก้ไขออเดอร์" }, { status: 403 });
    }
    if (session.role !== "ADMIN") {
      const order = await prisma.order.findFirst({
        where: { id: params.id, branchId: session.branchId || "__unassigned__" },
        select: { id: true },
      });
      if (!order) return NextResponse.json({ success: false, error: "ไม่พบออเดอร์ในสาขาของคุณ" }, { status: 404 });
    }
    const body = await request.json();
    const status = z
      .enum(["PENDING", "CONFIRMED", "COOKING", "READY", "SERVED", "COMPLETED", "CANCELLED"])
      .safeParse(body.status);
    if (!status.success) {
      return NextResponse.json({ success: false, error: "สถานะออเดอร์ไม่ถูกต้อง" }, { status: 400 });
    }
    const updated = await updateOrderStatus(params.id, status.data);
    return NextResponse.json({ success: true, data: updated, message: "อัปเดตสถานะสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
