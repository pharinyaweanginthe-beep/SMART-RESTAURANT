import { describe, expect, it } from "vitest";
import { customerCartTotal, type CustomerCartItem } from "../lib/customer-cart";
import { customerOrderSchema } from "../lib/validations";
import { isRestaurantOpen } from "../lib/customer-utils";

describe("Customer ordering", () => {
  it("calculates cart totals with option prices and quantities", () => {
    const cart: CustomerCartItem[] = [
      {
        menuItemId: "kaprao",
        name: "กะเพราไก่",
        basePrice: 59,
        quantity: 2,
        specialNotes: "",
        selectedOptions: [{ id: "egg", groupName: "เพิ่มเติม", name: "ไข่ดาว", price: 15 }],
      },
      {
        menuItemId: "tea",
        name: "ชาไทย",
        basePrice: 45,
        quantity: 1,
        specialNotes: "",
        selectedOptions: [],
      },
    ];
    expect(customerCartTotal(cart)).toBe(193);
  });

  it("requires a QR token and positive integer quantities for customer orders", () => {
    expect(
      customerOrderSchema.safeParse({
        table: "T01",
        qr: "private-qr-token",
        items: [{ menuItemId: "menu-1", quantity: 1 }],
      }).success
    ).toBe(true);
    expect(
      customerOrderSchema.safeParse({
        table: "T01",
        qr: "",
        items: [{ menuItemId: "menu-1", quantity: 1 }],
      }).success
    ).toBe(false);
    expect(
      customerOrderSchema.safeParse({
        table: "T01",
        qr: "private-qr-token",
        items: [{ menuItemId: "menu-1", quantity: 0 }],
      }).success
    ).toBe(false);
  });

  it("evaluates configured opening hours including after-midnight ranges", () => {
    const open = new Date();
    open.setHours(12, 0, 0, 0);
    expect(isRestaurantOpen("10:00 - 22:00", open)).toBe(true);
    expect(isRestaurantOpen("22:00 - 06:00", open)).toBe(false);
    open.setHours(23, 0, 0, 0);
    expect(isRestaurantOpen("22:00 - 06:00", open)).toBe(true);
  });
});
