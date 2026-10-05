# System Architecture - SMART RESTAURANT MANAGEMENT SYSTEM

## 1. Overview
SMART RESTAURANT MANAGEMENT SYSTEM (ระบบบริหารจัดการร้านอาหารอัจฉริยะ) is designed as a modern, high-performance, real-time enterprise SaaS application.

```mermaid
graph TD
    Customer[Customer Mobile Device] -->|Scan QR / Menu| NextApp[Next.js App Router API & UI]
    POS[Cashier POS Terminal] -->|Orders & Payments| NextApp
    Kitchen[Kitchen KDS Tablet/Display] -->|Real-Time Order Tracking| NextApp
    Manager[Manager / Admin Dashboard] -->|Reports & Inventory| NextApp

    NextApp -->|Prisma ORM| Database[(PostgreSQL / SQLite)]
    NextApp -->|SSE Realtime Hub| LiveClients[Live Updates Push]
```

## 2. Core Modules
- **Customer QR Ordering System**: `/menu/[tableId]`
- **Real-Time Order Tracking**: `/order/[orderId]`
- **POS Cashier System**: `/pos`
- **Kitchen Display System (KDS)**: `/kitchen`
- **Table Management**: `/tables`
- **Inventory & BOM Recipe Stock Deduction**: `/inventory`
- **Executive Dashboard & Analytics**: `/dashboard`
- **Financial & Sales Reports**: `/reports`
- **Investment & Profit Sharing Module**: `/investment`
- **User & Multi-Branch Management**: `/admin/users`, `/admin/branches`
