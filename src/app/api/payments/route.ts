import { NextResponse } from "next/server";
import { paymentSchema } from "@/lib/validations";
import { processPayment } from "@/services/payment.service";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "MANAGER", "CASHIER"].includes(session.role)) {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์รับชำระเงิน" }, { status: 403 });
    }
    const body = await request.json();
    const validated = paymentSchema.parse(body);
    if (session.role !== "ADMIN") {
      const order = await prisma.order.findFirst({
        where: { id: validated.orderId, branchId: session.branchId || "__unassigned__" },
        select: { id: true },
      });
      if (!order) return NextResponse.json({ success: false, error: "ไม่พบออเดอร์ในสาขาของคุณ" }, { status: 404 });
    }

    const result = await processPayment({
      ...validated,
      userId: session?.id,
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "ชำระเงินเรียบร้อยแล้ว พิมพ์ใบเสร็จสำเร็จ",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "เกิดข้อผิดพลาดในการชำระเงิน" },
      { status: 400 }
    );
  }
}
