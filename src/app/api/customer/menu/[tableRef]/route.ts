import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen, resolveCustomerTable } from "@/services/customer.service";
import { checkStockForMenuItem } from "@/services/inventory.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: { tableRef: string } }) {
  const { searchParams } = new URL(request.url);
  const table = await resolveCustomerTable(params.tableRef, searchParams.get("qr"));
  if (!table) {
    return NextResponse.json({ success: false, error: "QR Code ไม่ถูกต้องหรือไม่พบโต๊ะนี้" }, { status: 404 });
  }
  if (table.status === "OUT_OF_SERVICE" || table.status === "RESERVED") {
    return NextResponse.json({ success: false, error: "โต๊ะนี้ยังไม่พร้อมให้บริการ" }, { status: 409 });
  }

  const query = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("category") || undefined;
  const sort = searchParams.get("sort");
  const availableOnly = searchParams.get("available") === "true";

  try {
    const [menuItems, categories, promotions] = await Promise.all([
      prisma.menuItem.findMany({
        where: {
          branchId: table.branchId,
          status: "ACTIVE",
          ...(categoryId ? { categoryId } : {}),
          ...(query
            ? {
                OR: [
                  { name: { contains: query } },
                  { description: { contains: query } },
                  { category: { name: { contains: query } } },
                ],
              }
            : {}),
        },
        include: { category: true, options: { where: { isAvailable: true } } },
        orderBy:
          sort === "price-asc"
            ? { price: "asc" }
            : sort === "price-desc"
              ? { price: "desc" }
              : { name: "asc" },
      }),
      prisma.category.findMany({
        where: { branchId: table.branchId, status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.discount.findMany({
        where: {
          status: "ACTIVE",
          OR: [{ branchId: null }, { branchId: table.branchId }],
          startDate: { lte: new Date() },
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    const availability = await Promise.all(
      menuItems.map(async (item) => {
        const stock = await checkStockForMenuItem(item.id, 1);
        return { itemId: item.id, availableNow: item.isAvailable && stock.success };
      })
    );
    const availableById = new Map(availability.map((item) => [item.itemId, item.availableNow]));
    const popularityRows = await prisma.orderItem.groupBy({
      by: ["menuItemId"],
      where: { order: { branchId: table.branchId, status: { not: "CANCELLED" } } },
      _sum: { quantity: true },
    });
    const popularity = new Map(
      popularityRows.map((row) => [row.menuItemId, row._sum.quantity || 0])
    );
    let customerItems = menuItems.map((item) => ({
      ...item,
      availableNow: availableById.get(item.id) || false,
      popularity: popularity.get(item.id) || 0,
    }));
    if (availableOnly) customerItems = customerItems.filter((item) => item.availableNow);
    if (sort === "popular") customerItems.sort((a, b) => b.popularity - a.popularity);
    if (sort === "new") customerItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    if (sort === "featured") customerItems.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured));

    return NextResponse.json({
      success: true,
      data: {
        restaurant: table.branch.restaurant,
        branch: {
          id: table.branchId,
          name: table.branch.name,
          openingHours: table.branch.openingHours,
          isOpen:
            table.branch.status === "ACTIVE" &&
            table.branch.restaurant.status === "ACTIVE" &&
            isRestaurantOpen(table.branch.openingHours),
        },
        table: { id: table.id, number: table.number, status: table.status },
        items: customerItems,
        categories,
        promotions,
      },
    });
  } catch (error) {
    console.error("Failed to load customer menu:", error);
    return NextResponse.json({ success: false, error: "ไม่สามารถโหลดเมนูได้" }, { status: 500 });
  }
}
