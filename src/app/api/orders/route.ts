import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";
import { createOrder } from "@/services/order.service";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER", "STAFF", "KITCHEN"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ดูออเดอร์" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const status = searchParams.get("status");

    const where: any = {};
    if (session.role !== "ADMIN") where.branchId = session.branchId || "__unassigned__";
    else if (branchId) where.branchId = branchId;
    if (status) where.status = status;

    const orders = await prisma.order.findMany({
      where,
      include: {
        table: true,
        customer: true,
        orderItems: {
          include: { menuItem: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER", "STAFF"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์สร้างออเดอร์" }, { status: 403 });
    }
    const body = await request.json();
    const validated = createOrderSchema.parse(body);
    if (session.role !== "ADMIN" && validated.branchId !== session.branchId) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์สร้างออเดอร์ในสาขานี้" }, { status: 403 });
    }

    const order = await createOrder(validated);

    return NextResponse.json({
      success: true,
      data: order,
      message: "สั่งอาหารสำเร็จ ออเดอร์ของคุณถูกส่งไปยังห้องครัวแล้ว",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "ไม่สามารถสร้างออเดอร์ได้" },
      { status: 400 }
    );
  }
}
