# BookLoop Server Backend

The backend REST API and database layer for the BookLoop College Library Management System.

## Architecture

- **Runtime**: Node.js & Express.js with TypeScript
- **Database**: NeonDB (Serverless PostgreSQL)
- **ORM**: Prisma ORM
- **Authentication**: Neon Managed Better Auth & JWT with Role-Based Access Control (RBAC)

## Scripts

```bash
# Start development server with live watch (port 5000)
npm run dev

# Compile TypeScript to dist/
npm run build

# Run production server
npm run start

# Prisma database sync and generator
npm run db:generate
npm run db:push
npm run db:seed
```

## API Specification

Complete details of all 18+ endpoints (authentication, catalog, borrow requests, returns, donations, queue) are documented in:
👉 **[`../API_DOCUMENTATION.md`](file:///c:/Users/ACER/OneDrive/Desktop/bookloop/API_DOCUMENTATION.md)**
