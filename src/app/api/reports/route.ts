import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today"; // today, yesterday, 7days, 30days
    const branchId = searchParams.get("branchId") || undefined;

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (range === "yesterday") {
      startDate.setDate(startDate.getDate() - 1);
    } else if (range === "7days") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "30days") {
      startDate.setDate(startDate.getDate() - 30);
    }

    const endDate = new Date();
    if (range === "yesterday") {
      endDate.setDate(endDate.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
    }

    const where: any = {
      paymentStatus: "PAID",
      createdAt: { gte: startDate, lte: endDate },
    };
    if (branchId) where.branchId = branchId;

    const orders = await prisma.order.findMany({
      where,
      include: {
        payment: true,
        orderItems: { include: { menuItem: true } },
        table: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = orders.reduce((s, o) => s + o.netAmount, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Payment method breakdown
    const paymentMethods: Record<string, number> = {
      CASH: 0,
      QR_CODE: 0,
      CREDIT_CARD: 0,
      OTHER: 0,
    };

    for (const o of orders) {
      if (o.payment) {
        paymentMethods[o.payment.paymentMethod] =
          (paymentMethods[o.payment.paymentMethod] || 0) + o.netAmount;
      }
    }

    // Best selling items calculation
    const itemMap = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const item of o.orderItems) {
        const current = itemMap.get(item.menuItemId) || {
          name: item.menuItem.name,
          qty: 0,
          revenue: 0,
        };
        current.qty += item.quantity;
        current.revenue += item.price * item.quantity;
        itemMap.set(item.menuItemId, current);
      }
    }

    const bestSelling = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
        },
        paymentMethods,
        bestSelling,
        orders,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
