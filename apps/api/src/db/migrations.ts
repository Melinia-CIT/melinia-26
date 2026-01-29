import sql from "./connection"
import { seedColleges, seedDegrees } from "./seed"

await sql`
    CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
    );
`

async function runMigration(name: string, migrationFn: (tx: typeof sql) => Promise<void>): Promise<void> {
	await sql.begin(async (tx) => {
		const [exists] = await tx`SELECT 1 FROM migrations WHERE name = ${name}`

		if (exists) {
			console.log(`Skipping ${name} as already ran`);
			return;
		}

		console.log(`Running migration "${name}"`);

		await migrationFn(tx);

		await tx`
            INSERT INTO migrations(name)
            VALUES (${name})
        `;

		console.log(`Ok "${name}"`);
	});

	return;
}

await runMigration("create gen_id func", async (tx) => {
	await tx`
        CREATE OR REPLACE FUNCTION gen_id(entity CHAR)
        RETURNS TEXT
        LANGUAGE plpgsql
        AS $$
        DECLARE
            letters TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            numbers TEXT := '0123456789';
            result TEXT := '';
            chars TEXT[] := ARRAY['','','','','',''];  -- 6 empty slots
            letter_count INT := 0;
            number_count INT := 0;
            i INT;
            rand_pos INT;
        BEGIN
            -- Place 3 random letters
            WHILE letter_count < 3 LOOP
                rand_pos := floor(random() * 6 + 1)::int;
                IF chars[rand_pos] = '' THEN
                    chars[rand_pos] := substr(letters, floor(random() * 26 + 1)::int, 1);
                    letter_count := letter_count + 1;
                END IF;
            END LOOP;
            
            -- Fill remaining positions with numbers
            FOR i IN 1..6 LOOP
                IF chars[i] = '' THEN
                    chars[i] := substr(numbers, floor(random() * 10 + 1)::int, 1);
                END IF;
            END LOOP;
            
            -- Concatenate array into result
            result := array_to_string(chars, '');
            
            RETURN 'MLN' || entity || result;
        END;
        $$;
    `
})

await runMigration("melinia db init", async (tx) => {
	//colleges
	await tx`
        CREATE TABLE IF NOT EXISTS colleges (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

	//degrees
	await tx`
        CREATE TABLE IF NOT EXISTS degrees (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

	//roles
	await tx`
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

	//users
	await tx`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT gen_id('U'),
            email TEXT UNIQUE NOT NULL,
            ph_no VARCHAR(10) UNIQUE,
            passwd_hash TEXT NOT NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `

	await tx`
        CREATE TABLE IF NOT EXISTS profile (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            first_name TEXT NOT NULL,
            last_name TEXT,
            college_id INTEGER REFERENCES colleges(id),
            degree_id INTEGER REFERENCES degrees(id),
            other_degree TEXT, --Populated only when the user choose 'Other' degree. 
            year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 5),

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `

	// users_roles(junction table)
	await tx`
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            role_id INT REFERENCES roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(user_id, role_id)
        );
    `

	//events
	await tx`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY DEFAULT gen_id('E'),
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            participation_type TEXT NOT NULL DEFAULT 'solo' CHECK (participation_type IN ('solo', 'team')), 
            event_type TEXT NOT NULL CHECK (event_type IN ('technical', 'non-technical', 'flagship')),
            max_allowed INTEGER NOT NULL CHECK (max_allowed > 0),
            min_team_size INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size > 0),
            max_team_size INTEGER CHECK (max_team_size >= min_team_size),
            venue TEXT NOT NULL,
            start_time TIMESTAMPTZ NOT NULL,
            end_time TIMESTAMPTZ NOT NULL,
            registration_start TIMESTAMPTZ NOT NULL,
            registration_end TIMESTAMPTZ NOT NULL,
            created_by TEXT REFERENCES users(id) ON DELETE SET NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            CHECK (end_time > start_time),
            CHECK (registration_end <= start_time),
            CHECK (registration_start < registration_end)
        );
    `

	await tx`
        CREATE TABLE IF NOT EXISTS event_rounds (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            round_no INTEGER NOT NULL,
            round_description TEXT NOT NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(event_id, round_no)
        );
    `

	await tx`
        CREATE TABLE IF NOT EXISTS event_prizes (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            position INTEGER NOT NULL CHECK (position > 0),
            reward_value INTEGER NOT NULL CHECK (reward_value > 0),

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(event_id, position)
        );
    `

	await tx`
        CREATE TABLE IF NOT EXISTS event_crews (
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            PRIMARY KEY(event_id, user_id) 
        );
    `

	// teams
	await tx`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY DEFAULT gen_id('T'),
            name TEXT NOT NULL,
            leader_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            event_id TEXT REFERENCES events(id)
        );
    `

	await tx`
        CREATE TABLE IF NOT EXISTS team_members (
            user_id TEXT NOT NULL REFERENCES users(id),
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, team_id)
        );
    `
})

await runMigration("create invitations", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS invitations (
            id SERIAL PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            inviter_id TEXT NOT NULL REFERENCES users(id),
            invitee_id TEXT REFERENCES users(id)
        );
    `
})

await runMigration("add role column in users table", async (tx) => {
	await tx`
        DO $$
        BEGIN
            CREATE TYPE user_role AS ENUM (
                'PARTICIPANT',
                'VOLUNTEER',
                'ORGANIZER',
                'ADMIN'
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    `

	await tx`
        ALTER TABLE users
        ADD COLUMN role user_role NOT NULL DEFAULT 'PARTICIPANT';
    `
})

await runMigration("add profile completion status", async (tx) => {
	await tx`
        ALTER TABLE users
        ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT false;
    `
})

await runMigration("cascade invitations when team is deleted", async (tx) => {
	await tx`
        ALTER TABLE invitations
        DROP CONSTRAINT IF EXISTS invitations_team_id_fkey;
    `

	await tx`
        ALTER TABLE invitations
        ADD CONSTRAINT invitations_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    `
})

await runMigration("remove user_roles and roles table", async (tx) => {
	await tx`DROP TABLE IF EXISTS user_roles;`
	await tx`DROP TABLE IF EXISTS roles; `
})

await runMigration("automatic updates on updated_at column", async (tx) => {
	await tx`
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    `

	await tx`DROP TRIGGER IF EXISTS update_users_updated_at ON users;`
	await tx`DROP TRIGGER IF EXISTS update_events_updated_at ON events;`
	await tx`DROP TRIGGER IF EXISTS update_profile_updated_at ON profile;`

	await tx`
        CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `

	await tx`
        CREATE TRIGGER update_events_updated_at
        BEFORE UPDATE ON events
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `

	await tx`
        CREATE TRIGGER update_profile_updated_at
        BEFORE UPDATE ON profile
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `
})

await runMigration("create event registrations", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS event_registrations (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id),
            team_id TEXT REFERENCES teams(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, user_id)
        );
    `
})

await runMigration("create payments table", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS payments (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL REFERENCES users(id),
            order_id TEXT NOT NULL,
            payment_id TEXT,

            email TEXT NOT NULL,
            payment_status TEXT NOT NULL CHECK(payment_status IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED')),
            payment_method VARCHAR(50),

            amount DECIMAL(10, 2) NOT NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            paid_at TIMESTAMPTZ,
            gateway_response JSONB
        );
    `
})

await runMigration("add fk in degrees", async (tx) => {
	//TODO: add NOT NULL constraint
	await tx`
        ALTER TABLE degrees
        ADD COLUMN college_id INTEGER REFERENCES colleges(id);
    `
})

await runMigration("update profile schema for degrees and colleges", async (tx) => {
	await tx`
        ALTER TABLE profile
        DROP COLUMN other_degree;
    `

	await tx`
        ALTER TABLE colleges
        ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    `

	await tx`
        ALTER TABLE degrees 
        ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
    `
})

await runMigration("update degrees unique constraint", async (tx) => {
	await tx`
        ALTER TABLE degrees
        DROP CONSTRAINT degrees_name_key;
    `

	await tx`
        ALTER TABLE degrees
        ADD CONSTRAINT degrees_name_college_key UNIQUE(name, college_id);
    `
})

await runMigration("add unique constraint on the user_id in profile", async (tx) => {
	await tx`
        ALTER TABLE profile
        ADD CONSTRAINT profile_user_id_key UNIQUE(user_id);
    `
})

await runMigration("add razorpay timestamps to payments table", async (tx) => {
	await tx`
        ALTER TABLE payments
        ADD COLUMN razorpay_order_created_at TIMESTAMPTZ;
    `

	await tx`
        ALTER TABLE payments
        ADD COLUMN razorpay_payment_created_at TIMESTAMPTZ;
    `
})

await runMigration("add event rules table ", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS round_rules (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            round_id INTEGER NOT NULL REFERENCES event_rounds(id) ON DELETE CASCADE,
            rule_no INTEGER NOT NULL,
            rule_description TEXT NOT NULL,
            
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

            UNIQUE(round_id, rule_no)
        );
    `
})

await runMigration("create user payment status type", async (tx) => {
	await tx`
        DO $$
        BEGIN
            CREATE TYPE user_payment_status AS ENUM (
                'UNPAID', 
                'PAID', 
                'EXEMPTED'
            );
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
    `
})

await runMigration("add payment status column to users", async (tx) => {
	await tx`
        ALTER TABLE users
        ADD COLUMN payment_status user_payment_status NOT NULL DEFAULT 'UNPAID';
    `
})

await runMigration("create single use coupons table", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS coupons (
            id SERIAL PRIMARY KEY,
            code TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `
})

await runMigration("create single use coupon redemptions table", async (tx) => {
	await tx`
        CREATE TABLE IF NOT EXISTS coupon_redemptions (
            id SERIAL PRIMARY KEY,
            user_id TEXT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
            coupon_id INTEGER UNIQUE NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
            redeemed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `
})

await runMigration("cascade event_registration when team is deleted", async (tx) => {
	await tx`
        ALTER TABLE event_registrations
        DROP CONSTRAINT IF EXISTS event_registrations_team_id_fkey
    `

	await tx`
        ALTER TABLE event_registrations
        ADD CONSTRAINT event_registrations_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
    `
})

await runMigration("add round_name", async (tx) => {
	await tx`
        ALTER TABLE event_rounds
        ADD COLUMN round_name TEXT NOT NULL;
    `
})

await runMigration("add unique constraint for degrees name", async (tx) => {
	await tx`
        ALTER TABLE degrees
        ADD CONSTRAINT uniq_degree_name UNIQUE (name);
    `
})

await runMigration("remove college_id ref from degrees", async (tx) => {
	await tx`
        ALTER TABLE degrees
        DROP COLUMN college_id;
    `
})

await runMigration("seed colleges and degress", async (tx) => {
	await seedColleges(tx);
	await seedDegrees(tx);
})

await runMigration("add pg trigram", async (tx) => {
	await tx`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `
});


await runMigration("remove event_id in teams table", async (tx) => {
	await tx`
        ALTER TABLE teams DROP COLUMN event_id;  
    `
});

await runMigration("add updated_at triggers for event rounds, rules, prizes", async (tx) => {
	await tx`DROP TRIGGER IF EXISTS update_event_rounds_updated_at ON event_rounds;`
	await tx`DROP TRIGGER IF EXISTS update_round_rules_updated_at ON round_rules;`
	await tx`DROP TRIGGER IF EXISTS update_event_prizes_updated_at ON event_prizes;`

	await tx`
        CREATE TRIGGER update_event_rounds_updated_at
        BEFORE UPDATE ON event_rounds
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `

	await tx`
        CREATE TRIGGER update_round_rules_updated_at
        BEFORE UPDATE ON round_rules
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `

	await tx`
        CREATE TRIGGER update_event_prizes_updated_at
        BEFORE UPDATE ON event_prizes
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at();
    `
});

await runMigration("add start and end time in event_rounds", async (tx) => {
	await tx`
        ALTER TABLE event_rounds
        ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ NOT NULL,
        ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ NOT NULL;
    `
})

await runMigration("add necessary indexes", async (tx) => {
	// profile
	await tx`CREATE INDEX IF NOT EXISTS idx_profile_user_id ON profile(user_id);`

	// events
	await tx`CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);`
	await tx`CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);`
	await tx`
        CREATE INDEX IF NOT EXISTS idx_events_registration_window
        ON events(registration_start, registration_end);
    `

	// event rounds
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_rounds_event_id
        ON event_rounds(event_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_rounds_event_round_no
        ON event_rounds(event_id, round_no);
    `

	// event rules
	await tx`
        CREATE INDEX IF NOT EXISTS idx_round_rules_round_id
        ON round_rules(round_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_round_rules_round_rule_no
        ON round_rules(round_id, rule_no);
    `

	// event prizes
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_prizes_event_id
        ON event_prizes(event_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_prizes_event_position
        ON event_prizes(event_id, position);
    `

	// event crew
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_crews_event_id
        ON event_crews(event_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_crews_user_id
        ON event_crews(user_id);
    `

	// team members
	await tx`
        CREATE INDEX IF NOT EXISTS idx_team_members_team_id
        ON team_members(team_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_team_members_user_id
        ON team_members(user_id);
    `

	// registrations
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id
        ON event_registrations(event_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id
        ON event_registrations(user_id);
    `

	// payments
	await tx`
        CREATE INDEX IF NOT EXISTS idx_payments_user_id
        ON payments(user_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_payments_order_id
        ON payments(order_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_payments_payment_id
        ON payments(payment_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_payments_payment_status
        ON payments(payment_status);
    `

	// invitations
	await tx`
        CREATE INDEX IF NOT EXISTS idx_invitations_invitee_id
        ON invitations(invitee_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_invitations_team_id
        ON invitations(team_id);
    `
	await tx`
        CREATE INDEX IF NOT EXISTS idx_invitations_status
        ON invitations(status);
    `

	// coupons
	await tx`
        CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user_id
        ON coupon_redemptions(user_id);
    `
});

await runMigration("remove second check constraint from events table ", async (tx) => {

	await tx`ALTER TABLE events DROP CONSTRAINT events_check2`;

})

await sql.end();

