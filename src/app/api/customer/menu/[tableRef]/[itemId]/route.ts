import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen, resolveCustomerTable } from "@/services/customer.service";
import { checkStockForMenuItem } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: { tableRef: string; itemId: string } }
) {
  const { searchParams } = new URL(request.url);
  const table = await resolveCustomerTable(params.tableRef, searchParams.get("qr"));
  if (!table) {
    return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  }

  const item = await prisma.menuItem.findFirst({
    where: { id: params.itemId, branchId: table.branchId, status: "ACTIVE" },
    include: { category: true, options: { where: { isAvailable: true } } },
  });
  if (!item) {
    return NextResponse.json({ success: false, error: "ไม่พบเมนูนี้ในสาขาที่เลือก" }, { status: 404 });
  }
  const stock = await checkStockForMenuItem(item.id, 1);
  return NextResponse.json({
    success: true,
    data: {
      item: { ...item, availableNow: item.isAvailable && stock.success },
      restaurantName: table.branch.restaurant.name,
      tableNumber: table.number,
      isOpen:
        table.branch.status === "ACTIVE" &&
        table.branch.restaurant.status === "ACTIVE" &&
        isRestaurantOpen(table.branch.openingHours),
    },
  });
}
