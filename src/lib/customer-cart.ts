export interface CustomerCartOption {
  id: string;
  groupName: string;
  name: string;
  price: number;
}

export interface CustomerCartItem {
  menuItemId: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  quantity: number;
  specialNotes: string;
  selectedOptions: CustomerCartOption[];
}

export function customerCartKey(tableRef: string) {
  return `smart-restaurant-customer-cart:${tableRef}`;
}

export function readCustomerCart(tableRef: string): CustomerCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(customerCartKey(tableRef));
    if (!value) return [];
    const cart: unknown = JSON.parse(value);
    return Array.isArray(cart) ? (cart as CustomerCartItem[]) : [];
  } catch {
    return [];
  }
}

export function writeCustomerCart(tableRef: string, cart: CustomerCartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(customerCartKey(tableRef), JSON.stringify(cart));
  window.dispatchEvent(new CustomEvent("customer-cart-updated", { detail: { tableRef } }));
}

export function customerCartItemTotal(item: CustomerCartItem) {
  const unitPrice = item.basePrice + item.selectedOptions.reduce((sum, option) => sum + option.price, 0);
  return unitPrice * item.quantity;
}

export function customerCartTotal(cart: CustomerCartItem[]) {
  return cart.reduce((sum, item) => sum + customerCartItemTotal(item), 0);
}
