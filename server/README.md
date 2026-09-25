# BorrowBox — Backend (Foundation + Auth + Items + Borrowing + Credits/Reviews/Notifications)

A community item-sharing platform for smarter consumption (SDG 12).
This backend now implements four modules:

1. **Foundation + Authentication** — register, login, `me`.
2. **Item Management + Discovery** — create/read/update/delete
   listings, search, filter, and paginate, all scoped to the
   authenticated user's community.
3. **Borrowing Workflow** — borrow requests, owner approval/rejection,
   loans, returns, and server-enforced availability (no double-booking).
4. **Credits, Reviews, Notifications & Reminders** — Borrow Credits
   spent/earned on approval, an auditable credit transaction log,
   post-loan reviews with on-demand reputation, in-app notifications
   across every workflow transition, and a daily due-soon/overdue
   reminder scan.

AI recommendations are intentionally out of scope and will be added in
the final module.

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
│   │   ├── db.js                    # MongoDB connection
│   │   └── scheduler.js             # daily return-reminder cron job (new)
│   ├── controllers/
│   │   ├── authController.js        # register, login, me (+ signup_bonus transaction)
│   │   ├── itemController.js        # create/list/get/update/delete items + availability check
│   │   ├── borrowRequestController.js  # + credit deduction/reward, notifications
│   │   ├── loanController.js        # + return notification
│   │   ├── creditController.js      # (new)
│   │   ├── reviewController.js      # (new)
│   │   └── notificationController.js   # (new)
│   ├── middleware/
│   │   ├── auth.js                  # protect, adminOnly
│   │   └── errorHandler.js          # notFound, errorHandler
│   ├── models/
│   │   ├── User.js
│   │   ├── Item.js                  # + bookingVersion field
│   │   ├── BorrowRequest.js
│   │   ├── Loan.js
│   │   ├── CreditTransaction.js     # (new)
│   │   ├── Review.js                # (new)
│   │   └── Notification.js          # (new)
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── itemRoutes.js            # + GET /:id/availability
│   │   ├── borrowRequestRoutes.js
│   │   ├── loanRoutes.js
│   │   ├── creditRoutes.js          # (new)
│   │   ├── reviewRoutes.js          # (new)
│   │   └── notificationRoutes.js    # (new)
│   ├── services/
│   │   ├── notificationService.js   # (new) createNotification, safeNotify
│   │   └── reminderService.js       # (new) runReturnReminders
│   ├── utils/
│   │   ├── ApiError.js
│   │   ├── asyncHandler.js
│   │   ├── generateToken.js
│   │   ├── validators.js            # auth request validation
│   │   ├── itemValidators.js        # item request + list-query validation
│   │   ├── dateValidators.js        # + getDurationDays (new export)
│   │   ├── availability.js          # overlap / reserving-loan queries
│   │   ├── withTransaction.js       # MongoDB transaction retry helper
│   │   ├── listQueryHelpers.js      # shared pagination/sort/status parsing
│   │   └── borrowRequestValidators.js
│   ├── app.js                       # Express app (middleware + routes)
│   └── server.js                    # entry point (+ starts reminder schedule)
├── .env.example
├── .gitignore
├── package.json                     # + node-cron
└── README.md
```

### What changed in the borrowing workflow module

**New files:**
`src/models/BorrowRequest.js`, `src/models/Loan.js`,
`src/controllers/borrowRequestController.js`, `src/controllers/loanController.js`,
`src/routes/borrowRequestRoutes.js`, `src/routes/loanRoutes.js`,
`src/utils/dateValidators.js`, `src/utils/availability.js`,
`src/utils/withTransaction.js`, `src/utils/listQueryHelpers.js`,
`src/utils/borrowRequestValidators.js`.

**Modified files (all additive — nothing removed or rewritten):**
- `src/models/Item.js` — added one new field, `bookingVersion`
  (`Number`, default `0`). It's never returned in API responses and
  never accepted from a client; the borrowing module increments it
  inside a transaction purely to force MongoDB to detect a real write
  conflict between two concurrent approvals for the same item (see
  §3.6). No existing field changed.
- `src/controllers/itemController.js` — added one new function,
  `checkItemAvailability`, and its two new `require`s (`dateValidators`,
  `availability`). `createItem`, `getItems`, `getItemById`, `updateItem`,
  `deleteItem` are byte-for-byte unchanged.
- `src/routes/itemRoutes.js` — added one new line,
  `router.get('/:id/availability', checkItemAvailability)`. All
  existing routes unchanged.
- `src/app.js` — added two `require`s and two `app.use(...)` lines for
  the new routers. Nothing else changed.

### What changed in the credits/reviews/notifications module

**New files:**
`src/models/CreditTransaction.js`, `src/models/Review.js`,
`src/models/Notification.js`, `src/controllers/creditController.js`,
`src/controllers/reviewController.js`,
`src/controllers/notificationController.js`,
`src/routes/creditRoutes.js`, `src/routes/reviewRoutes.js`,
`src/routes/notificationRoutes.js`,
`src/services/notificationService.js`, `src/services/reminderService.js`,
`src/config/scheduler.js`.

**Modified files (all additive):**
- `src/utils/dateValidators.js` — added one new exported function,
  `getDurationDays(startDate, endDate)`, extracted from the day-count
  math the module already used internally, so the credit calculation
  can share it. Nothing else in the file changed.
- `src/controllers/authController.js` — after creating the user
  (unchanged), added a guarded, non-blocking block that records a
  `signup_bonus` `CreditTransaction` for the welcome balance the
  schema default already granted. Registration's validation, duplicate
  email check, password hashing, and token response are all unchanged.
- `src/controllers/borrowRequestController.js` — `createBorrowRequest`
  gained one `safeNotify` call at the end (owner notification);
  `rejectBorrowRequest` and `cancelBorrowRequest` each gained one
  `safeNotify` call at the end. `approveBorrowRequest`'s transaction
  callback gained the credit-check/deduct/reward/CreditTransaction
  logic (§4.2) between the existing availability re-check and the
  existing Loan creation, and three `safeNotify` calls after the
  transaction commits. The transaction's existing bookingVersion
  touch, atomic status claim, and availability re-check are all
  unchanged — the new logic only adds more work *inside* the same
  transaction and more notifications *after* it, without altering the
  existing control flow's shape.
- `src/controllers/loanController.js` — `returnLoan` gained one
  `safeNotify` call after `loan.save()`. `getMyLoans`, `getLendingLoans`,
  `getLoanById` are unchanged.
- `src/app.js` — added three `require`s and three `app.use(...)` lines
  for the new routers.
- `src/server.js` — added one `require` (`./config/scheduler`) and one
  call (`startReminderSchedule()`) right after the server starts
  listening. Connection and shutdown logic unchanged.
- `package.json` — added one dependency, `node-cron` (§6).

## 3. Borrowing workflow

### 3.1 Lifecycle

```
Discover → Check availability → Submit borrow request → Owner reviews
  → Approve ──→ Loan created → Borrowing period → Return → Loan returned
  → Reject  ──→ (no loan)
  (borrower may Cancel while still pending)
```

### 3.2 Models and relationships

**BorrowRequest** — a borrower's ask to borrow an item.

| Field | Type | Notes |
|---|---|---|
| `item` | ObjectId → Item | required |
| `borrower` | ObjectId → User | required |
| `owner` | ObjectId → User | derived from `item.owner` — never accepted from the client |
| `communityId` | string | derived from the authenticated user — never accepted from the client |
| `startDate`, `endDate` | Date | normalized to UTC midnight; see 3.4 |
| `status` | enum | `pending` → `approved` \| `rejected` \| `cancelled` |
| `message` | string, optional | ≤ 500 chars |
| `rejectionReason` | string, optional | set only on rejection, ≤ 500 chars |

Indexes: `{ borrower: 1, createdAt: -1 }` (for `/my`), `{ owner: 1,
createdAt: -1 }` (for `/received`), `{ item: 1, status: 1 }` (item
request history). `communityId`, `item`, `borrower`, `owner` each also
carry a single-field index from their field definitions.

**Loan** — an approved borrowing transaction, created 1:1 from an
approved BorrowRequest.

| Field | Type | Notes |
|---|---|---|
| `item`, `borrower`, `owner`, `communityId` | — | copied from the BorrowRequest at approval time |
| `borrowRequest` | ObjectId → BorrowRequest, **unique** | one loan per request — see 3.6 |
| `startDate`, `endDate` | Date | copied from the BorrowRequest |
| `status` | enum: `active`, `returned`, `cancelled` | see 3.3 |
| `actualReturnDate` | Date, nullable | set when returned |

Indexes: `{ item: 1, status: 1, startDate: 1, endDate: 1 }` (the core
overlap-check index — every availability query is exactly this shape),
`{ borrower: 1, createdAt: -1 }` (`/my`), `{ owner: 1, createdAt: -1 }`
(`/lending`). `communityId` carries its field-level index.

**Relationship:** `Item 1──* BorrowRequest 1──1 Loan`. An item can have
many borrow requests over time; each request produces at most one loan
(enforced by the unique index on `Loan.borrowRequest`).

### 3.3 Loan status design

Only three values are ever **written**: `active` (a live reservation —
covers "hasn't started yet", "in progress", and "overdue" all at
once), `returned`, and `cancelled` (reserved for a future flow; no
endpoint in this module sets it). `upcoming` and `overdue` are **never
persisted** — storing them would need a scheduled job to flip a loan's
status as calendar time passes, and a missed run would leave a stale,
wrong value sitting in the database. Instead, every loan response
includes both:

- `status` — the persisted value (`active` / `returned` / `cancelled`), which is also exactly what the availability check queries on.
- `effectiveStatus` — computed fresh on every read: `returned`/`cancelled` pass through; otherwise `upcoming` if `now < startDate`, `overdue` if `now > endDate`, else `active`.

List endpoints (`/api/loans/my`, `/api/loans/lending`) accept
`?status=` with any of `upcoming`, `active`, `overdue`, `returned`,
`cancelled` — the two virtual ones are translated into a
persisted-status-plus-date-range query under the hood.

### 3.4 Date validation rules

- `startDate` and `endDate` are required and must be valid dates.
- Both are normalized to **UTC midnight** of their calendar day (so
  `"2026-10-01"` and `"2026-10-01T23:59:00+05:30"` land on the same
  stored value) — this is what keeps timezone differences between
  client and server from ever shifting a booking onto the wrong day.
- **Same-day borrowing is not supported.** `endDate` must be strictly
  after `startDate` — every loan spans at least 1 full day. This keeps
  the overlap formula (3.5) unambiguous: a zero-width range would
  trivially never overlap anything and could bypass the check
  entirely.
- `startDate` cannot be before today (UTC); today itself is valid.
- Maximum borrowing period: **30 days** (`MAX_BORROW_DAYS` in
  `dateValidators.js`) — long enough for a semester-project loan,
  short enough that no item gets locked away indefinitely.

### 3.5 Availability / overlap algorithm

For a requested range `[newStart, newEnd)` and an existing reserving
loan `[existingStart, existingEnd)`, they overlap when:

```
newStart < existingEnd  AND  newEnd > existingStart
```

Ranges are **half-open**, so a loan ending on day N and a new request
starting on day N do **not** overlap — an item can be returned and
re-borrowed the same day. Documented boundary case: an existing loan
Oct 1–Oct 5 does **not** block a new request for Oct 5–Oct 8 (they
touch at the boundary, don't overlap); it **does** block Oct 3–Oct 6.

Only loans with `status: 'active'` are checked — that single value
already covers upcoming, in-progress, and overdue (3.3), so the
overlap query never needs to reason about "today" itself. `rejected`/
`cancelled` requests and `returned` loans never block.

This exact check runs in three places, always via the same
`findOverlappingLoans` / `isItemAvailable` helpers
(`src/utils/availability.js`), so they can never disagree:
1. `GET /api/items/:id/availability` (informational).
2. `POST /api/borrow-requests` (at submission time).
3. `PATCH /api/borrow-requests/:id/approve` (re-checked at approval
   time, inside a transaction — see 3.6).

### 3.6 Concurrency / double-booking protection

The scenario this defends against: Borrower A and Borrower B both
submit **pending** requests for the same item, Oct 1–Oct 5 (both
submissions succeed — a pending request never blocks another pending
request, only an approved one does). The owner must not be able to
approve both.

**Two distinct races, two distinct guards:**

1. **The same request approved twice** (e.g. a double-click). Guarded
   by an atomic `findOneAndUpdate({ _id, status: 'pending' }, { $set:
   { status: 'approved' } })` — MongoDB guarantees this single-document
   update is atomic even with no transaction involved, so only one of
   two simultaneous calls can ever see itself succeed; the other gets
   back `null` and a clean `409`. The **unique index on
   `Loan.borrowRequest`** is a second line of defense: even if a loan
   somehow got created twice for the same request, the second insert
   would fail with a duplicate-key error, which the existing error
   handler already turns into a `409`.

2. **Two different requests for the same item, overlapping dates,
   approved concurrently.** This is the harder case addressed by
   section 12 of the assignment brief. It's handled with a MongoDB
   **multi-document transaction** (`src/utils/withTransaction.js`),
   and — this is the key trick — the approval transaction also does
   `Item.findByIdAndUpdate(itemId, { $inc: { bookingVersion: 1 } },
   { session })` before re-checking availability.

   **Why that line matters:** MongoDB transactions use snapshot
   isolation. If both transactions only *read* the Loans collection
   and *write* different documents (different BorrowRequest,
   different new Loan), they never touch the same document, so MongoDB
   has nothing to detect a conflict on — both could pass their
   overlap check against a snapshot taken before the other committed,
   and **both could succeed**, silently creating two overlapping
   loans. This is a real, known gap in snapshot isolation for
   invariants that span multiple documents (MongoDB doesn't have a
   SQL-style exclusion constraint to fall back on).

   By having **both** transactions also write to the **same** `Item`
   document (`bookingVersion`), MongoDB's storage engine will detect a
   genuine write-write conflict if they run concurrently: the second
   transaction to reach that write fails with a
   `TransientTransactionError`. `withTransaction` catches exactly that
   label and **retries the whole transaction from scratch** (up to 3
   times). On retry, the retried transaction takes a **fresh snapshot**
   — one that now includes the first transaction's already-committed
   Loan — so its own overlap check correctly finds the conflict and
   returns `409`, and the BorrowRequest it was trying to approve is
   left untouched at `pending` (the transaction aborts, rolling back
   the `status: 'approved'` write too).

   **Deployment requirement:** multi-document transactions only work
   when MongoDB runs as a **replica set**. MongoDB Atlas clusters are
   replica sets by default — no extra setup needed. A local standalone
   `mongod` (e.g. `mongodb://localhost:27017/...`) does **not**
   support transactions at all and will throw `"Transaction numbers
   are only allowed on a replica set member or mongos"` — see Section
   11 "Common errors" for how to run a local single-node replica set
   if you're not using Atlas.

   **Honest limitation:** this is the strongest *practical* protection
   for an academic MVP on MongoDB, not a mathematical guarantee. It
   relies on the retry loop actually running (bounded at 3 attempts)
   and on both racing requests targeting the *same* Item document to
   produce a detectable conflict — which they always will here, since
   `bookingVersion` lives on the Item every approval for that item must
   touch. Approvals are also realistically owner-paced, human,
   UI-driven actions, not a high-frequency programmatic race, which
   further reduces real-world exposure.

### 3.7 Item.availabilityStatus vs. Loan dates

`Item.availabilityStatus` (from the existing Item module) is **not**
touched by this module and is **not** used for date-based decisions.
It remains a manual, owner-controlled pause (`available` ↔
`unavailable`) — e.g. "I'm keeping this at home this week." **Loan date
ranges are the sole authority for date-based availability**: an item
can simultaneously be "currently out on loan" and "available to
request for a future date range" — a single global boolean could never
express that, which is why `GET /api/items/:id/availability` and the
borrow-request checks always query Loans directly rather than reading
`availabilityStatus`. The only place `availabilityStatus === 'unavailable'`
is checked is as an additional, independent gate on top of the date
check (both `POST /api/borrow-requests` and the availability endpoint
check it).

### 3.8 Overdue detection

Calculated **dynamically** (Section 3.3's `effectiveStatus`), not
via a scheduled job — simpler and safer for this stage, since there's
no background worker in this project yet and a dynamic calculation can
never go stale. Scheduled overdue **notifications** are explicitly
deferred to a later module.

### 3.9 Authorization matrix

| Action | Borrower | Owner | Unrelated user |
|---|---|---|---|
| Create request | YES | NO (can't request own item) | NO (community-scoped) |
| View own request | YES | YES (if for their item) | NO → `404` |
| Approve | NO | YES | NO |
| Reject | NO | YES | NO |
| Cancel pending request | YES | NO | NO |
| View borrower's loans (`/my`) | YES | — | — |
| View owner's loans (`/lending`) | — | YES | — |
| View single loan | YES | YES | NO → `404` |
| Return item | **YES** | **YES** (see 3.10) | NO |

Cross-community access is denied identically to the existing item
module: **`404`, not `403`**, whenever the requester isn't entitled to
know the resource exists at all (wrong community, or an unrelated user
hitting `GET /:id`). A `403` is used only when the resource is visible
enough to reference (e.g. the owner trying to approve — they can see
it in `/received`) but the specific action isn't theirs to take.

### 3.10 Who can mark a loan returned?

**Both** the borrower and the owner. Rationale: this is a closed,
trust-based community with no dispute-resolution flow yet — requiring
only the borrower would leave a loan stuck if they forget or lose
access; requiring only the owner has the same failure mode in reverse.
Whichever side acts first wins; the other's later attempt on an
already-returned loan gets a clean `409`.

## 4. Credits, Reviews, Notifications & Reminders

### 4.1 Lifecycle (extended)

```
LIST → DISCOVER → REQUEST → APPROVE
  → CHECK CREDITS → DEDUCT / REWARD CREDITS → CREATE LOAN
  → BORROW → RETURN → REVIEW → REPUTATION
```

Credit deduction/reward, Loan creation, and the request's transition to
`approved` all happen inside the **same** MongoDB transaction already
built for double-booking protection (§3.6) — nothing new was added to
make this atomic; the existing transaction was simply extended to also
move credits before it commits.

### 4.2 Borrow Credits

**Rule:** `borrowCost = Item.creditCost × durationDays` (the same
`durationDays` §3.4/§3.5 already compute — e.g. `creditCost: 2` for 3
days = 6 credits). Entirely server-side: `creditCost` comes from the
Item document already loaded during approval, and the day count comes
from the request's own stored, pre-validated `startDate`/`endDate` —
never from anything in the approval request's body.

At approval, inside the transaction:
1. Compute `borrowCost`.
2. Read the borrower's current `creditsBalance` (inside the session).
3. If `creditsBalance < borrowCost` → **abort the transaction** and
   return `409`. This rolls back everything the transaction had done
   so far (the bookingVersion touch and the request's `status:
   'approved'` write — see §3.6) — the request is left exactly
   `pending`, no Loan exists, no credits moved.
4. Otherwise: deduct `borrowCost` from the borrower, add `borrowCost`
   to the owner (`User.creditsBalance` — the existing field, never
   duplicated), create the `Loan`, and create two `CreditTransaction`
   records (§4.3) — all in the same transaction, so they either all
   commit together or none do.

**No refunds in this MVP** (explicitly out of scope per the brief):
pending/rejected/cancelled requests never touch credits; a returned
loan does not refund the borrower; the owner keeps the reward
regardless of how the borrowing period went.

### 4.3 Credit transactions

`CreditTransaction` is an append-only audit log — every balance change
gets one row, so a user's full credit history can be reconstructed
without trusting the current `creditsBalance` figure alone.

| Field | Notes |
|---|---|
| `user` | whose balance changed |
| `amount` | signed — negative for spends, positive for rewards/bonuses |
| `type` | `signup_bonus`, `borrow_spend`, `lending_reward`, `refund` (reserved, unused), `adjustment` (reserved, unused) |
| `balanceBefore` / `balanceAfter` | snapshotted at the moment of change |
| `loan` | which Loan caused this (`null` for `signup_bonus`) |
| `description` | human-readable, e.g. `Borrowed "Cordless Drill" for 3 day(s).` |

**Signup bonus:** registration already granted the existing
`creditsBalance` schema default (5) — this module adds a matching
`CreditTransaction` (`type: 'signup_bonus'`) so that starting balance
shows up in the user's own history instead of appearing unexplained.
Guarded against duplicates with an existence check before creating it,
and never allowed to fail registration itself if it errors (it's
bookkeeping for an action that already succeeded).

### 4.4 Reviews & reputation

**Rules enforced by `POST /api/reviews`:**
- The referenced `loan` must have `status: 'returned'` — otherwise `409`.
- Only that loan's borrower or owner may review it — anyone else gets
  `404` (same "don't confirm it exists" convention `getLoanById` uses).
- `reviewer` is always `req.user`; `reviewee` is always derived as "the
  other party on the loan" — never accepted from the request body.
- **Duplicate prevention** is a real database constraint, not just an
  application check: a unique index on `{ loan, reviewer }` means a
  second `Review.create` for the same pair fails with `E11000`, which
  the existing centralized error handler already turns into `409`.
- Self-review is structurally impossible (you can never be both
  borrower and owner of the same loan — that's already blocked when a
  request is created), but a defensive check exists anyway.

**Reputation is computed on demand, never stored** — `averageRating`,
`totalReviews`, `completedBorrowings`, and `completedLendings` are all
aggregated fresh from `Review`/`Loan` on every call to `GET
/api/reviews/user/:userId`, so there is no cached figure that could
ever go stale.

### 4.5 Notifications

`Notification` records are created by a single reusable
`safeNotify()` helper (`src/services/notificationService.js`) that
never throws — a failed notification write can never turn a
successful borrow-request approval, review, or return into a failed
API response, because by the time `safeNotify` is called the
triggering action has already committed.

| Trigger | Recipient | Type |
|---|---|---|
| Request submitted | Owner | `borrow_request_received` |
| Request approved | Borrower | `borrow_request_approved` |
| Request approved (credits) | Borrower / Owner | `credit_spent` / `credit_received` |
| Request rejected | Borrower | `borrow_request_rejected` |
| Request cancelled | Owner | `borrow_request_cancelled` |
| Loan returned | Owner | `item_returned` |
| Review submitted | Reviewee | `review_received` |
| Loan due tomorrow | Borrower | `loan_due_soon` |
| Loan overdue | Borrower | `loan_overdue` |

**No duplicate-on-retry:** for the action-triggered types above, the
underlying state transition itself is already guarded (e.g. approving
twice returns `409` on the second call before any notification code
runs at all — see §3.6), so a retried request can never re-trigger the
notification. For the two reminder types, which run on a schedule
rather than being triggered once by a single request, duplication is
prevented explicitly (§4.6).

### 4.6 Return reminders

`reminderService.runReturnReminders()` — read-only against `Loan`,
write-only to `Notification`; it **never** changes `Loan.status`, so
the existing state machine (§3.3) is untouched.

- **Due soon:** active loans whose `endDate` is exactly tomorrow (UTC
  calendar day — consistent with the UTC-midnight date normalization
  in §3.4).
- **Overdue:** active loans whose `endDate` has already passed.
- **Duplicate prevention:** before creating either notification type,
  it checks whether one already exists for that
  `(recipient, type, relatedEntityType: 'Loan', relatedEntityId)`
  combination and skips if so — this is what makes running the job
  twice (or on every server restart) safe, and is the entire answer to
  "prevent duplicate reminders."

**Scheduling:** `src/config/scheduler.js` runs this once a day at
00:05 UTC via `node-cron`, started from `server.js` right after the
server begins listening. For testing without waiting for the
schedule, `POST /api/notifications/run-reminders` (admin-only — see
§11.24 for how to make a test account an admin) runs the exact same
function on demand and returns a summary of what it did.

## 5. Prerequisites

- Node.js **v18 LTS or v20 LTS** (recommended — `bcryptjs`, `mongoose`,
  and `express` all support these). Check with:
  ```
  node -v
  ```
- npm (comes with Node.js)
- A MongoDB Atlas account (free tier is enough) — see Section 7.
- [Postman](https://www.postman.com/downloads/) for API testing.

## 6. Install dependencies

**One new package for this module: `node-cron`** (used by
`src/config/scheduler.js` to run the daily return-reminder job — see
§4.6). Everything else, including MongoDB transactions/sessions used
by the borrowing workflow module, was already installed.

From inside the `server/` folder:

```bash
npm install
```

(If you're adding this module to an existing checkout rather than
using this zip directly: `npm install node-cron`.)

This installs everything listed in `package.json`
(`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`,
`node-cron`) plus `nodemon` as a dev dependency.

## 7. Set up MongoDB Atlas

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

## 8. Configure environment variables

**No new environment variables are required for this module either**
(credits, reviews, notifications, and reminders all reuse the same
`MONGO_URI` and `JWT_SECRET`). The replica-set requirement noted for
the borrowing workflow module still applies — see §3.6 and §12 if
you're running MongoDB locally as a standalone instance.

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

## 9. Run the server

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

## 10. API endpoint summary

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
| GET    | `/api/items/:id/availability` | Private | Check date-range availability for one item |
| POST   | `/api/borrow-requests` | Private | Submit a borrow request |
| GET    | `/api/borrow-requests/my` | Private | Requests you've submitted |
| GET    | `/api/borrow-requests/received` | Private | Requests received for items you own |
| GET    | `/api/borrow-requests/:id` | Private | Get one request (borrower or owner only) |
| PATCH  | `/api/borrow-requests/:id/approve` | Private | Owner approves → creates a Loan |
| PATCH  | `/api/borrow-requests/:id/reject` | Private | Owner rejects (requires `rejectionReason`) |
| PATCH  | `/api/borrow-requests/:id/cancel` | Private | Borrower cancels (only while `pending`) |
| GET    | `/api/loans/my` | Private | Loans where you're the borrower |
| GET    | `/api/loans/lending` | Private | Loans where you're the owner |
| GET    | `/api/loans/:id` | Private | Get one loan (borrower or owner only) |
| PATCH  | `/api/loans/:id/return` | Private | Mark a loan returned (borrower or owner) |
| GET    | `/api/credits/balance` | Private | Your current `creditsBalance` |
| GET    | `/api/credits/transactions` | Private | Your credit transaction history (paginated, filterable by `type`) |
| POST   | `/api/reviews` | Private | Review a returned loan's other party |
| GET    | `/api/reviews/my` | Private | Reviews you've written |
| GET    | `/api/reviews/user/:userId` | Private | A community member's reviews + reputation |
| GET    | `/api/reviews/loan/:loanId` | Private | Reviews for one loan (borrower or owner only) |
| GET    | `/api/notifications` | Private | Your notifications (paginated, filterable by `isRead`) |
| GET    | `/api/notifications/unread-count` | Private | Count of unread notifications |
| PATCH  | `/api/notifications/:id/read` | Private | Mark one notification read |
| PATCH  | `/api/notifications/read-all` | Private | Mark all your notifications read |
| POST   | `/api/notifications/run-reminders` | Private (admin only) | Manually run the due-soon/overdue reminder scan |

### 10.1 Item fields

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
| `availabilityStatus` | enum | `available`, `requested`, `borrowed`, `unavailable` — a manual owner-controlled pause, independent of dates. The borrowing module (§3.7) never sets `requested`/`borrowed`/`unavailable` automatically; date-based availability always comes from Loan records, not this field. |

### 10.2 List query parameters (`GET /api/items`)

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

### 10.3 Borrow request list query parameters (`/my`, `/received`)

| Param | Type | Notes |
|---|---|---|
| `status` | enum | `pending`, `approved`, `rejected`, `cancelled` |
| `page` | integer | default `1` |
| `limit` | integer | default `10`, capped at `50` |
| `sort` | string | one of `createdAt`, `startDate`, `endDate`; prefix with `-` for descending (default `-createdAt`) |

### 10.4 Loan list query parameters (`/my`, `/lending`)

| Param | Type | Notes |
|---|---|---|
| `status` | enum | `upcoming`, `active`, `overdue`, `returned`, `cancelled` — see §3.3/§3.6 for how the first two and `overdue` map onto the persisted `active` status plus a date filter |
| `page` | integer | default `1` |
| `limit` | integer | default `10`, capped at `50` |
| `sort` | string | one of `createdAt`, `startDate`, `endDate`; prefix with `-` for descending (default `-createdAt`) |

### 10.5 Availability check (`GET /api/items/:id/availability`)

Query params: `startDate`, `endDate` (both required, same validation
rules as §3.4). Response:

```json
{ "success": true, "data": { "itemId": "...", "startDate": "...", "endDate": "...", "available": true } }
```

If `available` is `false`, an additional `reason` field is included:
`"unavailable"` (owner has manually paused the item) or
`"date_conflict"` (overlaps an existing reservation).

### 10.6 Credit transaction list query parameters (`GET /api/credits/transactions`)

| Param | Type | Notes |
|---|---|---|
| `type` | enum | `signup_bonus`, `borrow_spend`, `lending_reward`, `refund`, `adjustment` |
| `page` | integer | default `1` |
| `limit` | integer | default `10`, capped at `50` |
| `sort` | string | only `createdAt` is supported; prefix with `-` for descending (default `-createdAt`) |

### 10.7 Review fields (`POST /api/reviews`)

| Field | Type | Notes |
|---|---|---|
| `loanId` | string | required; the loan must be `status: 'returned'` |
| `rating` | integer | required, 1-5 |
| `comment` | string, optional | ≤ 1000 chars |
| `reviewer` / `reviewee` / `item` | — | always derived server-side — never accepted from the client |

`GET /api/reviews/user/:userId` also returns a `reputation` object:
`{ averageRating, totalReviews, completedBorrowings, completedLendings }`
— `averageRating` is `null` (not `0`) when `totalReviews` is `0`.

### 10.8 Notification list query parameters (`GET /api/notifications`)

| Param | Type | Notes |
|---|---|---|
| `isRead` | `"true"` \| `"false"` | omit to get both read and unread |
| `page` | integer | default `1` |
| `limit` | integer | default `10`, capped at `50` |

## 11. Postman testing guide

Base URL: `http://localhost:5000`

### 11.1 Health check

- **Method:** GET
- **URL:** `/api/health`
- **Headers:** none
- **Body:** none
- **Expected status:** `200`
- **Expected response:**
  ```json
  { "success": true, "message": "BorrowBox API is healthy.", "timestamp": "..." }
  ```

### 11.2 Register — POST `/api/auth/register`

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

### 11.3 Login — POST `/api/auth/login`

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

### 11.4 Get current user — GET `/api/auth/me`

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

### 11.5 Items — setup

For the item tests below you need **two** logged-in users, ideally in
different communities:

- **User A** — register/login with `communityId: "IEM-KOLKATA"`. Save
  `tokenA` and note `itemId` once User A creates an item.
- **User B** — register/login with `communityId: "IEM-KOLKATA"` (same
  community, to test the "another user's item" rules).
- **User C** — register/login with `communityId: "OTHER-CAMPUS"` (a
  different community, to test cross-community access).

For every item request below, set header `Authorization: Bearer <token>`.

### 11.6 Create item — POST `/api/items`

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

### 11.7 Get all items — GET `/api/items`

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

### 11.8 Get item by ID — GET `/api/items/:id`

- As **User A or B** (same community) with `Authorization: Bearer <tokenA-or-B>`:
  `GET /api/items/<itemId>` → `200` with the item.
- As **User C** (different community): `GET /api/items/<itemId>` →
  `404` `{ "success": false, "message": "Item not found." }` — a 404,
  not a 403, so User C can't tell the item exists at all.
- Malformed id, e.g. `GET /api/items/not-a-valid-id` → `400` "Invalid item id."
- Well-formed but nonexistent id, e.g. `GET /api/items/64f000000000000000000000` → `404`.

### 11.9 Update item — PUT `/api/items/:id`

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

### 11.10 Delete item — DELETE `/api/items/:id`

- As **User B** (not the owner): `DELETE /api/items/<itemId>` → `403`.
- As **User C** (different community): `DELETE /api/items/<itemId>` → `404`.
- As **User A** (the owner): `DELETE /api/items/<itemId>` → `200`
  `{ "success": true, "message": "Item deleted successfully." }`
- Repeating the same delete as User A → `404` (already gone).

### 11.11 Availability check — GET `/api/items/:id/availability`

- As **User B**: `GET /api/items/<itemId>/availability?startDate=2026-10-01&endDate=2026-10-05` → `200`, `available: true` (nothing booked yet).
- Same request as **User C** (different community) → `404`.
- Missing `startDate` → `400`.
- `startDate` in the past → `400`.
- `endDate` equal to `startDate` → `400` (same-day not supported).
- `startDate` after `endDate` → `400`.
- A range longer than 30 days → `400`.

### 11.12 Create borrow request — POST `/api/borrow-requests`

- As **User B**, headers `Authorization: Bearer <tokenB>`:
  ```json
  { "itemId": "<itemId>", "startDate": "2026-10-01", "endDate": "2026-10-05", "message": "Need it for a weekend project." }
  ```
  → `201`, `data.borrowRequest.status: "pending"`. Save `requestId1`.
- As **User A** (the item's owner) requesting their own item → `400` "You cannot request to borrow your own item."
- As **User C** (different community) requesting `itemId` → `404`.
- Missing `startDate`/`endDate` → `400`.
- Body includes `"owner"` or `"communityId"` → both silently ignored (the created request's `owner`/`communityId` still match the item/borrower).
- Repeat the **same** create request as **User C** (a second borrower, also in User A's community, if you registered one) for **overlapping** dates (e.g. Oct 3–Oct 6) → still `201`. Two *pending* requests for overlapping dates are allowed by design — only *approval* enforces exclusivity (§3.6). Save this as `requestId2`.

### 11.13 Owner sees incoming requests — GET `/api/borrow-requests/received`

- As **User A**: `200`, both `requestId1` and `requestId2` appear, each `status: "pending"`.
- As **User B** (not an owner of anything): `200`, `borrowRequests: []`.

### 11.14 Borrower sees their own requests — GET `/api/borrow-requests/my`

- As **User B**: `200`, includes `requestId1`.
- `?status=pending` → includes it; `?status=approved` → excludes it (not yet approved).

### 11.15 Authorization checks on the request

- As **User B** (the borrower, not the owner): `PATCH /api/borrow-requests/<requestId1>/approve` → `403` "Only the item owner can approve this request."
- As **User C** (different community): `GET /api/borrow-requests/<requestId1>` → `404`.
- As **User C**: `POST /api/borrow-requests` for User A's item → `404` (already covered in 10.12, repeated here for the authorization-matrix checklist).

### 11.16 Approve a request → creates a Loan

- As **User A**: `PATCH /api/borrow-requests/<requestId1>/approve` → `200`,
  `data.loan` with `status: "active"`, `effectiveStatus` one of
  `upcoming`/`active` depending on today's date, and `borrowRequest`
  equal to `requestId1`. Save `loanId1`.
- `GET /api/borrow-requests/<requestId1>` → `status: "approved"`.
- Calling approve **again** on `requestId1` → `409` "This request has already been processed." (or "already been approved", depending on which check fires first) — no second loan is created.

### 11.17 Overlap test — approval must fail for the conflicting request

- `requestId2` (Oct 3–Oct 6, overlapping `requestId1`'s Oct 1–Oct 5) is still `pending`.
- As **User A**: `PATCH /api/borrow-requests/<requestId2>/approve` → `409`
  "The requested dates are no longer available — another loan now
  overlaps them."
- `GET /api/borrow-requests/<requestId2>` → still `status: "pending"`
  (the failed approval did not change it — the owner can still reject
  it or leave it pending).
- **Boundary test:** create and approve a third request for Oct 5–Oct
  8 (touches `loanId1`'s end date but doesn't overlap it under the
  half-open range rule in §3.5) → this one **succeeds**. Create and
  approve a fourth for Sep 28–Oct 1 (touches the start) → also
  **succeeds**, same reasoning.

### 11.18 Reject a request

- Submit a new pending request (`requestId3`) from **User B**.
- As **User A**: `PATCH /api/borrow-requests/<requestId3>/reject` with
  `{ "rejectionReason": "Already lent out to someone else this week." }`
  → `200`, `status: "rejected"`.
- Missing `rejectionReason` → `400`.
- `GET /api/loans/lending` as User A → the rejected request produced
  **no** loan.
- Approving an already-rejected request → `409`.

### 11.19 Cancel a request

- Submit a new pending request (`requestId4`) from **User B**.
- As **User B**: `PATCH /api/borrow-requests/<requestId4>/cancel` →
  `200`, `status: "cancelled"`.
- As **User A** (owner, not the borrower) attempting to cancel it →
  `403`.
- Cancelling an already-approved request → `409` "Only pending
  requests can be cancelled (this one is approved)."

### 11.20 Loans — my / lending / by id

- As **User B**: `GET /api/loans/my` → `200`, includes `loanId1`.
- As **User A**: `GET /api/loans/lending` → `200`, includes `loanId1`.
- `GET /api/loans/my?status=upcoming` or `?status=overdue` filters correctly relative to today's date and `loanId1`'s dates.
- As **User C**: `GET /api/loans/<loanId1>` → `404`.
- Malformed loan id → `400`.

### 11.21 Return a loan

- As **User B** (the borrower): `PATCH /api/loans/<loanId1>/return` →
  `200`, `status: "returned"`, `effectiveStatus: "returned"`,
  `actualReturnDate` set.
- Calling return **again** on the same loan → `409` "This loan has
  already been returned."
- As **User A** (the owner) marking a *different*, still-active loan
  as returned → `200` (owners are also allowed — §3.10).
- As **User C** attempting to return `loanId1` → `404` (wrong
  community) — or `403` if you test with a same-community unrelated
  user instead.
- `PUT /api/loans/<loanId1>` (generic update) → `404` "Route not
  found" — this route deliberately does not exist (§21/§23 of the
  brief: no direct status modification through a generic endpoint).

### 11.22 Date validation edge cases (via `POST /api/borrow-requests`)

- `startDate` after `endDate` → `400`.
- `startDate` equal to `endDate` → `400` (same-day not supported).
- `startDate` in the past → `400`.
- Invalid date string (e.g. `"not-a-date"`) → `400`.
- A 45-day range → `400` "Borrowing period cannot exceed 30 days."

### 11.23 404 check

- **Method:** GET
- **URL:** `/api/does-not-exist`
- **Expected status:** `404`
- **Expected response:** `{ "success": false, "message": "Route not found: GET /api/does-not-exist" }`

### 11.24 Setup — promote a test account to admin

`POST /api/notifications/run-reminders` requires `role: 'admin'`, and
registration always creates `role: 'user'` (see the User model in the
foundation module — there is no way to self-register as admin). There
is no API endpoint to promote a user either (by design — see the
existing `adminOnly` middleware's comments), so for testing, do it
directly in the database. In `mongosh`, connected to your `MONGO_URI`:

```js
db.users.updateOne({ email: "usera@example.com" }, { $set: { role: "admin" } })
```

Log in again afterward (or just reuse an existing token — role is read
fresh from the database on every request via `protect`, not cached in
the JWT) and use that account for §11.33-11.34 below.

### 11.25 Credits — initial balance & signup bonus

- Register a new user (**User E**). `GET /api/credits/balance` as User
  E → `200`, `{ "creditsBalance": 5 }`.
- `GET /api/credits/transactions` as User E → `200`, one transaction:
  `type: "signup_bonus"`, `amount: 5`, `balanceBefore: 0`,
  `balanceAfter: 5`.

### 11.26 Credits — approval deducts, rewards, and records transactions

Using an item with `creditCost: 2` and a 3-day borrow request (Oct
1-4, per §11.12's item):

- Before approval: note User A's (owner) and User B's (borrower)
  balances via `GET /api/credits/balance`.
- As User A, approve the request (§11.16). Response now also includes
  `data.creditsCharged: 6` (2/day × 3 days) alongside `data.loan`.
- `GET /api/credits/balance` as User B → decreased by exactly `6`.
- `GET /api/credits/balance` as User A → increased by exactly `6`.
- `GET /api/credits/transactions` as User B → new entry: `type:
  "borrow_spend"`, `amount: -6`, `loan` set to the new loan's id.
- `GET /api/credits/transactions` as User A → new entry: `type:
  "lending_reward"`, `amount: 6`, same `loan` id.
- `GET /api/notifications` as User B → includes a `borrow_request_approved`
  and a `credit_spent` notification. As User A → includes a
  `credit_received` notification.

### 11.27 Credits — insufficient credits blocks approval entirely

- Register a fresh borrower (**User F**, same community as User A) —
  starting balance `5`.
- As User F, submit a borrow request for an item costing more than 5
  credits total for the chosen date range (e.g. `creditCost: 3` for 3
  days = 9 credits).
- As the owner, attempt to approve it → `409` "Insufficient credits:
  this borrowing period costs 9 credit(s), but the borrower has 5."
- Verify **nothing changed**: `GET /api/borrow-requests/:id` → still
  `"pending"`; `GET /api/credits/balance` for both parties →
  unchanged; `GET /api/credits/transactions` for both → no new
  entries; no `Loan` was created (`GET /api/loans/lending` as the
  owner doesn't include it).

### 11.28 Credits — cross-user access denied

- As User C, `GET /api/credits/transactions` → `200`, but only ever
  contains User C's own transactions — there is no way to pass another
  user's id to this endpoint (it's always `req.user._id`), so there's
  nothing to "deny" as such; the test is simply confirming the
  response never includes another user's rows no matter what.

### 11.29 Reviews — must be returned; both parties can review

- Attempt `POST /api/reviews` with `loanId` for a loan that's still
  `"active"` (not yet returned) → `409` "Only completed (returned)
  loans can be reviewed."
- Return the loan (`PATCH /api/loans/:id/return`, §11.21).
- As User B (borrower): `POST /api/reviews` with `{ "loanId": "...",
  "rating": 5, "comment": "Great, reliable lender." }` → `201`,
  `reviewee` is User A.
- As User A (owner) reviewing the same loan: `{ "loanId": "...",
  "rating": 4 }` → `201`, `reviewee` is User B.

### 11.30 Reviews — duplicates, self/unrelated, reputation

- User B submitting a **second** review for the same loan → `409`
  (duplicate-key on the unique `{loan, reviewer}` index).
- As User C (uninvolved in this loan): `POST /api/reviews` for it →
  `404` (same "don't confirm it exists" convention as `getLoanById`).
- `GET /api/reviews/user/<userA-id>` as User B → `200`, includes
  `reputation: { averageRating, totalReviews, completedBorrowings,
  completedLendings }` plus the paginated `reviews` list.
- As User C (different community than User A, if applicable) →
  `404`.
- `GET /api/reviews/my` as User B → includes the review they wrote
  about User A.
- `GET /api/reviews/loan/<loanId>` as User A or B → `200`, both
  reviews. As User C → `404`.

### 11.31 Notifications — trigger coverage

Walk back through §11.12-11.21 while checking `GET /api/notifications`
for each actor:

- User B submits a request → User A's notifications include
  `borrow_request_received`.
- User A approves → User B's include `borrow_request_approved`,
  `credit_spent`; User A's include `credit_received` (§11.26).
- Reject a different request → the borrower's notifications include
  `borrow_request_rejected` with the rejection reason in `message`.
- Cancel a different pending request → the owner's notifications
  include `borrow_request_cancelled`.
- Return a loan → the owner's notifications include `item_returned`.
- Submit a review → the reviewee's notifications include
  `review_received`.

### 11.32 Notifications — read state & cross-user access

- `GET /api/notifications/unread-count` as User A → matches the number
  of `isRead: false` entries from `GET /api/notifications?isRead=false`.
- `PATCH /api/notifications/<id>/read` for one of User A's own
  notifications → `200`, `isRead: true`; unread count decreases by 1.
- `PATCH /api/notifications/<id>/read` using an id that belongs to
  **User B** while authenticated as User A → `404` (never a `403` —
  the ownership filter is baked into the query itself, so there's
  nothing to distinguish "doesn't exist" from "isn't yours").
- `PATCH /api/notifications/read-all` as User A → `200`,
  `updatedCount` matches however many were still unread; a second call
  immediately after → `updatedCount: 0`.

### 11.33 Reminders — due-soon & overdue detection

Real due-soon/overdue tests require a loan whose `endDate` is actually
tomorrow or in the past, which a normal borrow request can't produce
(§3.4 blocks past `startDate`s, and approval always creates a loan
starting today or later). To test this without waiting for real time
to pass, adjust a loan's dates directly for a throwaway test loan (in
`mongosh`, matching the UTC-midnight normalization §3.4 already uses):

```js
// Make it due "tomorrow"
db.loans.updateOne({ _id: ObjectId("...") }, { $set: { endDate: new Date(new Date().setUTCHours(24,0,0,0) + 86400000) } })
// Make it overdue
db.loans.updateOne({ _id: ObjectId("...") }, { $set: { endDate: new Date(new Date().setUTCHours(0,0,0,0) - 86400000) } })
```

- As the admin account from §11.24: `POST /api/notifications/run-reminders`
  → `200`, `data` summary shows `dueSoonCreated: 1` and/or
  `overdueCreated: 1` (depending on which loan(s) you adjusted).
- As a non-admin user: same request → `403`.
- `GET /api/notifications` as the affected loan's borrower → includes
  a `loan_due_soon` and/or `loan_overdue` entry.
- `GET /api/loans/my?status=overdue` (or `?status=upcoming`) as that
  borrower → confirms §3.3/§4's `effectiveStatus` logic agrees with
  what the reminder job found.

### 11.34 Reminders — running twice creates no duplicates

- Immediately call `POST /api/notifications/run-reminders` **again**
  (same admin account, same data) → `200`, but `data.dueSoonCreated`
  and `data.overdueCreated` are now both `0` — the notifications from
  §11.33 already exist, so `alreadyNotified()` (§4.6) skips them.
- `GET /api/notifications` for that borrower → still only **one**
  `loan_due_soon` and one `loan_overdue` entry, not two.

### 11.35 Regression check

Everything from the earlier modules (§11.1-11.23) should still behave
identically — nothing in this module altered any existing controller's
logic beyond the specific, additive changes documented in §2 and §12.
Spot-check at minimum: registration/login/`me` (§11.2-11.4), item
CRUD and search (§11.6-11.10), double-booking rejection (§11.17), and
the "no `PUT /api/loans/:id`" check (§11.21) — all should return
exactly the same responses as before this module existed.

## 12. Common errors and fixes

| Symptom | Likely cause | Fix |
|---|---|---|
| `MongoDB connection error: bad auth` | Wrong username/password in `MONGO_URI` | Re-check the DB user credentials in Atlas |
| `MongoDB connection error: connect ETIMEDOUT` | Atlas Network Access doesn't allow your IP | Add `0.0.0.0/0` (or your IP) under Network Access |
| Server exits immediately with "MONGO_URI is not defined" | `.env` missing or not loaded | Confirm `.env` exists in `server/` and `dotenv` loads it (it's required at the top of `server.js`) |
| `jwt malformed` / 401 on `/me` even with a token | Forgot the `Bearer ` prefix, or copied token with quotes | Use Postman's Bearer Token auth tab, or manually set header to `Authorization: Bearer <token>` with no quotes |
| `409` on register even for a "new" email | Email differs only by case/whitespace | Emails are normalized (`lowercase + trim`) — check Atlas for an existing match |
| CORS error from the frontend | `CLIENT_ORIGIN` doesn't match the frontend's URL | Update `CLIENT_ORIGIN` in `.env` to match exactly (including port) |
| `GET /api/items` always returns `items: []` | Logged in as a user whose `communityId` doesn't match any item's `communityId` | Confirm both accounts registered with the same `communityId` string (it's case-sensitive) |
| `400 category must be one of: ...` | Typo or unsupported category sent from the client | Use one of the exact enum values listed in Section 10.1 |
| Editing an item returns `403` unexpectedly | Logged in as a different user than the one who created the item | Log in as the item's actual owner, or check `item.owner` in the response |
| `sort` query param ignored / `400` | `sort` value isn't one of the allowed fields | Use `createdAt`, `creditCost`, or `title`, optionally prefixed with `-` |
| `500 The database is not configured to support transactions...` on `/approve` | MongoDB is a **standalone** instance (e.g. local `mongodb://localhost:27017/...`), not a replica set | Use MongoDB Atlas (already a replica set), or run local MongoDB as a single-node replica set: start `mongod --replSet rs0`, then once in `mongosh` run `rs.initiate()` |
| `400 startDate cannot be in the past` when you thought the date was today | Timezone confusion — dates are normalized to **UTC** midnight | Send a date that's "today" in UTC, or simply pick tomorrow to avoid edge cases near midnight |
| `400 endDate must be after startDate...` for a request you expected to be 1 day | Same-day borrowing isn't supported (§3.4) | Use at least a 2-day span, e.g. `startDate: "2026-10-01"`, `endDate: "2026-10-02"` |
| Approving a request always returns `409 already been processed` | The request's status is no longer `pending` (already approved/rejected/cancelled by an earlier call) | `GET /api/borrow-requests/:id` to check its current `status` first |
| Approval returns `409 no longer available` even though you expect it to succeed | Another loan already reserves an overlapping range for that item | `GET /api/items/:id/availability?startDate=...&endDate=...` to see the conflict before approving |
| `GET /api/loans/my?status=overdue` returns nothing you expect | `overdue` only matches loans with persisted `status: 'active'` whose `endDate` has passed | Confirm the loan hasn't already been returned, and that your server clock is correct |
| Creating a second overlapping borrow request fails with `409` at creation time | You're testing against `POST /api/borrow-requests`, which blocks overlap with existing **loans**, not other pending requests | Two pending requests for the same dates are allowed by design (§3.6) — the block only happens at *approval* |
| `409 Insufficient credits...` on approval you expected to succeed | Borrower's `creditsBalance` is lower than `item.creditCost × durationDays` | `GET /api/credits/balance` for the borrower first, or lower the item's `creditCost`/shorten the date range |
| Approving succeeds but `GET /api/credits/balance` looks unchanged | Checked the wrong user, or checked before the approval response came back | Re-fetch after the `200` response; balances move inside the same transaction that creates the Loan |
| `409` on `POST /api/reviews` even though the loan looks done | `Loan.status` is still `'active'` — an overdue loan is **not** the same as a returned one (§3.3) | `PATCH /api/loans/:id/return` first |
| `409` on a second review attempt from the same user | The unique `{loan, reviewer}` index — one reviewer can only review a given loan once | This is by design; the other party's review is a separate document |
| `403` on `POST /api/notifications/run-reminders` | The account's `role` is `'user'`, not `'admin'` | Promote it directly in the database — see §11.24 (there's no self-service admin endpoint) |
| Reminder job reports `dueSoonCreated: 0` / `overdueCreated: 0` when you expected notifications | No loan's `endDate` actually matches "tomorrow" (exact UTC day) or "already passed" | Adjust a test loan's dates directly per §11.33, or just wait for real dates to line up |
| Running the reminder job twice creates a second `loan_due_soon`/`loan_overdue` notification | Only possible if `Notification.recipient`/`type`/`relatedEntityId` don't match what `alreadyNotified()` queries for | Confirm the loan's `borrower` and `_id` didn't change between runs; this should not happen with the shipped code |
| `GET /api/credits/transactions?type=...` returns `400` | Typo'd type value | Use one of `signup_bonus`, `borrow_spend`, `lending_reward`, `refund`, `adjustment` exactly |

## 13. Checklist — is this module working?

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
- [ ] MongoDB is confirmed to be a replica set (Atlas, or a local `mongod --replSet`) — required for `/approve` to work at all
- [ ] `GET /api/items/:id/availability` returns `available: true` before any loan exists, and validates dates the same way borrow requests do
- [ ] `POST /api/borrow-requests` rejects borrowing your own item, past dates, same-day ranges, and ranges over 30 days
- [ ] Spoofed `owner`/`communityId`/`status` fields in a create-request body are always ignored
- [ ] Two *pending* requests can exist for overlapping dates on the same item; approving the second one after the first is approved returns `409` and leaves it `pending`
- [ ] Boundary dates (e.g. an existing Oct 1–5 loan vs. a new Oct 5–8 request) do **not** count as overlapping and approval succeeds
- [ ] Approving a request twice never creates two loans (second call returns `409`)
- [ ] Only the item owner can approve/reject; only the borrower can cancel; a `403`/`404` is returned otherwise per §3.9
- [ ] Rejecting requires `rejectionReason` and never creates a loan
- [ ] Cancelling only works while `status: 'pending'`
- [ ] `GET /api/loans/my` and `/api/loans/lending` each only show the caller's own loans, with `status`/`effectiveStatus` both present
- [ ] `PATCH /api/loans/:id/return` works for both the borrower and the owner, sets `actualReturnDate`, and returns `409` if called twice
- [ ] `PUT /api/loans/:id` does not exist (confirms loan status can't be set directly)
- [ ] Cross-community access to any borrow-request or loan endpoint returns `404`, never leaking that the resource exists
- [ ] New registration grants `creditsBalance: 5` and a matching `signup_bonus` `CreditTransaction` (`amount: 5`, `balanceBefore: 0`, `balanceAfter: 5`)
- [ ] Approving a request deducts `creditCost × durationDays` from the borrower and adds the same amount to the owner, atomically with Loan creation
- [ ] Insufficient borrower credits blocks approval entirely: request stays `pending`, no Loan, no balance change, no CreditTransaction, on both sides
- [ ] `GET /api/credits/balance` and `GET /api/credits/transactions` never expose another user's data
- [ ] `POST /api/reviews` fails with `409` on a non-returned loan, succeeds for both borrower and owner after return, and returns `409` on a second review by the same reviewer for the same loan
- [ ] A user who is neither the loan's borrower nor owner gets `404` from every review endpoint touching that loan
- [ ] `GET /api/reviews/user/:userId` returns `averageRating: null` when `totalReviews` is `0`, and a real average once reviews exist
- [ ] Every listed trigger (request received/approved/rejected/cancelled, credit spent/received, item returned, review received) produces exactly one notification for the right recipient
- [ ] `GET /api/notifications/unread-count`, `PATCH .../:id/read`, and `PATCH .../read-all` all behave as documented, and a notification id belonging to another user returns `404`
- [ ] `POST /api/notifications/run-reminders` requires `role: 'admin'` (`403` otherwise) and correctly detects due-soon/overdue loans
- [ ] Running the reminder job twice never creates duplicate `loan_due_soon`/`loan_overdue` notifications
- [ ] The reminder job never modifies `Loan.status` — only `Notification` documents are written
- [ ] All pre-existing auth/item/borrowing/loan tests (§11.1-11.23) still pass unchanged
