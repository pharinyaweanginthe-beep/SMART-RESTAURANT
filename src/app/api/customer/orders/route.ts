import { NextResponse } from "next/server";
import { customerOrderSchema } from "@/lib/validations";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen, resolveCustomerTable } from "@/services/customer.service";
import { createOrder } from "@/services/order.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableRef = searchParams.get("table");
  const table = tableRef ? await resolveCustomerTable(tableRef, searchParams.get("qr")) : null;
  if (!table) {
    return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  }

  const orders = await prisma.order.findMany({
    where: { tableId: table.id },
    include: { orderItems: { include: { menuItem: true } }, table: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = customerOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || "รายการสั่งอาหารไม่ถูกต้อง" },
      { status: 400 }
    );
  }

  const table = await resolveCustomerTable(parsed.data.table, parsed.data.qr);
  if (!table) {
    return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  }
  if (table.status === "RESERVED" || table.status === "OUT_OF_SERVICE") {
    return NextResponse.json({ success: false, error: "โต๊ะนี้ยังไม่พร้อมให้บริการ" }, { status: 409 });
  }
  if (
    table.branch.status !== "ACTIVE" ||
    table.branch.restaurant.status !== "ACTIVE" ||
    !isRestaurantOpen(table.branch.openingHours)
  ) {
    return NextResponse.json(
      { success: false, error: `ขณะนี้ร้านปิดให้บริการ (${table.branch.openingHours || "โปรดสอบถามพนักงาน"})` },
      { status: 409 }
    );
  }

  try {
    const order = await createOrder({
      ...parsed.data,
      branchId: table.branchId,
      tableId: table.id,
    });
    return NextResponse.json(
      { success: true, data: order, message: "สั่งอาหารสำเร็จ ออเดอร์ถูกส่งไปยังห้องครัวแล้ว" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "ไม่สามารถสร้างออเดอร์ได้" },
      { status: 400 }
    );
  }
}
