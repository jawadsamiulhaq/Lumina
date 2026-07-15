# Lumina — Full-Stack Ecommerce

A production-style, fully dynamic ecommerce application. **Every product, category, image and order lives in the database** and is managed through an admin UI — there is zero hardcoded catalog data. The storefront is built to feel like a polished modern brand site with smooth Framer Motion animations throughout.

- **Backend:** ASP.NET Core Web API (clean architecture: Domain / Application / Infrastructure / API), EF Core code-first, SQL Server, ASP.NET Core Identity + JWT (access + refresh token rotation), Stripe Checkout, FluentValidation, Swagger.
- **Frontend:** React 18+ + TypeScript (Vite), Tailwind CSS, Framer Motion, TanStack Query (server state), Zustand (cart), React Hook Form + Zod.

---

## ⚠️ Environment notes (important)

This repository was built and verified on a machine where only newer toolchains were available. Two deviations from the original brief were made deliberately so the app **actually builds and runs**:

| Brief asked for | Used here | Why |
| --- | --- | --- |
| .NET 8 | **.NET 10** (`net10.0`) | Only the .NET 10 SDK/runtime is installed. The code uses no version-specific APIs — retarget to `net8.0` in the four `.csproj` files if you have the .NET 8 runtime. |
| SQL Server via Docker | **Local SQL Server 2022** (Windows auth) | A local instance was already running, so Docker wasn't needed. The Docker command is documented below and works the same way. |

Everything else matches the brief.

---

## Features

**Storefront**
- Animated hero with parallax, featured products, category grid — all from the API
- Product listing with search, category + price filters, sorting, pagination, shimmer skeletons
- Product detail with image gallery (crossfade + hover zoom), stock status, quantity selector, reviews
- Slide-over cart drawer **and** full cart page with optimistic quantity updates
- Stripe Checkout → success / cancel pages
- Account area with profile and order history (status timeline)
- Register / login with validation, error states, and automatic token refresh

**Admin** (`/admin`, Admin role only)
- Overview: animated count-up revenue/order stats, low-stock alerts, recent orders
- Products: searchable table + create/edit form with **drag-and-drop multi-image upload**
- Categories: CRUD with slug auto-generation
- Orders: list, detail, status dropdown (drives the customer timeline)
- Users: list, promote/demote Admin

**Animations (Framer Motion):** route fade+slide transitions, staggered product-grid reveals, hover lift + image zoom on cards, **product image flies to the cart icon** with a badge bounce, spring cart drawer, hero text reveal + parallax, gallery crossfade, button press/success-checkmark micro-interactions, `whileInView` scroll reveals, shimmer skeletons — all 150–400ms and respecting `prefers-reduced-motion`.

---

## Prerequisites

- **.NET 10 SDK** (or .NET 8 SDK if you retarget) — `dotnet --version`
- **Node.js 20+** and npm — `node --version`
- **SQL Server** (local instance or Docker) + the `dotnet-ef` tool: `dotnet tool install --global dotnet-ef`
- *(optional, for payments)* **Stripe CLI** — https://stripe.com/docs/stripe-cli

---

## 1. Database

### Option A — Local SQL Server (default)
The default connection string uses Windows authentication against `localhost`:
```
Server=localhost;Database=EcommerceDb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true
```
Nothing to do — the app **creates the database, applies migrations and seeds it automatically on first run**.

### Option B — SQL Server via Docker
```bash
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=Your_password123" \
  -p 1433:1433 --name lumina-sql -d mcr.microsoft.com/mssql/server:2022-latest
```
Then set the connection string (env var overrides appsettings):
```
ConnectionStrings__Default=Server=localhost,1433;Database=EcommerceDb;User Id=sa;Password=Your_password123;TrustServerCertificate=True
```

### Migrations
Migrations are **applied automatically at startup**. To manage them manually:
```bash
cd backend
# create a new migration
dotnet ef migrations add <Name> -p src/Ecommerce.Infrastructure -s src/Ecommerce.API -o Persistence/Migrations
# apply migrations without running the app
dotnet ef database update -p src/Ecommerce.Infrastructure -s src/Ecommerce.API
```

### Seed data
On startup the app seeds: **1 admin user, 4 categories, 20 sample products** (3 placeholder images each). Seeding is idempotent — it only runs when the tables are empty.

---

## 2. Run the backend

```bash
cd backend
dotnet run --project src/Ecommerce.API
```
- API: **http://localhost:5065**
- Swagger UI: **http://localhost:5065/swagger**
- Uploaded images are served from `/uploads/...`

Configuration lives in `src/Ecommerce.API/appsettings*.json` and can be overridden with environment variables (double-underscore syntax). See **`backend/.env.example`**.

---

## 3. Run the frontend

```bash
cd frontend
npm install
npm run dev
```
- App: **http://localhost:5173**

The Vite dev server **proxies `/api` and `/uploads` to the backend on :5065**, which keeps the httpOnly refresh-token cookie first-party over http during development. See **`frontend/.env.example`**.

---

## 4. Admin login

```
Email:    admin@example.com
Password: Admin123!$
```
Sign in, then use the account menu → **Admin dashboard**, or go to `/admin`.

---

## 5. Stripe test mode + webhook

Payments run in Stripe **test mode**. The checkout endpoint creates a Stripe Checkout Session; the order is only marked **Paid** (and stock decremented, cart cleared) when the **webhook** fires — with signature verification.

1. Get your test keys from https://dashboard.stripe.com/test/apikeys and set:
   ```powershell
   $env:Stripe__SecretKey      = "sk_test_xxx"
   $env:Stripe__PublishableKey = "pk_test_xxx"
   ```
2. Forward webhooks with the Stripe CLI and copy the printed `whsec_...` secret:
   ```bash
   stripe login
   stripe listen --forward-to http://localhost:5065/api/v1/webhooks/stripe
   ```
   ```powershell
   $env:Stripe__WebhookSecret = "whsec_xxx"
   ```
3. Restart the backend, add items to the cart, check out, and pay with the test card:
   ```
   4242 4242 4242 4242 — any future expiry, any CVC, any ZIP
   ```
4. You'll be redirected to `/checkout/success`; the webhook marks the order **Paid** — visible under **My orders** and in the admin **Orders** list.

> Without Stripe keys the app runs fully; only the final "Pay with Stripe" step returns a clear "Stripe is not configured" message.

---

## API overview (versioned under `/api/v1`)

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me` |
| Products | `GET /products` (search/filter/sort/paged), `GET /products/{slug}`, admin `GET/POST/PUT/DELETE` |
| Categories | `GET /categories`, admin `POST/PUT/DELETE` |
| Cart | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{productId}`, `DELETE /cart/items/{productId}` |
| Orders | `POST /orders/checkout`, `GET /orders`, `GET /orders/{id}`; admin `GET /orders/admin`, `PUT /orders/admin/{id}/status` |
| Reviews | `GET /products/{slug}/reviews`, `POST /products/{slug}/reviews` (must have purchased) |
| Uploads | `POST /uploads/image` (Admin, type/size validated, rate-limited) |
| Webhooks | `POST /webhooks/stripe` (signature-verified) |
| Admin | `GET /admin/dashboard`, `GET /admin/users`, `PUT /admin/users/{id}/role` |

Cross-cutting: global exception middleware → RFC7807 **ProblemDetails**, FluentValidation → 400 ValidationProblem, **rate limiting** on auth + upload endpoints, CORS locked to the frontend origin, JWT bearer auth with **refresh-token rotation** (hashed at rest, httpOnly cookie).

---

## Project structure

```
backend/
  src/
    Ecommerce.Domain/          # entities, enums, constants (no dependencies)
    Ecommerce.Application/     # DTOs, service interfaces, validators, common helpers
    Ecommerce.Infrastructure/  # EF Core DbContext + config, Identity, JWT, Stripe,
                               #   file storage, service implementations, migrations, seed
    Ecommerce.API/             # controllers, middleware, filters, Program.cs, wwwroot/uploads
frontend/
  src/
    api/         # typed API service functions
    components/  # ui primitives, layout, product, cart, admin, order pieces
    hooks/       # TanStack Query hooks, useAddToCart
    lib/         # axios client (+auto-refresh), motion variants, format, queryClient
    pages/       # storefront + admin pages
    store/       # Zustand: auth, cart, toast, fly-to-cart
    types/       # API types
```

Money is stored and handled as **integer cents** end-to-end; formatting goes through a single `formatPrice` utility. No floating-point money math on the backend.

---

## Verify / quality gates

```bash
# Backend — builds with zero warnings
cd backend && dotnet build Ecommerce.slnx

# Frontend — type-check, production build, lint
cd frontend && npx tsc --noEmit && npm run build && npm run lint
```
> The frontend template ships with **oxlint** (a fast ESLint-compatible linter) instead of ESLint; `npm run lint` runs it.

---

## Deployment notes

**Backend → Azure App Service + Azure SQL**
1. Create an Azure SQL Database; set `ConnectionStrings__Default` (App Service → Configuration) to its connection string.
2. Set `Jwt__Secret` (strong), `Stripe__*`, and `Frontend__BaseUrl` (your deployed SPA origin) as app settings.
3. Migrations apply on startup. For blob-backed uploads, implement `IFileStorage` with Azure Blob Storage and swap the DI registration in `Infrastructure/DependencyInjection.cs`.
4. Point the Stripe webhook (dashboard → Developers → Webhooks) at `https://<api-host>/api/v1/webhooks/stripe`.

**Frontend → Vercel / Netlify**
1. Build command `npm run build`, output `dist`.
2. Set `VITE_API_URL=https://<api-host>/api/v1`.
3. Add an SPA rewrite (all routes → `/index.html`). Ensure the API's CORS `Frontend__BaseUrl` and cookie settings allow the deployed origin (cross-site cookies require HTTPS + `SameSite=None`).
```
