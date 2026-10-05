import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "SMART RESTAURANT MANAGEMENT SYSTEM - ระบบบริหารจัดการร้านอาหารอัจฉริยะ",
  description: "ระบบบริหารจัดการร้านอาหารอัจฉริยะ เชื่อมต่อ Customer QR Ordering, POS, Kitchen KDS, Inventory และ Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased text-navy-900 bg-slate-50">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
