# SIT725 QR App

QR-based restaurant menu web application for SIT725.

## Current Project Status

The backend currently supports:
- Auth for owner registration and login with JWT issuance
- Super admin workflows (owner approval/rejection/disable, restaurant listing, table+QR generation)
- Owner menu management CRUD for their own restaurant
- Owner table listing for their own restaurant

The backend does not yet support:
- Public guest menu endpoint for scanned QR links
- Order placement/checkout APIs
- Analytics, billing, table-session, and restaurant CRUD APIs (files exist but routes/controllers are not wired)

## Tech Stack

- Frontend: HTML, CSS, Materialize CSS, vanilla JavaScript
- Backend: Node.js + Express.js
- Database: MongoDB + Mongoose
- Auth: JWT (`jsonwebtoken`)

## Architecture

- Backend uses MVC (`models`, `controllers`, `routes`, `middleware`, `utils`, `config`)
- Frontend is static pages consuming backend REST APIs via `fetch()`

## Repository Structure

- `backend/`: API server and database layer
- `frontend/`: static pages and UI components
- `docs/`: SRS and team documentation

## Local Setup

1. Clone and open project:
```bash
git clone <repo-url>
cd SIT725_QR_APP
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Fill required values in `backend/.env`:
- `PORT` (example: `5001`)
- `MONGO_URI` (example: `mongodb://127.0.0.1:27017/sit725_qr_app`)
- `JWT_SECRET` (long random string)
- `JWT_EXPIRES_IN` (example: `7d`)
- `FRONTEND_URL`
- `BASE_URL` (used by QR generation, example: `http://localhost:5001`)

5. Seed initial data (recommended for first run):
```bash
npm run seed:admin
```

6. Start backend:
```bash
npm run dev
```

7. Open frontend pages with Live Server (or any static server), start at:
- `frontend/pages/index.html`

## NPM Scripts

From `backend/`:
- `npm run dev`: start API in watch mode
- `npm start`: start API with Node
- `npm run seed:admin`: create admin, owner, restaurant, and tables with QR codes
- `npm run seed:e2e`: seed richer E2E dataset

## Authentication Flow (JWT)

1. Client calls `POST /api/auth/login` with email/password.
2. Backend verifies credentials and owner approval status.
3. Backend returns `token` + `user`.
4. Client sends token in header for protected APIs:
   - `Authorization: Bearer <jwt>`
5. `protect` middleware verifies token using `JWT_SECRET`.
6. `authorize(...)` middleware enforces role access (`owner`, `super_admin`).

### Notes
- Owners with status other than `approved` cannot log in.
- Missing/invalid token returns `401 Not authorized`.
- Wrong role returns `403 Forbidden`.

## API Base URL

Local default:
- `http://localhost:5001/api`

## API Endpoints (Currently Wired in `server.js`)

### Auth APIs (`/api/auth`)

- `POST /register`
  - Purpose: owner self-registration (creates pending owner account)
  - Auth required: no

- `POST /login`
  - Purpose: login for admin/owner
  - Auth required: no
  - Returns JWT token

### Menu APIs (`/api/menu`)

Owner-only:
- `GET /my`
- `GET /my/tables`
- `POST /my`
- `PUT /my/:itemId`
- `DELETE /my/:itemId`
- `PATCH /my/:itemId/availability`

Super-admin-only:
- `GET /:restaurantId` (view any restaurant menu)

### Admin APIs (`/api/admin`)

All routes require `super_admin` token:
- `GET /owners/pending`
- `GET /owners`
- `PATCH /owners/:id/approve`
- `PATCH /owners/:id/reject`
- `PATCH /owners/:id/disable`
- `GET /restaurants`
- `POST /restaurants/:id/tables` (regenerates tables + QRs)
- `GET /restaurants/:id/tables`

## APIs Not Yet Available (Current State)

These route files exist but are currently empty and not mounted in `server.js`:
- `backend/routes/orderRoutes.js`
- `backend/routes/tableRoutes.js`
- `backend/routes/sessionRoutes.js`
- `backend/routes/analyticsRoutes.js`
- `backend/routes/billingRoutes.js`
- `backend/routes/restaurantRoutes.js` (mounted but no endpoints yet)

This means order management and checkout are not currently available as backend APIs.

## Example Usage Scenarios

### Scenario 1: Owner registration and approval

1. Owner submits registration:
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Alice",
  "email": "alice@example.com",
  "password": "owner123",
  "pendingRestaurantName": "Alice Cafe",
  "pendingRestaurantAddress": "10 Main St",
  "pendingRestaurantPhone": "0400000000",
  "pendingRestaurantEmail": "contact@alicecafe.com"
}
```

2. Super admin logs in and approves owner:
```http
PATCH /api/admin/owners/<ownerId>/approve
Authorization: Bearer <super_admin_jwt>
```

### Scenario 2: Owner menu management (implemented)

1. Owner login:
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "owner@example.com",
  "password": "owner123"
}
```

2. Create menu item:
```http
POST /api/menu/my
Authorization: Bearer <owner_jwt>
Content-Type: application/json

{
  "name": "Margherita Pizza",
  "category": "Pizza",
  "description": "Tomato, mozzarella, basil",
  "price": 16.5,
  "isAvailable": true
}
```

3. Toggle availability:
```http
PATCH /api/menu/my/<itemId>/availability
Authorization: Bearer <owner_jwt>
Content-Type: application/json

{
  "isAvailable": false
}
```

4. Fetch own menu:
```http
GET /api/menu/my
Authorization: Bearer <owner_jwt>
```

### Scenario 3: Table and QR generation (implemented)

Super admin sets 10 tables for a restaurant:
```http
POST /api/admin/restaurants/<restaurantId>/tables
Authorization: Bearer <super_admin_jwt>
Content-Type: application/json

{
  "totalTables": 10
}
```

Result:
- Existing tables for that restaurant are replaced
- New QR links are generated using `BASE_URL/menu/<restaurantId>?table=<tableNumber>`
- `restaurant.totalTables` is updated

### Scenario 4: Order management (current status)

Current state:
- `Order` model exists
- Order route/controller endpoints are not implemented/exposed yet
- No customer checkout/place-order flow in the current backend

## Postman and Testing

- A collection exists at `backend/postman/SIT725_QR_App.postman_collection.json`
- Use seeded users for quick testing:
  - Admin: `admin@system.com` / `admin123`
  - Owner: `owner@example.com` / `owner123`

## Team Role Handoff

Backend developer:
- Implement MongoDB schemas in `backend/models/`
- Add business logic in `backend/controllers/`
- Wire endpoints in `backend/routes/`
- Keep auth-protected routes behind `backend/middleware/authMiddleware.js`

Frontend developer:
- Build UI in `frontend/pages/` + `frontend/components/`
- Add shared styles/scripts in `frontend/assets/`
- Connect to backend via REST APIs using `fetch()`

QA developer:
- Validate auth and role protection (`401`/`403` behavior)
- Validate owner menu CRUD and admin table/QR generation
- Track test cases in `docs/diagrams/` or QA docs
- Verify regression after merged features

## Important Rules

- Do not commit real `.env` values
- Do not use frontend frameworks for this project
- Keep backend modular and MVC-aligned
- QR links should map to menu by restaurant id

## New Contributor Checklist

- `npm install` completed in `backend/`
- `.env` created from `.env.example`
- Backend starts without crash
- `seed:admin` executed successfully
- Login works and JWT is returned
- Owner can create/read/update menu items
- Admin can set tables and see QR values

See [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for a role-based startup guide.
