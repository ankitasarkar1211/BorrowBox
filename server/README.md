# BorrowBox — Backend (Foundation + Auth + Item Management Module)

A community item-sharing platform for smarter consumption (SDG 12).
This backend now implements two modules:

1. **Foundation + Authentication** — register, login, `me`.
2. **Item Management + Discovery** — create/read/update/delete
   listings, search, filter, and paginate, all scoped to the
   authenticated user's community.

Borrowing requests, credits transactions, reviews, notifications, and
AI recommendations are intentionally out of scope and will be added in
later modules.

---

## 1. Tech stack

- Node.js + Express.js
- MongoDB + Mongoose
- JavaScript, CommonJS modules (`require`/`module.exports`) — chosen
  over ES modules because it needs zero extra config (no `"type":
  "module"` quirks, no `.mjs`), which keeps a 2–3 month academic
  project simple to run and grade.
- JWT authentication (`jsonwebtoken`)
- `bcryptjs` for password hashing (pure JS, no native build step —
  easier to install cross-platform than `bcrypt`)
- `dotenv` for environment variables
- `cors`
- `nodemon` for development

## 2. Folder structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js                # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js    # register, login, me
│   │   └── itemController.js    # create/list/get/update/delete items
│   ├── middleware/
│   │   ├── auth.js              # protect, adminOnly
│   │   └── errorHandler.js      # notFound, errorHandler
│   ├── models/
│   │   ├── User.js
│   │   └── Item.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── itemRoutes.js
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── generateToken.js
│   │   ├── validators.js        # auth request validation
│   │   └── itemValidators.js    # item request + list-query validation
│   ├── app.js                   # Express app (middleware + routes)
│   └── server.js                # entry point (loads env, connects DB, listens)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

`services/` is still empty — reserved for business logic (e.g.
borrowing rules, credit calculations) that later modules will add, so
controllers stay thin from the start.

### What changed in this module

- **New files:** `src/models/Item.js`, `src/controllers/itemController.js`,
  `src/routes/itemRoutes.js`, `src/utils/itemValidators.js`.
- **Modified file:** `src/app.js` — added one `require` line for
  `itemRoutes` and one `app.use('/api/items', itemRoutes)` line. Nothing
  else in `app.js`, and nothing in the authentication module, was
  changed.
- **No new npm packages** — everything needed (`mongoose`, `express`)
  was already installed for the auth module.

## 3. Prerequisites

- Node.js **v18 LTS or v20 LTS** (recommended — `bcryptjs`, `mongoose`,
  and `express` all support these). Check with:
  ```
  node -v
  ```
- npm (comes with Node.js)
- A MongoDB Atlas account (free tier is enough) — see Section 5.
- [Postman](https://www.postman.com/downloads/) for API testing.

## 4. Install dependencies

From inside the `server/` folder:

```bash
npm install
```

This installs everything listed in `package.json`
(`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`)
plus `nodemon` as a dev dependency.

## 5. Set up MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas/register and create a
   free account (or log in).
2. Click **Create a new cluster** → choose the **free (M0)** tier →
   pick any nearby region → **Create**.
3. Under **Database Access** (left sidebar), click **Add New
   Database User**. Create a username and password (save these —
   you'll need them in the connection string). Give it
   **Read and write to any database**.
4. Under **Network Access**, click **Add IP Address** → **Allow
   Access from Anywhere** (`0.0.0.0/0`) — fine for an academic
   project; tighten this for production.
5. Go back to **Database** → click **Connect** on your cluster →
   **Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<username>` and `<password>` with the database user you
   created, and add a database name before the `?`, e.g.
   `.../borrowbox?retryWrites=true...`.

## 6. Configure environment variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/borrowbox?retryWrites=true&w=majority
JWT_SECRET=<a long random string — e.g. output of `openssl rand -hex 32`>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

Never commit `.env` — it's already in `.gitignore`.

## 7. Run the server

Development (auto-restarts on file changes):

```bash
npm run dev
```

Production:

```bash
npm start
```

You should see:

```
MongoDB connected: cluster0-shard-...mongodb.net
BorrowBox API running in development mode on port 5000
```

## 8. API endpoint summary

| Method | Endpoint             | Access  | Description                        |
|--------|-----------------------|---------|-------------------------------------|
| GET    | `/api/health`         | Public  | Health check                        |
| POST   | `/api/auth/register`  | Public  | Create a new account                |
| POST   | `/api/auth/login`     | Public  | Log in, receive a JWT               |
| GET    | `/api/auth/me`        | Private | Get the logged-in user's profile    |
| POST   | `/api/items`          | Private | Create a listing (owner = you)      |
| GET    | `/api/items`          | Private | List items in your community (search/filter/paginate) |
| GET    | `/api/items/:id`      | Private | Get one item (must be in your community) |
| PUT    | `/api/items/:id`      | Private | Update your own listing             |
| DELETE | `/api/items/:id`      | Private | Delete your own listing             |

### 8.1 Item fields

| Field | Type | Notes |
|---|---|---|
| `title` | string | 2-100 chars |
| `description` | string | 10-2000 chars |
| `category` | enum | `tools`, `books`, `electronics`, `sports`, `camping`, `kitchen`, `furniture`, `clothing`, `musical_instruments`, `other` |
| `condition` | enum | `new`, `like_new`, `good`, `fair`, `poor` |
| `images` | string[] | up to 5 http(s) URLs — no upload service yet, so URLs (e.g. from an image host) are pasted directly; a media-upload module can populate this same field later |
| `owner` | ObjectId | always the authenticated user — never accepted from the request body |
| `communityId` | string | always copied from the authenticated user — never accepted from the request body |
| `creditCost` | number | required, >= 0 |
| `purchasePrice` | number \| null | optional, >= 0 |
| `rentalPricePerDay` | number \| null | optional, >= 0 |
| `availabilityStatus` | enum | `available`, `requested`, `borrowed`, `unavailable` — this module only sets `available`/`unavailable`; the other two are reserved for the borrowing-request module |

### 8.2 List query parameters (`GET /api/items`)

| Param | Type | Notes |
|---|---|---|
| `search` | string | full-text search over `title` + `description` |
| `category` | enum | exact match |
| `condition` | enum | exact match |
| `page` | integer | default `1` |
| `limit` | integer | default `10`, capped at `50` |
| `sort` | string | one of `createdAt`, `creditCost`, `title`; prefix with `-` for descending (default `-createdAt`, newest first) |

Community scoping is **always** applied from the logged-in user and
cannot be overridden by a query parameter.

## 9. Postman testing guide

Base URL: `http://localhost:5000`

### 9.1 Health check

- **Method:** GET
- **URL:** `/api/health`
- **Headers:** none
- **Body:** none
- **Expected status:** `200`
- **Expected response:**
  ```json
  { "success": true, "message": "BorrowBox API is healthy.", "timestamp": "..." }
  ```

### 9.2 Register — POST `/api/auth/register`

- **Headers:** `Content-Type: application/json`
- **Body (raw JSON):**
  ```json
  {
    "name": "Ankita Sarkar",
    "email": "ankita@example.com",
    "password": "SuperSecret123",
    "communityId": "IEM-KOLKATA"
  }
  ```
- **Expected status:** `201`
- **Expected response:**
  ```json
  {
    "success": true,
    "message": "Registration successful.",
    "data": {
      "user": { "id": "...", "name": "Ankita Sarkar", "email": "ankita@example.com", "role": "user", "communityId": "IEM-KOLKATA", "creditsBalance": 5, "avatarUrl": null, "createdAt": "...", "updatedAt": "..." },
      "token": "eyJhbGciOi..."
    }
  }
  ```
- **Save the `token` value** — you'll need it for `/api/auth/me`.

**Negative tests:**
- Same email again → `409` `{ "success": false, "message": "An account with this email already exists." }`
- Missing `password` → `400` with a validation message.
- `password` under 8 characters → `400`.
- Invalid email format (e.g. `"not-an-email"`) → `400`.
- Missing `communityId` → `400`.

### 9.3 Login — POST `/api/auth/login`

- **Headers:** `Content-Type: application/json`
- **Body:**
  ```json
  { "email": "ankita@example.com", "password": "SuperSecret123" }
  ```
- **Expected status:** `200`
- **Expected response:** same shape as register (`user` + `token`).

**Negative tests:**
- Wrong password → `401` `{ "success": false, "message": "Invalid email or password." }`
- Non-existent email → `401` with the **same** message (prevents
  email enumeration).
- Missing fields → `400`.

### 9.4 Get current user — GET `/api/auth/me`

- **Headers:**
  - `Authorization: Bearer <token from register or login>`
- **Body:** none
- **Expected status:** `200`
- **Expected response:**
  ```json
  { "success": true, "data": { "user": { "id": "...", "name": "...", "email": "...", "role": "user", "communityId": "...", "creditsBalance": 5, "avatarUrl": null, "createdAt": "...", "updatedAt": "..." } } }
  ```

**How to attach the JWT in Postman:**
1. Go to the request's **Authorization** tab.
2. Type: **Bearer Token**.
3. Paste the token string (no need to type "Bearer " yourself —
   Postman adds it).

**Negative tests:**
- No `Authorization` header → `401` "Not authorized. No token provided."
- Malformed/expired token → `401` "Not authorized. Token is invalid or expired."
- Valid token but the user was deleted from the DB afterward → `401`
  "Not authorized. User no longer exists."

### 9.5 Items — setup

For the item tests below you need **two** logged-in users, ideally in
different communities:

- **User A** — register/login with `communityId: "IEM-KOLKATA"`. Save
  `tokenA` and note `itemId` once User A creates an item.
- **User B** — register/login with `communityId: "IEM-KOLKATA"` (same
  community, to test the "another user's item" rules).
- **User C** — register/login with `communityId: "OTHER-CAMPUS"` (a
  different community, to test cross-community access).

For every item request below, set header `Authorization: Bearer <token>`.

### 9.6 Create item — POST `/api/items`

- **Headers:** `Content-Type: application/json`, `Authorization: Bearer <tokenA>`
- **Body:**
  ```json
  {
    "title": "Cordless Drill",
    "description": "18V cordless drill, barely used, comes with two batteries.",
    "category": "tools",
    "condition": "good",
    "images": ["https://example.com/drill.jpg"],
    "creditCost": 3,
    "rentalPricePerDay": 20
  }
  ```
- **Expected status:** `201`
- **Expected response:** `{ "success": true, "message": "Item created successfully.", "data": { "item": { "id": "...", "title": "Cordless Drill", ..., "owner": "<userA id>", "communityId": "IEM-KOLKATA", "availabilityStatus": "available", ... } } }`
- Save the returned `item.id` as `itemId`.

**Negative tests:**
- No `Authorization` header → `401`.
- Missing `title` → `400` with a validation message.
- `category: "vehicles"` (not in the enum) → `400`.
- `creditCost: -5` → `400`.
- Body includes `"owner": "<some other user id>"` → ignored; the
  created item's `owner` is still User A (proves ownership can't be spoofed).

### 9.7 Get all items — GET `/api/items`

- **Headers:** `Authorization: Bearer <tokenA>` (or `tokenB`, same community)
- **Expected status:** `200`
- **Expected response:** `{ "success": true, "data": { "items": [...], "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 } } }`
- As **User C** (different community) with the same request → `200`
  but `items: []` — User C never sees IEM-KOLKATA's items.

**Search / filter / pagination tests:**
- `GET /api/items?search=drill` → returns the drill listing.
- `GET /api/items?search=nonexistentword` → `items: []`.
- `GET /api/items?category=tools` → includes the drill; `?category=books` → excludes it.
- `GET /api/items?condition=poor` → excludes the drill (it's `good`).
- `GET /api/items?page=1&limit=1` → `pagination.limit` is `1`.
- `GET /api/items?limit=9999` → `pagination.limit` is capped at `50`.
- `GET /api/items?sort=creditCost` vs `?sort=-creditCost` → ascending vs descending order.
- `GET /api/items?sort=notarealfield` → `400` validation error.

### 9.8 Get item by ID — GET `/api/items/:id`

- As **User A or B** (same community) with `Authorization: Bearer <tokenA-or-B>`:
  `GET /api/items/<itemId>` → `200` with the item.
- As **User C** (different community): `GET /api/items/<itemId>` →
  `404` `{ "success": false, "message": "Item not found." }` — a 404,
  not a 403, so User C can't tell the item exists at all.
- Malformed id, e.g. `GET /api/items/not-a-valid-id` → `400` "Invalid item id."
- Well-formed but nonexistent id, e.g. `GET /api/items/64f000000000000000000000` → `404`.

### 9.9 Update item — PUT `/api/items/:id`

- As **User A** (the owner): `PUT /api/items/<itemId>` with body
  `{ "creditCost": 4, "availabilityStatus": "unavailable" }` → `200`,
  updated item returned.
- As **User B** (same community, not the owner): same request →
  `403` `{ "success": false, "message": "You can only edit your own listings." }`
- As **User C** (different community): same request → `404` (never
  reveals the item exists outside their community).
- Body includes `"owner": "<userB id>"` or `"communityId": "OTHER-CAMPUS"`
  → both silently ignored; the item's real owner/community never changes.
- Invalid field value, e.g. `"condition": "brand-new"` → `400`.

### 9.10 Delete item — DELETE `/api/items/:id`

- As **User B** (not the owner): `DELETE /api/items/<itemId>` → `403`.
- As **User C** (different community): `DELETE /api/items/<itemId>` → `404`.
- As **User A** (the owner): `DELETE /api/items/<itemId>` → `200`
  `{ "success": true, "message": "Item deleted successfully." }`
- Repeating the same delete as User A → `404` (already gone).

### 9.11 404 check

- **Method:** GET
- **URL:** `/api/does-not-exist`
- **Expected status:** `404`
- **Expected response:** `{ "success": false, "message": "Route not found: GET /api/does-not-exist" }`

## 10. Common errors and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `MongoDB connection error: bad auth` | Wrong username/password in `MONGO_URI` | Re-check the DB user credentials in Atlas |
| `MongoDB connection error: connect ETIMEDOUT` | Atlas Network Access doesn't allow your IP | Add `0.0.0.0/0` (or your IP) under Network Access |
| Server exits immediately with "MONGO_URI is not defined" | `.env` missing or not loaded | Confirm `.env` exists in `server/` and `dotenv` loads it (it's required at the top of `server.js`) |
| `jwt malformed` / 401 on `/me` even with a token | Forgot the `Bearer ` prefix, or copied token with quotes | Use Postman's Bearer Token auth tab, or manually set header to `Authorization: Bearer <token>` with no quotes |
| `409` on register even for a "new" email | Email differs only by case/whitespace | Emails are normalized (`lowercase + trim`) — check Atlas for an existing match |
| CORS error from the frontend | `CLIENT_ORIGIN` doesn't match the frontend's URL | Update `CLIENT_ORIGIN` in `.env` to match exactly (including port) |
| `GET /api/items` always returns `items: []` | Logged in as a user whose `communityId` doesn't match any item's `communityId` | Confirm both accounts registered with the same `communityId` string (it's case-sensitive) |
| `400 category must be one of: ...` | Typo or unsupported category sent from the client | Use one of the exact enum values listed in Section 8.1 |
| Editing an item returns `403` unexpectedly | Logged in as a different user than the one who created the item | Log in as the item's actual owner, or check `item.owner` in the response |
| `sort` query param ignored / `400` | `sort` value isn't one of the allowed fields | Use `createdAt`, `creditCost`, or `title`, optionally prefixed with `-` |

## 11. Checklist — is this module working?

- [ ] `npm install` completes with no errors
- [ ] `npm run dev` connects to MongoDB and starts on the configured port
- [ ] `GET /api/health` returns `200`
- [ ] `POST /api/auth/register` creates a user and returns a token
- [ ] Registering the same email twice returns `409`
- [ ] `POST /api/auth/login` with correct credentials returns a token
- [ ] `POST /api/auth/login` with wrong password returns `401`
- [ ] `GET /api/auth/me` without a token returns `401`
- [ ] `GET /api/auth/me` with a valid token returns the user's profile
- [ ] No response ever includes the `password` field
- [ ] An unknown route returns a clean `404` JSON response
- [ ] `POST /api/items` without a token returns `401`
- [ ] `POST /api/items` with a valid token creates an item owned by that user (spoofed `owner`/`communityId` in the body are ignored)
- [ ] `GET /api/items` only returns items from the caller's own `communityId`
- [ ] `search`, `category`, `condition`, `page`, `limit`, and `sort` query params all behave as documented
- [ ] `GET /api/items/:id` for an item in another community returns `404`, not `403`
- [ ] `PUT /api/items/:id` and `DELETE /api/items/:id` return `403` when called by a non-owner in the same community
- [ ] `PUT /api/items/:id` and `DELETE /api/items/:id` return `404` when called by a user in a different community
- [ ] Deleting an item removes it from subsequent `GET /api/items` results
