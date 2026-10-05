import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveCustomerTable } from "@/services/customer.service";
import { validateDiscount } from "@/services/order.service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tableRef = searchParams.get("table");
  const code = searchParams.get("code") || "";
  const subtotal = Number(searchParams.get("subtotal"));
  const parsed = z.number().finite().nonnegative().safeParse(subtotal);
  const table = tableRef ? await resolveCustomerTable(tableRef, searchParams.get("qr")) : null;
  if (!table) return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  if (!code || !parsed.success) {
    return NextResponse.json({ success: false, error: "กรุณาระบุโค้ดส่วนลดและยอดสั่งซื้อ" }, { status: 400 });
  }
  try {
    const discount = await validateDiscount(table.branchId, subtotal, code);
    return NextResponse.json({ success: true, data: discount });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "โค้ดส่วนลดใช้ไม่ได้" },
      { status: 400 }
    );
  }
}
