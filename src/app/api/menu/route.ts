import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { menuItemSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get("branchId");
    const categoryId = searchParams.get("categoryId");

    const where: any = { status: "ACTIVE" };
    if (branchId) where.branchId = branchId;
    if (categoryId) where.categoryId = categoryId;

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        recipe: {
          include: {
            items: { include: { ingredient: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const categories = await prisma.category.findMany({
      where: branchId ? { branchId } : {},
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ success: true, data: { items: menuItems, categories } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = menuItemSchema.parse(body);

    const newItem = await prisma.menuItem.create({
      data: validated,
    });

    return NextResponse.json({ success: true, data: newItem, message: "เพิ่มเมนูอาหารสำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
