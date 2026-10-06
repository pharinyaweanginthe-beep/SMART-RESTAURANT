# Production Deployment - SMART RESTAURANT

## Deploy on Render

The repository includes a Render Blueprint at `render.yaml`. It provisions a single Node.js web service and a persistent disk for the SQLite database. A paid Render web-service plan is required for the disk. Keep the service at one instance: the application uses SQLite and an in-memory realtime event hub.

1. Push the repository to GitHub.
2. Sign in to [Render](https://dashboard.render.com), choose **New > Blueprint**, and connect this repository's `main` branch.
3. Review the service and persistent-disk charges, then choose **Deploy Blueprint**.
4. Wait for the first deploy to finish. The startup command creates the database schema and a first active administrator. It does not seed demo data.
5. Open the service's environment settings and reveal the generated `INITIAL_ADMIN_PASSWORD`. Sign in at `/login` using `owner@smartrestaurant.com` and that password. Do not share the password publicly.
6. Add the restaurant's actual tables, menu, and staff accounts. The public root page is customer-facing; table ordering URLs are generated from each table's QR code.

Render assigns the service a stable `onrender.com` URL. A custom domain can be attached later in the service settings. The URL becomes available after Render provisions the service; it cannot be created by a Git push alone.

The database file is stored on the attached disk at `/var/data/smart-restaurant.db`, so it survives deploys and restarts. Back up the disk/database regularly. Do not scale this SQLite service to multiple instances. For horizontal scaling, migrate Prisma to a shared database and replace the in-memory realtime hub with a shared broker.

## Deploy elsewhere

This project currently uses SQLite (`prisma/schema.prisma`) and has no checked-in Prisma migrations. Any production host must provide durable storage mounted to the web service and must run a single application instance. Ephemeral filesystems will lose the database on redeploy. Configure these environment variables:

```env
DATABASE_URL="file:/absolute/path/on/persistent-storage/smart-restaurant.db"
AUTH_SECRET="<unique high-entropy secret, at least 32 random bytes>"
INITIAL_ADMIN_EMAIL="owner@yourdomain.com"
INITIAL_ADMIN_NAME="Restaurant Owner"
INITIAL_ADMIN_PASSWORD="<unique secret of at least 32 characters>"
```

Set the database path to a directory on the host's persistent disk. Start the service with:

```bash
npx prisma db push && npm run bootstrap:admin && npm start
```

`bootstrap:admin` creates an active administrator only when the database has no administrator account at all. It never enables or resets an existing account. If the configured email belongs to another account, startup fails explicitly; resolve the account conflict rather than reusing demo credentials.

## Local production check

```bash
npm ci
npm run build
npm start
```

For local demo data only, follow the setup instructions in the root README. `npm run setup:demo` deletes all data in the configured database before recreating the demo dataset; never run it against production data.
