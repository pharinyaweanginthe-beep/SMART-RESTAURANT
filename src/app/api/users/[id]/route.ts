import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, hashPassword } from "@/lib/auth";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "ไม่มีสิทธิ์ในการแก้ไขผู้ใช้งาน" }, { status: 403 });
    }

    const body = await request.json();

    // Prevent changing own role
    if (session.id === params.id && body.role && body.role !== session.role) {
      return NextResponse.json({ success: false, error: "ห้ามแก้ไขบทบาท (Role) ของตัวเอง" }, { status: 400 });
    }

    const updateData: any = {};
    if (body.name) updateData.name = body.name;
    if (body.role) updateData.role = body.role;
    if (body.status) updateData.status = body.status;
    if (body.branchId) updateData.branchId = body.branchId;
    if (body.password) {
      updateData.password = await hashPassword(body.password);
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: updated, message: "อัปเดตข้อมูลผู้ใช้สำเร็จ" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
