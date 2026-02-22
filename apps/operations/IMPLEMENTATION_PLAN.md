# Operations Site - Implementation Summary

## What's Been Built

### Core Infrastructure
- **Axios HTTP Client** (`src/api/http.ts`)
  - Base URL from env: `http://localhost:3000/api/v1` (local) / `https://app.melinia.in/api/v1` (prod)
  - `withCredentials: true` for cookie-based refresh
  - Request interceptor: attaches `Authorization: Bearer <token>`
  - Response interceptor: handles 401 via single-flight refresh, redirects to login on failure

- **Auth System**
  - Token store (`src/auth/tokenStore.ts`): in-memory + sessionStorage
  - Auth service (`src/auth/authService.ts`): login/logout/ensureSession
  - Auth API (`src/api/auth.ts`):
    - `POST /auth/login` body: `{ email, passwd }` → `{ accessToken }`
    - `POST /auth/refresh` → `{ accessToken }` (cookie-based)

- **Router Context** (`src/app/routerContext.ts`)
  - Typed TanStack Router context with: `queryClient`, `http`, `auth`, `api.baseUrl`
  - Used in route guards, loaders, and components via `context`

### Routing
- **Public Route**
  - `/login` (`src/routes/login.tsx`): email/passwd form, redirects to `?redirect=` param or `/_auth` on success

- **Protected Layout**
  - `/_auth` (`src/routes/_auth.tsx`): 
    - `beforeLoad` calls `context.auth.ensureSession()` (auto-refresh if token missing)
    - Redirects unauthenticated users to `/login?redirect=...`
    - App shell: top bar with logout button

- **Dashboard**
  - `/_auth/` (`src/routes/_auth/index.tsx`): placeholder stats cards + quick actions

- **Root**
  - `/` (`src/routes/__root.tsx`): redirects to `/_auth` if authed, else `/login`

### UI System
- **Global Styles** (`src/styles.css`)
  - Light theme only: `color-scheme: light`
  - Zero rounded corners: `--radius: 0px` enforced globally
  - Subtle motion: 120–180ms transitions, disabled via `prefers-reduced-motion`
  - CSS variables for colors, spacing, focus rings

- **Base UI Wrappers**
  - `Button` (`src/ui/Button.tsx`): primary/secondary/ghost variants, sm/md/lg sizes, square
  - `Input` (`src/ui/Input.tsx`): square, focus ring, consistent styling
  - `Field` (`src/ui/Field.tsx`): label + error + description wrapper
  - `cx` (`src/ui/cx.ts`): className merge utility

### Environment
- `.env.local`: `VITE_API_BASE_URL=http://localhost:3000/api/v1`
- `.env.production`: `VITE_API_BASE_URL=https://app.melinia.in/api/v1`

## How to Run
```bash
# Development (Bun only)
bun --bun run dev

# Build
bun --bun run build

# Test
bun --bun run test
```

## Next Steps (Ops Modules Implementation Plan)

### Wave 1: Registrations + Check-in (Highest Ops Value)
**Goal**: Enable ops team to view registrations and perform check-ins

#### 1. Registrations Module (`src/routes/_auth/registrations.tsx`)
- **Table View**
  - Server-side pagination, search, filters (status, event, date)
  - Columns: ID, Name, Email, Event, Status, Payment, Actions
  - Actions: View Details, Verify, Mark Paid, Edit
  
- **Detail Drawer/Dialog**
  - Full registration details
  - Status timeline
  - Notes/comments section
  - Quick actions: verify, refund, resend confirmation

- **API Endpoints** (create `src/api/registrations.ts`)
  - `GET /registrations?page=1&limit=20&search=...&status=...`
  - `GET /registrations/:id`
  - `PATCH /registrations/:id` (update status, notes)
  - `POST /registrations/:id/verify`

#### 2. Check-in Module (`src/routes/_auth/checkin.tsx`)
- **Fast Attendee Lookup**
  - Autofocus search input
  - Search by: name, email, ID, phone
  - Instant results with status badges

- **Check-in Actions**
  - "Check In" button with optimistic UI
  - Undo within 30s
  - Print/assign badge number

- **QR Scanner** (separate component, add later)
  - Use `@zxing/library` or similar
  - Camera permission handling
  - Fallback to manual entry

- **API Endpoints** (create `src/api/checkins.ts`)
  - `POST /checkins` body: `{ registrationId, checkedInAt, checkedInBy }`
  - `GET /checkins?date=...`
  - `DELETE /checkins/:id` (undo)

### Wave 2: Events + Volunteers
**Goal**: Manage event schedule, venues, and volunteer shifts

#### 3. Events Module (`src/routes/_auth/events.tsx`)
- **List View**
  - All events with date, time, venue, capacity
  - Filters: date, venue, type

- **Create/Edit Form**
  - Name, description, date/time, venue, capacity
  - Validation: no overlapping events in same venue

- **API Endpoints** (create `src/api/events.ts`)
  - `GET /events`
  - `POST /events`
  - `PATCH /events/:id`
  - `DELETE /events/:id`

#### 4. Volunteers Module (`src/routes/_auth/volunteers.tsx`)
- **Shift Assignment**
  - Drag-and-drop shift assignment (optional: simple list first)
  - Volunteer availability view

- **Attendance Tracking**
  - Mark present/absent
  - Hours tracking

- **Task Board** (simple Kanban)
  - To Do / In Progress / Done
  - Assign tasks to volunteers

- **API Endpoints** (create `src/api/volunteers.ts`)
  - `GET /volunteers`
  - `GET /volunteers/:id/shifts`
  - `POST /shifts`
  - `PATCH /shifts/:id/attendance`

### Wave 3: Inventory + Finance + Admin
**Goal**: Track physical items and payments; manage users

#### 5. Inventory Module (`src/routes/_auth/inventory.tsx`)
- **Item List**
  - Available, issued, returned counts
  - Low stock alerts

- **Issue/Return Log**
  - Issue to person/event
  - Return tracking

- **API Endpoints** (create `src/api/inventory.ts`)
  - `GET /inventory/items`
  - `POST /inventory/issue`
  - `POST /inventory/return`

#### 6. Finance Module (`src/routes/_auth/finance.tsx`) [Optional]
- **Payment Reconciliation**
  - Match payment records with registrations
  - Export reports

- **API Endpoints** (create `src/api/finance.ts`)
  - `GET /payments`
  - `GET /payments/summary`

#### 7. Admin Module
- **User Management** (`src/routes/_auth/admin/users.tsx`)
  - List users, create/edit, assign roles
  - Roles: admin, ops, volunteer, finance

- **System Settings** (`src/routes/_auth/admin/settings.tsx`)
  - Fest name, dates, feature toggles

- **API Endpoints** (create `src/api/admin.ts`)
  - `GET /admin/users`
  - `POST /admin/users`
  - `PATCH /admin/users/:id/role`

### Wave 4: Polish + Production Readiness
- **Toast Notifications** (Base UI Toast)
  - Success/error/info messages
  - Consistent positioning (top-right or bottom-right)

- **Loading States**
  - Skeleton loaders for tables
  - Spinner for buttons

- **Error Boundaries**
  - Catch route errors
  - Friendly error pages

- **Accessibility Audit**
  - Keyboard navigation
  - Screen reader testing
  - Color contrast validation

- **Performance**
  - Lazy load heavy routes
  - Virtual scrolling for large tables
  - Image optimization

## File Structure Reference
```
src/
├── api/
│   ├── http.ts          (axios instance + interceptors)
│   ├── auth.ts          (login, refresh)
│   └── [module].ts      (registrations, events, volunteers, etc.)
├── auth/
│   ├── tokenStore.ts    (access token management)
│   └── authService.ts   (login/logout/ensureSession)
├── app/
│   └── routerContext.ts (typed router context factory)
├── config/
│   └── env.ts           (API base URL reader)
├── ui/
│   ├── Button.tsx       (Base UI wrapper)
│   ├── Input.tsx        (Base UI wrapper)
│   ├── Field.tsx        (label + error wrapper)
│   └── cx.ts            (className merge)
├── routes/
│   ├── __root.tsx       (global layout + devtools)
│   ├── login.tsx        (public login page)
│   ├── _auth.tsx        (guarded layout)
│   └── _auth/
│       ├── index.tsx    (dashboard)
│       ├── registrations.tsx
│       ├── checkin.tsx
│       ├── events.tsx
│       ├── volunteers.tsx
│       ├── inventory.tsx
│       ├── finance.tsx
│       └── admin/
│           ├── users.tsx
│           └── settings.tsx
├── main.tsx             (app entry)
└── styles.css           (global styles: light + square + subtle motion)
```

## Design Constraints (Enforced Globally)
- **Light theme only**: `:root { color-scheme: light; }`
- **Zero rounded corners**: all wrappers use `rounded-none`, global `--radius: 0px`
- **Subtle motion**: 120–180ms transitions, disabled via `prefers-reduced-motion`
- **High contrast**: neutral grays + blue accent for ops clarity
- **Accessible focus**: visible focus rings, keyboard-friendly

## API Contract Assumptions
- Base URL: `${VITE_API_BASE_URL}`
- All protected endpoints require `Authorization: Bearer <accessToken>`
- 401 responses trigger auto-refresh once via `POST /auth/refresh`
- Refresh cookie is httpOnly, secure (prod), and sent via `withCredentials: true`

## Development Workflow
1. Create API endpoint wrapper in `src/api/[module].ts`
2. Define TanStack Query hooks (queries + mutations)
3. Create route in `src/routes/_auth/[module].tsx`
4. Use UI wrappers (`Button`, `Input`, `Field`) for consistency
5. Test with backend running on `localhost:3000/api/v1`

## Production Deployment Checklist
- [ ] Set `VITE_API_BASE_URL=https://app.melinia.in/api/v1`
- [ ] Verify refresh cookie works cross-domain (SameSite=None; Secure)
- [ ] Test auth flow in prod-like env
- [ ] Remove devtools from production build (`env.isDev` check)
- [ ] Run accessibility audit (keyboard nav, screen readers)
- [ ] Test mobile responsiveness (ops team may use tablets)
- [ ] Monitor 401/refresh error rates in production

## Known Limitations & Future Enhancements
- **No real-time updates**: implement WebSocket/SSE for live check-in counts later
- **No offline mode**: consider service worker for offline check-in queue
- **No role-based UI hiding**: implement per-route/component permission checks
- **No audit log UI**: add admin audit log viewer later
- **No bulk actions**: add bulk verify/check-in for registrations
- **No export functionality**: add CSV/Excel export for reports

---

**Status**: Foundation complete. Login + auth guard + dashboard ready. Start Wave 1 (Registrations + Check-in) next.
