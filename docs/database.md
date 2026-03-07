# Database Documentation

## Table of Contents

- [Database Overview](#database-overview)
- [Schema Diagram](#schema-diagram)
- [Tables](#tables)
- [Custom Functions](#custom-functions)
- [Indexes](#indexes)
- [Relationships](#relationships)

---

## Database Overview

| Property   | Value                               |
| ---------- | ----------------------------------- |
| Database   | PostgreSQL                          |
| Managed By | DigitalOcean Managed PostgreSQL     |
| Extensions | pg_trgm (trigram similarity search) |
| Encoding   | UTF-8                               |

---

## Schema Diagram

```
┌─────────────────┐     ┌─────────────────┐
│     users       │     │    colleges     │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ id (PK)         │
│ email           │     │ name            │
│ ph_no           │     │ is_default      │
│ passwd_hash     │     └────────┬────────┘
│ role            │              │
│ payment_status  │              │ ┌────────────┐
│ status          │              └─▶│  degrees   │
│ profile_completed│             │ ├────────────┤
│ created_at      │             │ │ id (PK)    │
│ updated_at      │             │ │ name       │
└────────┬────────┘             │ │ is_default │
         │                    └──────────────┘
         │
         │ 1:1
         ▼
┌─────────────────┐     ┌─────────────────┐
│    profile      │     │     events      │
├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │────▶│ name            │
│ first_name      │     │ description     │
│ last_name       │     │ participation_type │
│ college_id (FK) │     │ event_type      │
│ degree_id (FK)  │     │ max_allowed     │
│ year            │     │ venue           │
│ created_at      │     │ start_time      │
│ updated_at      │     │ end_time        │
└─────────────────┘     │ registration_start │
                        │ registration_end   │
                        │ created_by (FK)    │
                        │ created_at         │
                        │ updated_at         │
                        └────────┬──────────┘
                                 │
                                 │ 1:N
                                 ▼
                    ┌─────────────────────┐
                    │   event_rounds      │
                    ├─────────────────────┤
                    │ id (PK)             │
                    │ event_id (FK)       │
                    │ round_no            │
                    │ round_name          │
                    │ round_description   │
                    │ start_time          │
                    │ end_time            │
                    │ created_at          │
                    │ updated_at          │
                    └──────────┬──────────┘
                               │
                               │ 1:N
                ┌──────────────┴──────────────┐
                ▼                             ▼
┌─────────────────────┐         ┌─────────────────────┐
│    round_rules      │         │   round_results     │
├─────────────────────┤         ├─────────────────────┤
│ id (PK)             │         │ id (PK)              │
│ event_id (FK)       │         │ round_id (FK)       │
│ round_id (FK)       │         │ user_id (FK)        │
│ rule_no             │         │ team_id (FK)        │
│ rule_description    │         │ points              │
│ created_at          │         │ status              │
│ updated_at          │         │ eval_by (FK)        │
└─────────────────────┘         │ eval_at             │
                               └─────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     teams       │     │ team_members    │     │ invitations     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │────▶│ user_id (FK)    │     │ id (PK)         │
│ name            │     │ team_id (FK)    │◀────│ team_id (FK)    │
│ leader_id (FK)  │     │ joined_at       │     │ status          │
└─────────────────┘     └─────────────────┘     │ inviter_id (FK) │
                                                 │ invitee_id (FK) │
                                                 └─────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│ event_registrations │     │     event_crews     │
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ event_id (FK)       │
│ event_id (FK)       │────▶│ user_id (FK)       │◀────┐
│ team_id (FK)        │     │ assigned_by (FK)   │     │
│ user_id (FK)        │     │ created_at         │     │
│ registered_at       │     └───────────────────┘     │
└─────────────────────┘                                │
                                                       │
┌─────────────────────┐     ┌─────────────────────┐    │
│   event_prizes      │     │   event_results    │    │
├─────────────────────┤     ├─────────────────────┤    │
│ id (PK)             │     │ id (PK)             │────┘
│ event_id (FK)       │────▶│ event_id (FK)       │
│ position            │     │ user_id (FK)        │
│ reward_value       │     │ team_id (FK)        │
│ created_at          │     │ prize_id (FK)       │
│ updated_at          │     │ points              │
└─────────────────────┘     │ awarded_at         │
                           │ awarded_by (FK)     │
                           └─────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    payments     │     │    coupons      │     │ coupon_redemptions │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id (PK)         │     │ id (PK)         │     │ id (PK)         │
│ user_id (FK)    │────▶│ code            │────▶│ user_id (FK)   │
│ order_id        │     │ created_at      │     │ coupon_id (FK)  │
│ payment_id      │     └─────────────────┘     │ redeemed_at     │
│ email           │                               └─────────────────┘
│ payment_status  │
│ amount          │
│ created_at      │
│ updated_at      │
│ paid_at         │
└─────────────────┘

┌─────────────────────┐     ┌─────────────────────┐
│      check_ins      │     │ event_round_checkins│
├─────────────────────┤     ├─────────────────────┤
│ id (PK)             │     │ id (PK)             │
│ participant_id (FK)│────▶│ user_id (FK)       │
│ checkedin_at       │     │ round_id (FK)       │
│ checkedin_by (FK)  │     │ team_id (FK)        │
└─────────────────────┘     │ checkedin_at       │
                            │ checkedin_by (FK)  │
                            └─────────────────────┘

┌─────────────────────┐
│     migrations     │
├─────────────────────┤
│ id (PK)            │
│ name (UNIQUE)      │
│ executed_at        │
└─────────────────────┘
```

---

## Tables

### Users Table

Stores user authentication and account information.

| Column              | Type                | Constraints                     | Description                         |
| ------------------- | ------------------- | ------------------------------- | ----------------------------------- |
| `id`                | TEXT                | PRIMARY KEY                     | Auto-generated (format: MLNUXXXXXX) |
| `email`             | TEXT                | UNIQUE, NOT NULL                | User email                          |
| `ph_no`             | VARCHAR(10)         | UNIQUE                          | Phone number                        |
| `passwd_hash`       | TEXT                | NOT NULL                        | Bcrypt hashed password              |
| `role`              | USER_ROLE           | NOT NULL, DEFAULT 'PARTICIPANT' | User role enum                      |
| `payment_status`    | USER_PAYMENT_STATUS | NOT NULL, DEFAULT 'UNPAID'      | Payment status enum                 |
| `status`            | USER_STATUS         | NOT NULL, DEFAULT 'INACTIVE'    | Account status enum                 |
| `profile_completed` | BOOLEAN             | NOT NULL, DEFAULT false         | Profile completion flag             |
| `created_at`        | TIMESTAMPTZ         | DEFAULT NOW()                   | Creation timestamp                  |
| `updated_at`        | TIMESTAMPTZ         | DEFAULT NOW()                   | Last update timestamp               |

**Enums:**

```sql
CREATE TYPE user_role AS ENUM ('PARTICIPANT', 'VOLUNTEER', 'ORGANIZER', 'ADMIN');
CREATE TYPE user_payment_status AS ENUM ('UNPAID', 'PAID', 'EXEMPTED');
CREATE TYPE user_status AS ENUM ('INACTIVE', 'ACTIVE', 'SUSPENDED');
```

---

### Profile Table

Stores user profile information linked to users table.

| Column       | Type        | Constraints                  | Description             |
| ------------ | ----------- | ---------------------------- | ----------------------- |
| `id`         | SERIAL      | PRIMARY KEY                  | Auto-increment ID       |
| `user_id`    | TEXT        | UNIQUE, REFERENCES users(id) | Foreign key to users    |
| `first_name` | TEXT        | NOT NULL                     | First name              |
| `last_name`  | TEXT        | NULLABLE                     | Last name               |
| `college_id` | INTEGER     | REFERENCES colleges(id)      | Foreign key to colleges |
| `degree_id`  | INTEGER     | REFERENCES degrees(id)       | Foreign key to degrees  |
| `year`       | INTEGER     | NOT NULL, CHECK (1-5)        | Academic year           |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()                | Creation timestamp      |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW()                | Last update timestamp   |

---

### Colleges Table

Stores college/institution information.

| Column       | Type    | Constraints             | Description          |
| ------------ | ------- | ----------------------- | -------------------- |
| `id`         | SERIAL  | PRIMARY KEY             | Auto-increment ID    |
| `name`       | TEXT    | UNIQUE, NOT NULL        | College name         |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT false | Default college flag |

---

### Degrees Table

Stores degree/program information.

| Column       | Type    | Constraints             | Description         |
| ------------ | ------- | ----------------------- | ------------------- |
| `id`         | SERIAL  | PRIMARY KEY             | Auto-increment ID   |
| `name`       | TEXT    | UNIQUE, NOT NULL        | Degree name         |
| `is_default` | BOOLEAN | NOT NULL, DEFAULT false | Default degree flag |

---

### Events Table

Stores event information.

| Column               | Type        | Constraints                                        | Description                         |
| -------------------- | ----------- | -------------------------------------------------- | ----------------------------------- |
| `id`                 | TEXT        | PRIMARY KEY                                        | Auto-generated (format: MLNEXXXXXX) |
| `name`               | TEXT        | NOT NULL                                           | Event name                          |
| `description`        | TEXT        | NOT NULL                                           | Event description                   |
| `participation_type` | TEXT        | NOT NULL, CHECK (solo/team)                        | Solo or team event                  |
| `event_type`         | TEXT        | NOT NULL, CHECK (technical/non-technical/flagship) | Event category                      |
| `max_allowed`        | INTEGER     | NOT NULL, CHECK (>0)                               | Max registrations                   |
| `min_team_size`      | INTEGER     | NOT NULL, DEFAULT 1                                | Minimum team size                   |
| `max_team_size`      | INTEGER     | CHECK (>= min_team_size)                           | Maximum team size                   |
| `venue`              | TEXT        | NOT NULL                                           | Event venue                         |
| `start_time`         | TIMESTAMPTZ | NOT NULL                                           | Event start time                    |
| `end_time`           | TIMESTAMPTZ | NOT NULL                                           | Event end time                      |
| `registration_start` | TIMESTAMPTZ | NOT NULL                                           | Registration start                  |
| `registration_end`   | TIMESTAMPTZ | NOT NULL                                           | Registration end                    |
| `created_by`         | TEXT        | REFERENCES users(id)                               | Event creator                       |
| `created_at`         | TIMESTAMPTZ | DEFAULT NOW()                                      | Creation timestamp                  |
| `updated_at`         | TIMESTAMPTZ | DEFAULT NOW()                                      | Last update timestamp               |

**Constraints:**

- `CHECK (end_time > start_time)`
- `CHECK (registration_end <= start_time)`
- `CHECK (registration_start < registration_end)`

---

### Event Rounds Table

Stores round information for events.

| Column              | Type        | Constraints           | Description           |
| ------------------- | ----------- | --------------------- | --------------------- |
| `id`                | SERIAL      | PRIMARY KEY           | Auto-increment ID     |
| `event_id`          | TEXT        | REFERENCES events(id) | Foreign key to events |
| `round_no`          | INTEGER     | NOT NULL              | Round number          |
| `round_name`        | TEXT        | NOT NULL              | Round name            |
| `round_description` | TEXT        | NOT NULL              | Round description     |
| `start_time`        | TIMESTAMPTZ | NOT NULL              | Round start time      |
| `end_time`          | TIMESTAMPTZ | NOT NULL              | Round end time        |
| `created_at`        | TIMESTAMPTZ | DEFAULT NOW()         | Creation timestamp    |
| `updated_at`        | TIMESTAMPTZ | DEFAULT NOW()         | Last update timestamp |

**Constraints:**

- `UNIQUE(event_id, round_no)`

---

### Round Rules Table

Stores rules for each round.

| Column             | Type        | Constraints                 | Description           |
| ------------------ | ----------- | --------------------------- | --------------------- |
| `id`               | SERIAL      | PRIMARY KEY                 | Auto-increment ID     |
| `event_id`         | TEXT        | REFERENCES events(id)       | Foreign key to events |
| `round_id`         | INTEGER     | REFERENCES event_rounds(id) | Foreign key to rounds |
| `rule_no`          | INTEGER     | NOT NULL                    | Rule number           |
| `rule_description` | TEXT        | NOT NULL                    | Rule description      |
| `created_at`       | TIMESTAMPTZ | DEFAULT NOW()               | Creation timestamp    |
| `updated_at`       | TIMESTAMPTZ | DEFAULT NOW()               | Last update timestamp |

**Constraints:**

- `UNIQUE(round_id, rule_no)`

---

### Event Prizes Table

Stores prize information for events.

| Column         | Type        | Constraints           | Description           |
| -------------- | ----------- | --------------------- | --------------------- |
| `id`           | SERIAL      | PRIMARY KEY           | Auto-increment ID     |
| `event_id`     | TEXT        | REFERENCES events(id) | Foreign key to events |
| `position`     | INTEGER     | NOT NULL, CHECK (>0)  | Prize position        |
| `reward_value` | INTEGER     | NOT NULL, CHECK (>0)  | Prize value           |
| `created_at`   | TIMESTAMPTZ | DEFAULT NOW()         | Creation timestamp    |
| `updated_at`   | TIMESTAMPTZ | DEFAULT NOW()         | Last update timestamp |

**Constraints:**

- `UNIQUE(event_id, position)`

---

### Event Registrations Table

Tracks event registrations.

| Column          | Type        | Constraints                             | Description                 |
| --------------- | ----------- | --------------------------------------- | --------------------------- |
| `id`            | SERIAL      | PRIMARY KEY                             | Auto-increment ID           |
| `event_id`      | TEXT        | REFERENCES events(id)                   | Foreign key to events       |
| `team_id`       | TEXT        | REFERENCES teams(id), ON DELETE CASCADE | Team ID (nullable for solo) |
| `user_id`       | TEXT        | REFERENCES users(id)                    | User ID                     |
| `registered_at` | TIMESTAMPTZ | DEFAULT NOW()                           | Registration timestamp      |

**Constraints:**

- `UNIQUE(event_id, user_id)`

---

### Teams Table

Stores team information.

| Column      | Type | Constraints          | Description                         |
| ----------- | ---- | -------------------- | ----------------------------------- |
| `id`        | TEXT | PRIMARY KEY          | Auto-generated (format: MLNTXXXXXX) |
| `name`      | TEXT | NOT NULL             | Team name                           |
| `leader_id` | TEXT | REFERENCES users(id) | Team leader                         |

---

### Team Members Table

Junction table for team members.

| Column      | Type        | Constraints                             | Description    |
| ----------- | ----------- | --------------------------------------- | -------------- |
| `user_id`   | TEXT        | REFERENCES users(id)                    | Member user ID |
| `team_id`   | TEXT        | REFERENCES teams(id), ON DELETE CASCADE | Team ID        |
| `joined_at` | TIMESTAMPTZ | DEFAULT NOW()                           | Join timestamp |

**Constraints:**

- `PRIMARY KEY(user_id, team_id)`

---

### Invitations Table

Stores team invitation records.

| Column       | Type   | Constraints                                 | Description       |
| ------------ | ------ | ------------------------------------------- | ----------------- |
| `id`         | SERIAL | PRIMARY KEY                                 | Auto-increment ID |
| `team_id`    | TEXT   | REFERENCES teams(id), ON DELETE CASCADE     | Team ID           |
| `status`     | TEXT   | NOT NULL, CHECK (pending/accepted/declined) | Invitation status |
| `inviter_id` | TEXT   | REFERENCES users(id)                        | Inviter user ID   |
| `invitee_id` | TEXT   | REFERENCES users(id), ON DELETE SET NULL    | Invitee user ID   |

---

### Event Crews Table

Stores event crew (volunteers/organizers) assignments.

| Column        | Type        | Constraints                              | Description          |
| ------------- | ----------- | ---------------------------------------- | -------------------- |
| `event_id`    | TEXT        | REFERENCES events(id), ON DELETE CASCADE | Event ID             |
| `user_id`     | TEXT        | REFERENCES users(id), ON DELETE CASCADE  | User ID              |
| `assigned_by` | TEXT        | REFERENCES users(id), ON DELETE SET NULL | Assigner user ID     |
| `created_at`  | TIMESTAMPTZ | DEFAULT NOW()                            | Assignment timestamp |

**Constraints:**

- `PRIMARY KEY(event_id, user_id)`

---

### Payments Table

Stores payment transaction records.

| Column                        | Type          | Constraints                                    | Description             |
| ----------------------------- | ------------- | ---------------------------------------------- | ----------------------- |
| `id`                          | SERIAL        | PRIMARY KEY                                    | Auto-increment ID       |
| `user_id`                     | TEXT          | REFERENCES users(id)                           | User ID                 |
| `order_id`                    | TEXT          | NOT NULL                                       | Razorpay order ID       |
| `payment_id`                  | TEXT          | NULLABLE                                       | Razorpay payment ID     |
| `email`                       | TEXT          | NOT NULL                                       | User email              |
| `payment_status`              | TEXT          | NOT NULL, CHECK (CREATED/PAID/FAILED/REFUNDED) | Payment status          |
| `payment_method`              | VARCHAR(50)   | NULLABLE                                       | Payment method          |
| `amount`                      | DECIMAL(10,2) | NOT NULL                                       | Payment amount          |
| `created_at`                  | TIMESTAMPTZ   | DEFAULT NOW()                                  | Creation timestamp      |
| `updated_at`                  | TIMESTAMPTZ   | DEFAULT NOW()                                  | Last update timestamp   |
| `paid_at`                     | TIMESTAMPTZ   | NULLABLE                                       | Payment completion time |
| `gateway_response`            | JSONB         | NULLABLE                                       | Razorpay response       |
| `razorpay_order_created_at`   | TIMESTAMPTZ   | NULLABLE                                       | Order creation time     |
| `razorpay_payment_created_at` | TIMESTAMPTZ   | NULLABLE                                       | Payment creation time   |

---

### Coupons Table

Stores discount coupon codes.

| Column       | Type        | Constraints      | Description        |
| ------------ | ----------- | ---------------- | ------------------ |
| `id`         | SERIAL      | PRIMARY KEY      | Auto-increment ID  |
| `code`       | TEXT        | UNIQUE, NOT NULL | Coupon code        |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW()    | Creation timestamp |

---

### Coupon Redemptions Table

Tracks coupon redemptions.

| Column        | Type        | Constraints                                       | Description          |
| ------------- | ----------- | ------------------------------------------------- | -------------------- |
| `id`          | SERIAL      | PRIMARY KEY                                       | Auto-increment ID    |
| `user_id`     | TEXT        | UNIQUE, REFERENCES users(id), ON DELETE SET NULL  | Redeeming user       |
| `coupon_id`   | INTEGER     | UNIQUE, REFERENCES coupons(id), ON DELETE CASCADE | Coupon ID            |
| `redeemed_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                           | Redemption timestamp |

---

### Check-ins Table

Tracks participant check-ins.

| Column           | Type        | Constraints                                     | Description        |
| ---------------- | ----------- | ----------------------------------------------- | ------------------ |
| `id`             | SERIAL      | PRIMARY KEY                                     | Auto-increment ID  |
| `participant_id` | TEXT        | UNIQUE, REFERENCES users(id), ON DELETE CASCADE | User ID            |
| `checkedin_at`   | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                         | Check-in timestamp |
| `checkedin_by`   | TEXT        | REFERENCES users(id), ON DELETE SET NULL        | Checker user ID    |

---

### Event Round Check-ins Table

Tracks round-level check-ins.

| Column         | Type        | Constraints                                    | Description        |
| -------------- | ----------- | ---------------------------------------------- | ------------------ |
| `id`           | SERIAL      | PRIMARY KEY                                    | Auto-increment ID  |
| `user_id`      | TEXT        | REFERENCES users(id), ON DELETE CASCADE        | User ID            |
| `round_id`     | INTEGER     | REFERENCES event_rounds(id), ON DELETE CASCADE | Round ID           |
| `team_id`      | TEXT        | REFERENCES teams(id), ON DELETE CASCADE        | Team ID (nullable) |
| `checkedin_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                        | Check-in timestamp |
| `checkedin_by` | TEXT        | REFERENCES users(id), ON DELETE SET NULL       | Checker user ID    |

**Constraints:**

- `UNIQUE(user_id, round_id)`

---

### Round Results Table

Stores round-wise participant results.

| Column     | Type        | Constraints                                         | Description          |
| ---------- | ----------- | --------------------------------------------------- | -------------------- |
| `id`       | SERIAL      | PRIMARY KEY                                         | Auto-increment ID    |
| `round_id` | INTEGER     | REFERENCES event_rounds(id), ON DELETE CASCADE      | Round ID             |
| `user_id`  | TEXT        | REFERENCES users(id), ON DELETE CASCADE             | User ID              |
| `team_id`  | TEXT        | REFERENCES teams(id), ON DELETE CASCADE             | Team ID              |
| `points`   | INTEGER     | NOT NULL, CHECK (0-100)                             | Score points         |
| `status`   | TEXT        | NOT NULL, CHECK (ELIMINATED/DISQUALIFIED/QUALIFIED) | Result status        |
| `eval_by`  | TEXT        | REFERENCES users(id), ON DELETE SET NULL            | Evaluator user ID    |
| `eval_at`  | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                             | Evaluation timestamp |

**Constraints:**

- `UNIQUE(user_id, round_id)`

---

### Event Results Table

Stores final event results (winners).

| Column       | Type        | Constraints                              | Description       |
| ------------ | ----------- | ---------------------------------------- | ----------------- |
| `id`         | SERIAL      | PRIMARY KEY                              | Auto-increment ID |
| `event_id`   | TEXT        | REFERENCES events(id), ON DELETE CASCADE | Event ID          |
| `user_id`    | TEXT        | REFERENCES users(id), ON DELETE CASCADE  | User ID           |
| `team_id`    | TEXT        | REFERENCES teams(id), ON DELETE CASCADE  | Team ID           |
| `prize_id`   | INTEGER     | REFERENCES event_prizes(id)              | Prize position    |
| `points`     | INTEGER     | NOT NULL, DEFAULT 0, CHECK (>=0)         | Final score       |
| `awarded_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW()                  | Award timestamp   |
| `awarded_by` | TEXT        | REFERENCES users(id), ON DELETE SET NULL | Awarder user ID   |

**Constraints:**

- `UNIQUE(event_id, user_id)`

---

### Migrations Table

Tracks applied database migrations.

| Column        | Type        | Constraints      | Description         |
| ------------- | ----------- | ---------------- | ------------------- |
| `id`          | SERIAL      | PRIMARY KEY      | Auto-increment ID   |
| `name`        | TEXT        | UNIQUE, NOT NULL | Migration name      |
| `executed_at` | TIMESTAMPTZ | DEFAULT NOW()    | Execution timestamp |

---

## Custom Functions

### gen_id(entity CHAR)

Generates unique IDs with format: `MLN{ENTITY}{6-char-alphanumeric}`

Example: `MLNUABC123` (User), `MLNEABC123` (Event), `MLNTABC123` (Team)

```sql
CREATE OR REPLACE FUNCTION gen_id(entity CHAR)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
-- Generates 3 random letters + 3 random numbers
-- Prefixed with 'MLN' + entity character
$$;
```

### update_updated_at()

Automatic trigger function for `updated_at` columns.

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Indexes

### Profile

- `idx_profile_user_id` ON `profile(user_id)`

### Events

- `idx_events_event_type` ON `events(event_type)`
- `idx_events_start_time` ON `events(start_time)`
- `idx_events_registration_window` ON `events(registration_start, registration_end)`

### Event Rounds

- `idx_event_rounds_event_id` ON `event_rounds(event_id)`
- `idx_event_rounds_event_round_no` ON `event_rounds(event_id, round_no)`

### Round Rules

- `idx_round_rules_round_id` ON `round_rules(round_id)`
- `idx_round_rules_round_rule_no` ON `round_rules(round_id, rule_no)`

### Event Prizes

- `idx_event_prizes_event_id` ON `event_prizes(event_id)`
- `idx_event_prizes_event_position` ON `event_prizes(event_id, position)`

### Event Crew

- `idx_event_crews_event_id` ON `event_crews(event_id)`
- `idx_event_crews_user_id` ON `event_crews(user_id)`

### Team Members

- `idx_team_members_team_id` ON `team_members(team_id)`
- `idx_team_members_user_id` ON `team_members(user_id)`

### Registrations

- `idx_event_registrations_event_id` ON `event_registrations(event_id)`
- `idx_event_registrations_user_id` ON `event_registrations(user_id)`

### Payments

- `idx_payments_user_id` ON `payments(user_id)`
- `idx_payments_order_id` ON `payments(order_id)`
- `idx_payments_payment_id` ON `payments(payment_id)`
- `idx_payments_payment_status` ON `payments(payment_status)`

### Invitations

- `idx_invitations_invitee_id` ON `invitations(invitee_id)`
- `idx_invitations_team_id` ON `invitations(team_id)`
- `idx_invitations_status` ON `invitations(status)`

### Check-ins

- `idx_check_ins_participant_id` ON `check_ins(participant_id)`
- `idx_check_ins_checkedin_at` ON `check_ins(checkedin_at)`
- `idx_event_round_checkins_user_id` ON `event_round_checkins(user_id)`
- `idx_event_round_checkins_round_id` ON `event_round_checkins(round_id)`
- `idx_event_round_checkins_team_id` ON `event_round_checkins(team_id)`

### Round Results

- `idx_round_results_round_id` ON `round_results(round_id)`
- `idx_round_results_user_id` ON `round_results(user_id)`
- `idx_round_results_team_id` ON `round_results(team_id)`
- `idx_round_results_status` ON `round_results(status)`

### Event Results

- `idx_event_results_event_id` ON `event_results(event_id)`
- `idx_event_results_user_id` ON `event_results(user_id)`
- `idx_event_results_team_id` ON `event_results(team_id)`
- `idx_event_results_prize_id` ON `event_results(prize_id)`

### Coupons

- `idx_coupon_redemptions_user_id` ON `coupon_redemptions(user_id)`

---

## Relationships

| Relationship          | From Table                    | To Table        | Type |
| --------------------- | ----------------------------- | --------------- | ---- |
| User Profile          | profile.user_id               | users.id        | 1:1  |
| User College          | profile.college_id            | colleges.id     | N:1  |
| User Degree           | profile.degree_id             | degrees.id      | N:1  |
| Event Creator         | events.created_by             | users.id        | N:1  |
| Event Round           | event_rounds.event_id         | events.id       | 1:N  |
| Round Rules           | round_rules.round_id          | event_rounds.id | 1:N  |
| Round Results         | round_results.round_id        | event_rounds.id | 1:N  |
| Round Results         | round_results.user_id         | users.id        | N:1  |
| Round Results         | round_results.team_id         | teams.id        | N:1  |
| Event Prizes          | event_prizes.event_id         | events.id       | 1:N  |
| Event Registrations   | event_registrations.event_id  | events.id       | N:1  |
| Event Registrations   | event_registrations.user_id   | users.id        | N:1  |
| Event Registrations   | event_registrations.team_id   | teams.id        | N:1  |
| Team Leader           | teams.leader_id               | users.id        | N:1  |
| Team Members          | team_members.user_id          | users.id        | N:1  |
| Team Members          | team_members.team_id          | teams.id        | N:1  |
| Invitations           | invitations.team_id           | teams.id        | N:1  |
| Invitations           | invitations.inviter_id        | users.id        | N:1  |
| Invitations           | invitations.invitee_id        | users.id        | N:1  |
| Event Crew            | event_crews.event_id          | events.id       | N:1  |
| Event Crew            | event_crews.user_id           | users.id        | N:1  |
| Payments              | payments.user_id              | users.id        | N:1  |
| Check-ins             | check_ins.participant_id      | users.id        | N:1  |
| Event Round Check-ins | event_round_checkins.user_id  | users.id        | N:1  |
| Event Round Check-ins | event_round_checkins.round_id | event_rounds.id | N:1  |
| Event Results         | event_results.event_id        | events.id       | N:1  |
| Event Results         | event_results.user_id         | users.id        | N:1  |
| Event Results         | event_results.prize_id        | event_prizes.id | N:1  |
| Coupon Redemptions    | coupon_redemptions.user_id    | users.id        | N:1  |
| Coupon Redemptions    | coupon_redemptions.coupon_id  | coupons.id      | N:1  |
