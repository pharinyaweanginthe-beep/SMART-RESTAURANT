import { prisma } from "@/lib/prisma";
import { realtimeHub, EVENT_INVENTORY_LOW } from "@/lib/realtime";

export async function checkStockForMenuItem(menuItemId: string, quantity: number) {
  const recipe = await prisma.recipe.findUnique({
    where: { menuItemId },
    include: {
      items: {
        include: {
          ingredient: {
            include: {
              inventory: true,
            },
          },
        },
      },
    },
  });

  if (!recipe || recipe.items.length === 0) {
    return { success: true, insufficientItems: [] };
  }

  const insufficientItems: {
    ingredientName: string;
    required: number;
    available: number;
    unit: string;
  }[] = [];

  for (const item of recipe.items) {
    const requiredTotal = item.quantityRequired * quantity;
    const currentStock = item.ingredient.inventory?.quantity || 0;
    if (currentStock < requiredTotal) {
      insufficientItems.push({
        ingredientName: item.ingredient.name,
        required: requiredTotal,
        available: currentStock,
        unit: item.ingredient.unit,
      });
    }
  }

  return {
    success: insufficientItems.length === 0,
    insufficientItems,
  };
}

export async function deductInventoryForOrder(orderId: string, userId?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          menuItem: {
            include: {
              recipe: {
                include: {
                  items: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const lowStockAlerts: {
    ingredientId: string;
    ingredientName: string;
    currentQuantity: number;
    minStock: number;
    unit: string;
  }[] = [];

  for (const item of order.orderItems) {
    const recipe = item.menuItem.recipe;
    if (!recipe) continue;

    for (const recipeItem of recipe.items) {
      const deductAmount = recipeItem.quantityRequired * item.quantity;

      const inventory = await prisma.inventory.findUnique({
        where: { ingredientId: recipeItem.ingredientId },
        include: { ingredient: true },
      });

      if (inventory) {
        const newQty = Math.max(0, inventory.quantity - deductAmount);

        await prisma.inventory.update({
          where: { id: inventory.id },
          data: {
            quantity: newQty,
            lastUpdated: new Date(),
          },
        });

        await prisma.inventoryTransaction.create({
          data: {
            inventoryId: inventory.id,
            type: "OUT",
            amount: deductAmount,
            note: `ตัดสต็อกอัตโนมัติจากออเดอร์ #${order.orderNumber} (${item.menuItem.name} x${item.quantity})`,
            performedBy: userId || null,
          },
        });

        if (newQty <= inventory.ingredient.minStock) {
          lowStockAlerts.push({
            ingredientId: inventory.ingredient.id,
            ingredientName: inventory.ingredient.name,
            currentQuantity: newQty,
            minStock: inventory.ingredient.minStock,
            unit: inventory.ingredient.unit,
          });
        }
      }
    }
  }

  if (lowStockAlerts.length > 0) {
    realtimeHub.emit(EVENT_INVENTORY_LOW, { alerts: lowStockAlerts });
  }

  return { success: true, alerts: lowStockAlerts };
}
