import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบเพื่อดูเมนูโปรด" }, { status: 401 });
  const favorites = await prisma.favoriteMenuItem.findMany({
    where: { userId: session.id },
    include: { menuItem: { include: { category: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ success: true, data: favorites });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบเพื่อบันทึกเมนูโปรด" }, { status: 401 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const parsed = z.object({ menuItemId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "กรุณาระบุเมนู" }, { status: 400 });
  const item = await prisma.menuItem.findFirst({
    where: {
      id: parsed.data.menuItemId,
      status: "ACTIVE",
      ...(session.branchId ? { branchId: session.branchId } : {}),
    },
    select: { id: true },
  });
  if (!item) return NextResponse.json({ success: false, error: "ไม่พบเมนูในสาขาที่ใช้งาน" }, { status: 404 });
  const favorite = await prisma.favoriteMenuItem.upsert({
    where: { userId_menuItemId: { userId: session.id, menuItemId: item.id } },
    create: { userId: session.id, menuItemId: item.id },
    update: {},
  });
  return NextResponse.json({ success: true, data: favorite }, { status: 201 });
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "กรุณาเข้าสู่ระบบเพื่อแก้ไขเมนูโปรด" }, { status: 401 });
  const menuItemId = new URL(request.url).searchParams.get("menuItemId");
  if (!menuItemId) return NextResponse.json({ success: false, error: "กรุณาระบุเมนู" }, { status: 400 });
  await prisma.favoriteMenuItem.deleteMany({ where: { userId: session.id, menuItemId } });
  return NextResponse.json({ success: true });
}
