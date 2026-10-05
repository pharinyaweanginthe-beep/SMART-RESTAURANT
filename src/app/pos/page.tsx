"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  UserCheck,
  Tag,
  CheckCircle2,
  Table as TableIcon,
  UtensilsCrossed,
} from "lucide-react";
import { ReceiptModal } from "@/components/ReceiptModal";

interface Table {
  id: string;
  branchId: string;
  number: string;
  capacity: number;
  status: string;
  orders: any[];
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialNotes?: string;
}

export default function POSPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [memberPhone, setMemberPhone] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QR_CODE" | "CREDIT_CARD" | "OTHER">("CASH");
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Active loaded order for selected table if table already has an active order
  const [activeOrder, setActiveOrder] = useState<any>(null);

  const fetchData = async () => {
    try {
      const [tRes, mRes] = await Promise.all([fetch("/api/tables"), fetch("/api/menu")]);
      const tData = await tRes.json();
      const mData = await mRes.json();

      if (tData.success) setTables(tData.data);
      if (mData.success) {
        setMenuItems(mData.data.items);
        setCategories(mData.data.categories);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectTable = (t: Table) => {
    setSelectedTable(t);
    setCart([]);
    setDiscountCode("");
    setDiscountAmount(0);

    const active = t.orders && t.orders.length > 0 ? t.orders[0] : null;
    setActiveOrder(active);
  };

  const handleAddToCart = (item: MenuItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.menuItem.id === item.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      } else {
        return [...prev, { menuItem: item, quantity: 1 }];
      }
    });
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.menuItem.id === itemId ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchCat = !selectedCategory || item.categoryId === selectedCategory;
    const matchSearch = !searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  // Calculate totals
  const cartSubtotal = activeOrder
    ? activeOrder.subtotal
    : cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);

  const netAmount = Math.max(0, cartSubtotal - discountAmount);
  const amountPaidNum = parseFloat(amountPaidInput) || netAmount;

  const handleApplyDiscount = async () => {
    if (!discountCode) return;
    try {
      const res = await fetch(`/api/discounts?code=${discountCode}`);
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        if (cartSubtotal >= d.minPurchase) {
          if (d.type === "PERCENTAGE") {
            setDiscountAmount((cartSubtotal * d.value) / 100);
          } else {
            setDiscountAmount(d.value);
          }
          setErrorMessage("");
        } else {
          setErrorMessage(`ยอดสั่งซื้อขั้นต่ำสำหรับส่วนลดนี้คือ ฿${d.minPurchase}`);
        }
      } else {
        setErrorMessage(data.error || "โค้ดส่วนลดไม่ถูกต้อง");
      }
    } catch (err: any) {
      setErrorMessage("เกิดข้อผิดพลาดในการตรวจสอบส่วนลด");
    }
  };

  const handleProcessPayment = async () => {
    setErrorMessage("");

    let targetOrderId = activeOrder?.id;

    // If new cart items on table without active order, create order first!
    if (!targetOrderId) {
      if (!selectedTable) {
        setErrorMessage("กรุณาเลือกโต๊ะอาหารก่อนทำรายการ");
        return;
      }
      if (cart.length === 0) {
        setErrorMessage("กรุณาเลือกรายการอาหารอย่างน้อย 1 รายการ");
        return;
      }

      setIsProcessing(true);
      try {
        const orderRes = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            branchId: selectedTable.branchId || tables[0]?.branchId,
            tableId: selectedTable.id,
            customerName: "ลูกค้าแคชเชียร์",
            items: cart.map((i) => ({ menuItemId: i.menuItem.id, quantity: i.quantity })),
          }),
        });

        const orderData = await orderRes.json();
        if (!orderData.success) {
          setErrorMessage(orderData.error || "ไม่สามารถสร้างออเดอร์ได้");
          setIsProcessing(false);
          return;
        }
        targetOrderId = orderData.data.id;
      } catch (err: any) {
        setErrorMessage(err.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์");
        setIsProcessing(false);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const payRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: targetOrderId,
          paymentMethod,
          amountPaid: amountPaidNum,
          discountCode: discountCode || undefined,
          memberPhone: memberPhone || undefined,
        }),
      });

      const payData = await payRes.json();
      if (!payData.success) {
        setErrorMessage(payData.error || "เกิดข้อผิดพลาดในการชำระเงิน");
      } else {
        // Success payment! Show Receipt
        const orderInfo = payData.data.order;
        setReceiptData({
          orderNumber: orderInfo.orderNumber,
          restaurantName: "SMART RESTAURANT",
          branchName: "สาขาหลัก (สยาม)",
          tableNumber: selectedTable?.number,
          customerName: orderInfo.customerName,
          items: orderInfo.orderItems || [],
          subtotal: orderInfo.subtotal,
          discountAmount: orderInfo.discountAmount,
          netAmount: orderInfo.netAmount,
          amountPaid: amountPaidNum,
          changeAmount: payData.data.changeAmount,
          paymentMethod,
          createdAt: new Date().toISOString(),
        });

        setShowReceipt(true);
        setSelectedTable(null);
        setActiveOrder(null);
        setCart([]);
        setDiscountCode("");
        setDiscountAmount(0);
        setAmountPaidInput("");

        // Refresh tables list
        fetchData();
      }
    } catch (err: any) {
      setErrorMessage("เกิดข้อผิดพลาดทางเทคนิคในการชำระเงิน");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 font-sans overflow-hidden">
      {/* LEFT COLUMN: Table Grid */}
      <div className="w-full md:w-64 bg-white rounded-3xl p-4 border border-slate-200 shadow-card flex flex-col space-y-3 overflow-hidden">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <TableIcon className="w-4 h-4 text-electric-600" />
          <h3 className="font-bold text-xs text-navy-900">เลือกโต๊ะอาหาร (Tables)</h3>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 p-1">
          {tables.map((t) => {
            const isSelected = selectedTable?.id === t.id;
            const isOccupied = t.status === "OCCUPIED" || t.status === "WAITING_PAYMENT";
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTable(t)}
                className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                  isSelected
                    ? "bg-electric-600 text-white border-electric-600 ring-2 ring-electric-400/50 shadow-md"
                    : isOccupied
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm">โต๊ะ {t.number}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOccupied ? "bg-amber-500 animate-ping" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <div className="mt-2 text-[10px] opacity-80">
                  {isOccupied ? "มีลูกค้ากำลังรับประทาน" : "ว่างพร้อมรับลูกค้า"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* MIDDLE COLUMN: Menu Items */}
      <div className="flex-1 bg-white rounded-3xl p-4 border border-slate-200 shadow-card flex flex-col space-y-4 overflow-hidden">
        {/* Search & Categories */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อรายการอาหาร..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-electric-500 transition"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                !selectedCategory ? "bg-navy-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              ทั้งหมด
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === c.id ? "bg-navy-900 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-1">
          {filteredMenuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAddToCart(item)}
              className="bg-slate-50 border border-slate-200 hover:border-electric-400 rounded-2xl p-3 cursor-pointer transition card-hover flex flex-col justify-between"
            >
              <div className="w-full h-24 bg-slate-200 rounded-xl overflow-hidden mb-2 relative">
                <img
                  src={item.imageUrl || "/menu-items/food-placeholder.svg"}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = "/menu-items/food-placeholder.svg";
                  }}
                />
              </div>
              <div>
                <h4 className="font-bold text-xs text-navy-900 line-clamp-1">{item.name}</h4>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs font-bold text-electric-600">฿{item.price}</span>
                  <button className="p-1 rounded-lg bg-electric-50 text-electric-600 hover:bg-electric-600 hover:text-white transition">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Cart & Payment */}
      <div className="w-full md:w-96 bg-navy-950 text-white rounded-3xl p-5 border border-navy-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Cart Header */}
        <div className="space-y-2 border-b border-navy-800 pb-3">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-electric-400" />
              <span>สรุปรายการสั่งซื้อ</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-navy-800 text-electric-400 border border-electric-500/30">
              {selectedTable ? `โต๊ะ ${selectedTable.number}` : "ยังไม่ได้เลือกโต๊ะ"}
            </span>
          </div>

          {activeOrder && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300">
              กำลังชำระเงินออเดอร์เดิม #{activeOrder.orderNumber}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2 my-1">
          {activeOrder ? (
            activeOrder.orderItems?.map((i: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2 bg-navy-900 rounded-xl border border-navy-800">
                <div>
                  <p className="font-semibold text-white">{i.menuItem.name}</p>
                  <p className="text-[10px] text-slate-400">฿{i.price} x {i.quantity}</p>
                </div>
                <span className="font-bold text-electric-400">฿{i.price * i.quantity}</span>
              </div>
            ))
          ) : cart.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center">
              <UtensilsCrossed className="w-8 h-8 text-navy-800 mb-2" />
              ยังไม่มีรายการอาหารในตะกร้า
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.menuItem.id} className="flex justify-between items-center text-xs p-2.5 bg-navy-900 rounded-xl border border-navy-800">
                <div className="truncate pr-2">
                  <p className="font-semibold text-white truncate">{item.menuItem.name}</p>
                  <p className="text-[10px] text-electric-400">฿{item.menuItem.price}</p>
                </div>
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleQuantityChange(item.menuItem.id, -1)}
                    className="p-1 rounded bg-navy-800 text-slate-300 hover:bg-navy-700"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.menuItem.id, 1)}
                    className="p-1 rounded bg-navy-800 text-slate-300 hover:bg-navy-700"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Discounts & Member Inputs */}
        <div className="space-y-2 border-t border-navy-800 pt-3 text-xs">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                placeholder="โค้ดส่วนลด (WELCOME10)"
                className="w-full pl-8 pr-2 py-1.5 bg-navy-900 border border-navy-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-electric-500"
              />
            </div>
            <button
              onClick={handleApplyDiscount}
              className="px-3 py-1.5 bg-gold-600 hover:bg-gold-500 text-white font-bold rounded-xl text-[11px] transition"
            >
              ใช้โค้ด
            </button>
          </div>

          <div className="relative">
            <UserCheck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={memberPhone}
              onChange={(e) => setMemberPhone(e.target.value)}
              placeholder="เบอร์โทรสมาชิกสะสมแต้ม"
              className="w-full pl-8 pr-2 py-1.5 bg-navy-900 border border-navy-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-electric-500"
            />
          </div>

          {errorMessage && <p className="text-[10px] text-red-400 mt-1">{errorMessage}</p>}
        </div>

        {/* Calculation Summary */}
        <div className="space-y-1.5 border-t border-navy-800 pt-3 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>ยอดรวมสินค้า:</span>
            <span>฿{cartSubtotal.toLocaleString()}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-gold-400 font-semibold">
              <span>ส่วนลด:</span>
              <span>-฿{discountAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-navy-800">
            <span>ยอดชำระสุทธิ:</span>
            <span className="text-electric-400 text-base">฿{netAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-1.5 text-[11px]">
            <button
              onClick={() => setPaymentMethod("CASH")}
              className={`py-2 rounded-xl border flex flex-col items-center justify-center font-bold transition ${
                paymentMethod === "CASH" ? "bg-electric-600 text-white border-electric-500" : "bg-navy-900 text-slate-400 border-navy-800"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 mb-0.5" />
              <span>เงินสด</span>
            </button>
            <button
              onClick={() => setPaymentMethod("QR_CODE")}
              className={`py-2 rounded-xl border flex flex-col items-center justify-center font-bold transition ${
                paymentMethod === "QR_CODE" ? "bg-electric-600 text-white border-electric-500" : "bg-navy-900 text-slate-400 border-navy-800"
              }`}
            >
              <QrCode className="w-3.5 h-3.5 mb-0.5" />
              <span>สแกน QR</span>
            </button>
            <button
              onClick={() => setPaymentMethod("CREDIT_CARD")}
              className={`py-2 rounded-xl border flex flex-col items-center justify-center font-bold transition ${
                paymentMethod === "CREDIT_CARD" ? "bg-electric-600 text-white border-electric-500" : "bg-navy-900 text-slate-400 border-navy-800"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 mb-0.5" />
              <span>บัตรเครดิต</span>
            </button>
          </div>

          <div className="flex space-x-2">
            <input
              type="number"
              value={amountPaidInput}
              onChange={(e) => setAmountPaidInput(e.target.value)}
              placeholder={`จำนวนเงินรับ (ขั้นต่ำ ฿${netAmount})`}
              className="flex-1 px-3 py-2 bg-navy-900 border border-navy-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-electric-500"
            />
          </div>

          <button
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isProcessing ? "กำลังทำรายการ..." : "ยืนยันการชำระเงิน & ออกใบเสร็จ"}</span>
          </button>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal isOpen={showReceipt} onClose={() => setShowReceipt(false)} data={receiptData} />
    </div>
  );
}
