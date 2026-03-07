# Backend Documentation

## Table of Contents

- [Tech Stack](#tech-stack)
- [API Architecture](#api-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [API Endpoints](#api-endpoints)
- [Middleware](#middleware)
- [Infrastructure](#infrastructure)

---

## Tech Stack

| Category    | Technology                          |
| ----------- | ----------------------------------- |
| Runtime     | [Bun](https://bun.sh/)              |
| Framework   | [Hono](https://hono.dev/)           |
| Database    | PostgreSQL (DigitalOcean Managed)   |
| Cache/Queue | Redis/Valkey (DigitalOcean Managed) |
| Email       | AWS SES                             |
| Payments    | Razorpay                            |
| Job Queue   | BullMQ                              |
| Validation  | Zod + @hono/zod-validator           |
| Logging     | Winston (with log rotation)         |

---

## API Architecture

### Base URL

```
Production: https://api.melinia.in
Development: http://localhost:3000
```

### Versioning

All API endpoints are versioned under `/api/v1/`

### Response Format

```json
{
  "message": "Success message",
  "data": { ... }
}
```

### Error Response

```json
{
    "message": "Error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

---

## Authentication & Authorization

### JWT Authentication

The API uses JSON Web Tokens (JWT) for authentication with two token types:

1. **Access Token** - Short-lived token for API requests
2. **Refresh Token** - Long-lived token stored in HTTP-only cookies (7 days)

### User Roles

| Role          | Description                               |
| ------------- | ----------------------------------------- |
| `PARTICIPANT` | Regular user registering for events       |
| `VOLUNTEER`   | Event volunteer with operations access    |
| `ORGANIZER`   | Event organizer with extended permissions |
| `ADMIN`       | Full system administrator access          |

### Cookie Configuration

- `httpOnly: true` - Prevents XSS attacks
- `secure: true` - HTTPS only in production
- `sameSite: "None"` - Cross-site requests allowed
- Domain: `.melinia.in` (production)

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint           | Description               | Auth Required |
| ------ | ------------------ | ------------------------- | ------------- |
| POST   | `/send-otp`        | Send OTP for registration | No            |
| POST   | `/verify-otp`      | Verify email via OTP      | No            |
| POST   | `/register`        | Create new account        | No            |
| POST   | `/login`           | User login                | No            |
| POST   | `/logout`          | User logout               | Yes           |
| POST   | `/refresh`         | Refresh access token      | Yes           |
| POST   | `/forgot-password` | Request password reset    | No            |
| POST   | `/reset-password`  | Reset password with token | No            |

### Users (`/api/v1/users`)

| Method | Endpoint      | Description                  | Auth Required | Role  |
| ------ | ------------- | ---------------------------- | ------------- | ----- |
| GET    | `/me`         | Get current user profile     | Yes           | All   |
| GET    | `/profile`    | Get user profile             | Yes           | All   |
| POST   | `/profile`    | Create profile               | Yes           | All   |
| PUT    | `/profile`    | Update profile               | Yes           | All   |
| GET    | `/me/events`  | Get user's registered events | Yes           | All   |
| GET    | `/me/invites` | Get pending team invitations | Yes           | All   |
| GET    | `/:id`        | Get user by ID               | Yes           | OPS   |
| POST   | `/:id/status` | Update user status           | Yes           | ADMIN |

### Events (`/api/v1/events`)

| Method | Endpoint                                 | Description                    | Auth Required | Role            |
| ------ | ---------------------------------------- | ------------------------------ | ------------- | --------------- |
| GET    | `/`                                      | List all events                | No            | -               |
| GET    | `/:id`                                   | Get event details              | No            | -               |
| GET    | `/:id/status`                            | Get user's registration status | Yes           | PARTICIPANT     |
| POST   | `/`                                      | Create event                   | Yes           | ADMIN           |
| PATCH  | `/:id`                                   | Update event                   | Yes           | ADMIN           |
| DELETE | `/:id`                                   | Delete event                   | Yes           | ADMIN           |
| POST   | `/:id/registrations`                     | Register for event             | Yes           | PARTICIPANT     |
| DELETE | `/:id/registrations`                     | Deregister from event          | Yes           | PARTICIPANT     |
| GET    | `/:id/registrations`                     | Get event registrations        | Yes           | OPS             |
| PATCH  | `/:eventId/rounds/:roundNo`              | Update round details           | Yes           | ADMIN           |
| PATCH  | `/:eventId/prizes/:position`             | Update prize details           | Yes           | ADMIN           |
| POST   | `/:id/volunteers`                        | Assign volunteers to event     | Yes           | ADMIN/ORGANIZER |
| DELETE | `/:eventId/volunteers/:volunteerId`      | Remove volunteer               | Yes           | ADMIN/ORGANIZER |
| GET    | `/:eventId/rounds/:roundNo/participants` | Get round participants         | Yes           | OPS             |
| GET    | `/:eventId/rounds/:roundId/checkins`     | Get round check-ins            | Yes           | OPS             |

### Teams (`/api/v1/teams`)

| Method | Endpoint                                       | Description             | Auth Required |
| ------ | ---------------------------------------------- | ----------------------- | ------------- |
| GET    | `/`                                            | Get user's teams        | Yes           |
| GET    | `/:team_id`                                    | Get team details        | Yes           |
| POST   | `/`                                            | Create team             | Yes           |
| DELETE | `/:team_id`                                    | Delete team             | Yes           |
| DELETE | `/:team_id/team_member/:member_id`             | Remove team member      | Yes           |
| POST   | `/:team_id/members`                            | Invite member to team   | Yes           |
| GET    | `/:team_id/pending_invitations`                | Get pending invitations | Yes           |
| DELETE | `/:team_id/pending_invitations/:invitation_id` | Delete invitation       | Yes           |
| POST   | `/pending_invitations/:invitation_id`          | Accept invitation       | Yes           |
| PUT    | `/pending_invitations/:invitation_id`          | Decline invitation      | Yes           |

### Payments (`/api/v1/payment`)

| Method | Endpoint            | Description              | Auth Required |
| ------ | ------------------- | ------------------------ | ------------- |
| POST   | `/register-melinia` | Create payment order     | Yes           |
| POST   | `/webhook`          | Razorpay webhook handler | No            |
| GET    | `/payment-status`   | Check payment status     | Yes           |

### Coupons (`/api/v1/coupons`)

| Method | Endpoint    | Description          | Auth Required |
| ------ | ----------- | -------------------- | ------------- |
| POST   | `/validate` | Validate coupon code | Yes           |

### Colleges (`/api/v1/colleges`)

| Method | Endpoint       | Description             | Auth Required |
| ------ | -------------- | ----------------------- | ------------- |
| GET    | `/`            | List all colleges       | No            |
| GET    | `/:id/degrees` | Get degrees for college | No            |

### Organizer (`/api/v1/events/organizer`)

| Method | Endpoint | Description                | Auth Required | Role  |
| ------ | -------- | -------------------------- | ------------- | ----- |
| POST   | `/`      | Create organizer/volunteer | Yes           | ADMIN |

### Operations (`/api/v1/ops`)

| Method | Endpoint                                         | Description                | Auth Required | Role |
| ------ | ------------------------------------------------ | -------------------------- | ------------- | ---- |
| POST   | `/check-in`                                      | Check-in participant       | Yes           | OPS  |
| GET    | `/check-in`                                      | List all check-ins         | Yes           | OPS  |
| GET    | `/teams`                                         | Get user teams for ops     | Yes           | OPS  |
| POST   | `/events/:eventId/rounds/:roundNo/results`       | Assign round results       | Yes           | OPS  |
| GET    | `/events/:eventId/rounds/:roundNo/results`       | Get round results          | Yes           | OPS  |
| POST   | `/events/:eventId/prizes`                        | Assign event prizes        | Yes           | OPS  |
| DELETE | `/events/:eventId/prizes`                        | Delete event prizes        | Yes           | OPS  |
| GET    | `/events/:eventId/winners`                       | Get event winners          | Yes           | OPS  |
| GET    | `/events/:event_id/round/:round_no/participants` | Scan participant for round | Yes           | OPS  |
| POST   | `/events/:event_id/round/:round_no/check-in`     | Check-in for round         | Yes           | OPS  |
| DELETE | `/events/:eventId/rounds/:roundNo/checkins`      | Delete round check-in      | Yes           | OPS  |

---

## Middleware

### Authentication Middleware (`src/middleware/auth.middleware.ts`)

| Middleware                    | Description                                 |
| ----------------------------- | ------------------------------------------- |
| `authMiddleware`              | Validates JWT access token                  |
| `adminOnlyMiddleware`         | Restricts to ADMIN role only                |
| `adminAndOrganizerMiddleware` | Restricts to ADMIN or ORGANIZER             |
| `participantOnlyMiddleware`   | Restricts to PARTICIPANT role               |
| `opsAuthMiddleware`           | Restricts to ADMIN, ORGANIZER, or VOLUNTEER |

### Other Middleware

| Middleware                | Description                          |
| ------------------------- | ------------------------------------ |
| `paymentStatusMiddleware` | Checks if user has completed payment |
| `rateLimiter`             | Prevents brute-force attacks         |
| `requestLogger`           | Logs all HTTP requests               |

---

## Infrastructure

### Deployment

- **Container**: Docker with Bun runtime
- **Base Image**: `oven/bun:1.3.4-alpine`
- **Health Check**: `/api/v1/ping` endpoint

### Environment Variables

| Variable                  | Description                 |
| ------------------------- | --------------------------- |
| `DB_HOST`                 | PostgreSQL host             |
| `DB_PORT`                 | PostgreSQL port             |
| `DB_NAME`                 | Database name               |
| `DB_USERNAME`             | Database username           |
| `DB_PASSWORD`             | Database password           |
| `REDIS_URL`               | Redis/Valkey connection URL |
| `JWT_SECRET_KEY`          | JWT signing secret          |
| `RAZORPAY_KEY_ID`         | Razorpay key ID             |
| `RAZORPAY_KEY_SECRET`     | Razorpay key secret         |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret     |
| `AWS_ACCESS_KEY`          | AWS credentials             |
| `AWS_SECRET_KEY`          | AWS credentials             |
| `MAIL_FROM`               | Email sender address        |
| `MELINIA_UI_URL`          | Frontend URL                |

### CORS Origins

```typescript
;[
    "http://localhost:5173",
    "http://localhost:5174",
    "https://d2ects9rfqf4lr.cloudfront.net",
    "https://diuiezl4lo0py.cloudfront.net",
    "https://melinia.in",
    "https://www.melinia.in",
    "https://ops.melinia.in",
]
```

### Logging

- Log files stored in `/app/logs/`
- Daily log rotation
- Archived logs in `/app/logs/archived/`

### Build Commands

```bash
# Build API
bun run build:api

# Build worker
bun run build:worker

# Build migrations
bun run build:migrate

# Full build
bun run build

# Run migrations
bun run db:migrate
```
