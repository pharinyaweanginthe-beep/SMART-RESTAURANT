import { prisma } from "@/lib/prisma";

export async function getDashboardData(branchId?: string) {
  const whereBranch = branchId ? { branchId } : {};

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // 1. Today's Completed Paid Orders
  const todayOrders = await prisma.order.findMany({
    where: {
      ...whereBranch,
      paymentStatus: "PAID",
      createdAt: { gte: todayStart },
    },
  });

  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.netAmount, 0);
  const totalOrdersCount = todayOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? todayRevenue / totalOrdersCount : 0;

  // 2. Tables Status
  const totalTables = await prisma.table.count({ where: whereBranch });
  const occupiedTables = await prisma.table.count({
    where: { ...whereBranch, status: { in: ["OCCUPIED", "WAITING_PAYMENT"] } },
  });

  // 3. Low Stock Alert Count
  const inventories = await prisma.inventory.findMany({
    where: whereBranch,
    include: { ingredient: true },
  });

  const lowStockCount = inventories.filter(
    (inv) => inv.quantity <= inv.ingredient.minStock
  ).length;

  // 4. Top Selling Menu Items
  const paidOrderItems = await prisma.orderItem.findMany({
    where: {
      order: {
        ...whereBranch,
        paymentStatus: "PAID",
      },
    },
    include: { menuItem: true },
  });

  const itemMap = new Map<string, { name: string; totalQty: number; totalRevenue: number }>();

  for (const item of paidOrderItems) {
    const existing = itemMap.get(item.menuItemId) || {
      name: item.menuItem.name,
      totalQty: 0,
      totalRevenue: 0,
    };
    existing.totalQty += item.quantity;
    existing.totalRevenue += item.price * item.quantity;
    itemMap.set(item.menuItemId, existing);
  }

  const topSelling = Array.from(itemMap.values())
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 5);

  // 5. Recent 10 Orders Feed
  const recentOrders = await prisma.order.findMany({
    where: whereBranch,
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      table: true,
      orderItems: { include: { menuItem: true } },
    },
  });

  // 6. Last 7 Days Sales Trend
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const pastWeekOrders = await prisma.order.findMany({
    where: {
      ...whereBranch,
      paymentStatus: "PAID",
      createdAt: { gte: sevenDaysAgo },
    },
  });

  const salesTrend: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
    salesTrend[dateStr] = 0;
  }

  for (const o of pastWeekOrders) {
    const dateStr = new Date(o.createdAt).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
    });
    if (salesTrend[dateStr] !== undefined) {
      salesTrend[dateStr] += o.netAmount;
    }
  }

  const chartData = Object.entries(salesTrend).map(([date, sales]) => ({
    date,
    sales,
  }));

  return {
    kpi: {
      todayRevenue,
      totalOrdersCount,
      avgOrderValue,
      totalTables,
      occupiedTables,
      lowStockCount,
    },
    topSelling,
    recentOrders,
    chartData,
  };
}
