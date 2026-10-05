# Production Deployment Guide - SMART RESTAURANT MANAGEMENT SYSTEM

## Requirements
- Node.js 18.x or 20.x+
- PostgreSQL or SQLite Database
- Production Environment Variables configured in `.env`

## Deployment Steps
1. Clone Repository & Install Dependencies:
```bash
npm install
```

2. Setup Environment Variables `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/smart_restaurant_db"
AUTH_SECRET="your_production_secure_secret"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

3. Update database schema:
```bash
npx prisma db push
```
Back up an existing database before schema changes. This repository currently uses Prisma `db push` (there is no checked-in migration history). For an existing database, add/backfill a unique `Table.qrToken` before applying the final required column:
```sql
ALTER TABLE "Table" ADD COLUMN "qrToken" TEXT;
UPDATE "Table" SET "qrToken" = lower(hex(randomblob(24))) WHERE "qrToken" IS NULL;
CREATE UNIQUE INDEX "Table_qrToken_key" ON "Table"("qrToken");
```
Then run `npx prisma db push`. Fresh demo databases get QR tokens when seeded.

4. Optional demo seed (DESTRUCTIVE: deletes existing application data):
```bash
npm run prisma:seed
```

5. Production Build:
```bash
npm run build
```

6. Start Production Server:
```bash
npm run start
```

Set a unique, high-entropy `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` for production. Keep table QR codes private to their physical tables. The built-in in-memory SSE hub is suitable for a single Node.js server process; multi-instance deployments require a shared realtime broker.
