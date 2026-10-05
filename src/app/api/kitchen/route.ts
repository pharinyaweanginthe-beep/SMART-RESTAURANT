import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateOrderStatus, updateOrderItemStatus } from "@/services/order.service";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "KITCHEN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ดูรายการครัว" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");

    const where: any = {
      status: { in: ["PENDING", "CONFIRMED", "COOKING", "READY"] },
    };
    if (session.role !== "ADMIN") where.branchId = session.branchId || "__unassigned__";
    else if (branchId) where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        orderItems: {
          include: { menuItem: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "KITCHEN", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์อัปเดตสถานะครัว" }, { status: 403 });
    }
    const body = await request.json();
    const { orderId, orderItemId, status, action } = body;

    if (orderItemId) {
      if (session.role !== "ADMIN") {
        const item = await prisma.orderItem.findFirst({
          where: { id: orderItemId, order: { branchId: session.branchId || "__unassigned__" } },
          select: { id: true },
        });
        if (!item) return NextResponse.json({ success: false, error: "ไม่พบรายการในสาขาของคุณ" }, { status: 404 });
      }
      const updatedItem = await updateOrderItemStatus(orderItemId, status);
      return NextResponse.json({ success: true, data: updatedItem });
    }

    if (orderId && status) {
      if (session.role !== "ADMIN") {
        const order = await prisma.order.findFirst({
          where: { id: orderId, branchId: session.branchId || "__unassigned__" },
          select: { id: true },
        });
        if (!order) return NextResponse.json({ success: false, error: "ไม่พบออเดอร์ในสาขาของคุณ" }, { status: 404 });
      }
      const updatedOrder = await updateOrderStatus(orderId, status);
      return NextResponse.json({ success: true, data: updatedOrder });
    }

    return NextResponse.json({ success: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
