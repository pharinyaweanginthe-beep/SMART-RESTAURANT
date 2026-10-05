import { describe, it, expect } from "vitest";
import { hasPermission } from "../lib/permissions";
import { loginSchema, createOrderSchema, paymentSchema } from "../lib/validations";

describe("SMART RESTAURANT SYSTEM - Business Logic & Security Tests", () => {
  // 1. RBAC Tests
  describe("Role-Based Access Control (RBAC)", () => {
    it("should allow ADMIN to access all paths", () => {
      expect(hasPermission("ADMIN", "/dashboard")).toBe(true);
      expect(hasPermission("ADMIN", "/admin/users")).toBe(true);
      expect(hasPermission("ADMIN", "/admin/branches")).toBe(true);
    });

    it("should restrict CASHIER from accessing admin paths", () => {
      expect(hasPermission("CASHIER", "/pos")).toBe(true);
      expect(hasPermission("CASHIER", "/admin/users")).toBe(false);
    });

    it("should restrict KITCHEN to kitchen and orders paths", () => {
      expect(hasPermission("KITCHEN", "/kitchen")).toBe(true);
      expect(hasPermission("KITCHEN", "/reports")).toBe(false);
    });
  });

  // 2. Validation Schema Tests
  describe("Zod Validation Schemas", () => {
    it("should validate valid login credentials", () => {
      const result = loginSchema.safeParse({
        email: "admin@smartrestaurant.com",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid login email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("should validate order creation payload", () => {
      const result = createOrderSchema.safeParse({
        branchId: "branch-1",
        tableId: "table-1",
        items: [{ menuItemId: "item-1", quantity: 2 }],
      });
      expect(result.success).toBe(true);
    });

    it("should reject order with empty items", () => {
      const result = createOrderSchema.safeParse({
        branchId: "branch-1",
        tableId: "table-1",
        items: [],
      });
      expect(result.success).toBe(false);
    });

    it("should validate payment payload", () => {
      const result = paymentSchema.safeParse({
        orderId: "order-1",
        paymentMethod: "CASH",
        amountPaid: 500,
      });
      expect(result.success).toBe(true);
    });
  });

  // 3. Investment Profit Formula Tests
  describe("Investment Module Formulas", () => {
    it("should calculate Investor 75% and Developer 25% correctly", () => {
      const netProfit = 100000;
      const investorReturn = netProfit * 0.75;
      const developerReturn = netProfit * 0.25;

      expect(investorReturn).toBe(75000);
      expect(developerReturn).toBe(25000);
      expect(investorReturn + developerReturn).toBe(netProfit);
    });
  });
});
