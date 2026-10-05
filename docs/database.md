# Database Schema - SMART RESTAURANT MANAGEMENT SYSTEM

## Database Entities
- **Restaurant**: Main restaurant enterprise entity
- **Branch**: Restaurant branch locations (Multi-Branch support)
- **User**: System users with role credentials
- **Table**: Restaurant dining tables with capacity and status
- **Category**: Menu categories (Thai, Drinks, Single Dish, Desserts, Appetizers)
- **MenuItem**: Food and drink items with prices and photos
- **Supplier**: Ingredient vendors
- **Ingredient**: Raw ingredients with SKU, unit, min stock threshold
- **Recipe & RecipeItem**: Bill of Materials (BOM) linking MenuItem to Ingredients for automatic stock deduction
- **Inventory & InventoryTransaction**: Stock quantities and audit logs (IN, OUT, ADJUSTMENT)
- **Customer & MemberPoint**: Customer profile and loyalty points system
- **Discount**: Promotion codes and percentage/fixed discount rules
- **Order & OrderItem**: Master orders and line items
- **Payment**: Payment transactions and printable receipt records
- **MenuItemOption**: Database-backed single/multiple modifier choices and their added prices
- **FavoriteMenuItem**: Menu favorites owned by an authenticated User
- **StaffRequest**: Customer calls, water, and cutlery requests attached to a branch and table
- **BillRequest**: Customer bill requests with REQUESTED → PROCESSING → PAID → COMPLETED states

`Table.qrToken` is a unique, unguessable token. QR URLs contain the table number and this token; customer APIs resolve the table and branch on the server and reject missing or mismatched tokens.
