import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "ไม่ได้เข้าสู่ระบบ" }, { status: 401 });
  }
  return NextResponse.json({ success: true, data: session });
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "ออกจากระบบสำเร็จ" });
  response.cookies.delete("auth_token");
  return response;
}
