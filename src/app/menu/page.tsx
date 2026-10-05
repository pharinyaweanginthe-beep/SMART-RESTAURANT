"use client";

import { useEffect, useState } from "react";
import { UtensilsCrossed, Plus, Search, Edit2, Trash2, CheckCircle2, XCircle } from "lucide-react";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  isAvailable: boolean;
  category?: { name: string };
}

interface Category {
  id: string;
  name: string;
}

export default function MenuManagementPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formAvailable, setFormAvailable] = useState(true);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        setItems(data.data.items);
        setCategories(data.data.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormDesc("");
    setFormPrice("");
    setFormCategory(categories[0]?.id || "");
    setFormImageUrl("");
    setFormAvailable(true);
    setShowModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description || "");
    setFormPrice(String(item.price));
    setFormCategory(item.categoryId);
    setFormImageUrl(item.imageUrl || "");
    setFormAvailable(item.isAvailable);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      branchId: categories[0] ? items[0]?.categoryId : "",
      categoryId: formCategory,
      name: formName,
      description: formDesc,
      price: parseFloat(formPrice),
      imageUrl: formImageUrl || undefined,
      isAvailable: formAvailable,
    };

    try {
      if (editingItem) {
        await fetch(`/api/menu/${editingItem.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/menu", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, branchId: categories[0] ? (items[0] as any)?.branchId : "" }),
        });
      }
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?")) return;
    try {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
      fetchMenu();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredItems = items.filter((i) => {
    const matchCat = !selectedCategory || i.categoryId === selectedCategory;
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-medium animate-pulse">กำลังโหลดรายการเมนู...</div>;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-navy-900 flex items-center space-x-2">
            <UtensilsCrossed className="w-6 h-6 text-electric-600" />
            <span>จัดการรายการอาหาร (Menu Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">เพิ่ม แก้ไข ลบ และตั้งค่าพร้อมขายประจำร้าน</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-electric-600 hover:bg-electric-700 text-white font-bold rounded-2xl text-xs flex items-center space-x-2 shadow-lg shadow-electric-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มเมนูใหม่</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อเมนูอาหาร..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
        >
          <option value="">ทุกหมวดหมู่ (All Categories)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between">
            <div className="h-40 bg-slate-100 relative">
              <img
                src={item.imageUrl || "/menu-items/food-placeholder.svg"}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/menu-items/food-placeholder.svg";
                }}
              />
              <span className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-navy-950/80 text-white backdrop-blur">
                {item.category?.name}
              </span>
            </div>

            <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-navy-900">{item.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-sm font-bold text-electric-600">฿{item.price}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.isAvailable ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {item.isAvailable ? "พร้อมขาย" : "สินค้าหมด"}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-electric-600 transition"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-600 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-navy-900">{editingItem ? "แก้ไขเมนูอาหาร" : "เพิ่มเมนูอาหารใหม่"}</h3>

            <div>
              <label className="block text-xs font-semibold mb-1">ชื่ออาหาร</label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">หมวดหมู่</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">ราคา (บาท)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">รายละเอียด</label>
              <textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">URL รูปภาพ</label>
              <input
                type="text"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="avail"
                checked={formAvailable}
                onChange={(e) => setFormAvailable(e.target.checked)}
                className="rounded text-electric-600"
              />
              <label htmlFor="avail" className="text-xs font-semibold text-slate-700">
                พร้อมจำหน่าย (Available)
              </label>
            </div>

            <div className="flex space-x-3 pt-3">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-electric-600 text-white font-bold rounded-xl text-xs hover:bg-electric-700 transition"
              >
                บันทึก
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-300 transition"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
