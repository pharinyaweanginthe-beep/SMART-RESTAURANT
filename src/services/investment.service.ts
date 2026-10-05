import { prisma } from "@/lib/prisma";

export interface FinancialCalculationResult {
  salesTarget: number;
  actualRevenue: number;
  actualCost: number | null;
  actualExpense: number | null;
  netProfit: number | null;
  investorReturn: number | null;
  developerReturn: number | null;
  isRealDataAvailable: boolean;
}

export async function getInvestmentFinancialData(branchId?: string): Promise<FinancialCalculationResult> {
  const whereBranch = branchId ? { branchId } : {};

  // Fetch actual paid orders
  const paidOrders = await prisma.order.findMany({
    where: {
      ...whereBranch,
      paymentStatus: "PAID",
    },
    include: {
      orderItems: {
        include: {
          menuItem: {
            include: {
              recipe: {
                include: {
                  items: {
                    include: { ingredient: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const actualRevenue = paidOrders.reduce((sum, o) => sum + o.netAmount, 0);

  // Calculate actual cost based on BOM ingredient costPerUnit
  let actualCost = 0;
  let hasRecipeCostData = false;

  for (const order of paidOrders) {
    for (const item of order.orderItems) {
      const recipe = item.menuItem.recipe;
      if (recipe && recipe.items.length > 0) {
        hasRecipeCostData = true;
        for (const rItem of recipe.items) {
          actualCost += rItem.quantityRequired * item.quantity * rItem.ingredient.costPerUnit;
        }
      }
    }
  }

  // Operating expenses (Operational costs if logged in DB)
  // For demo, if no expense entries exist in DB, actualExpense will be null
  const actualExpense: number | null = null; // "ยังไม่ได้กำหนด"

  const salesTarget = 28000000; // ฿28,000,000 presentation target

  if (!hasRecipeCostData || actualExpense === null) {
    return {
      salesTarget,
      actualRevenue,
      actualCost: hasRecipeCostData ? actualCost : null,
      actualExpense: null,
      netProfit: null,
      investorReturn: null,
      developerReturn: null,
      isRealDataAvailable: false,
    };
  }

  const netProfit = actualRevenue - actualCost - actualExpense;
  const investorReturn = netProfit * 0.75;
  const developerReturn = netProfit * 0.25;

  return {
    salesTarget,
    actualRevenue,
    actualCost,
    actualExpense,
    netProfit,
    investorReturn,
    developerReturn,
    isRealDataAvailable: true,
  };
}
