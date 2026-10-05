import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { isRestaurantOpen } from "@/lib/customer-utils";
export { isRestaurantOpen } from "@/lib/customer-utils";
export async function resolveCustomerTable(tableRef: string, qrToken: string | null) {
  if (!qrToken) return null;

  const table = await prisma.table.findFirst({
    where: { OR: [{ id: tableRef }, { number: tableRef }] },
    include: { branch: { include: { restaurant: true } } },
  });
  if (!table || !table.qrToken) return null;

  const storedToken = Buffer.from(table.qrToken);
  const suppliedToken = Buffer.from(qrToken);
  if (storedToken.length !== suppliedToken.length || !timingSafeEqual(storedToken, suppliedToken)) {
    return null;
  }

  return table;
}
