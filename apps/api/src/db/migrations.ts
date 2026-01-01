import sql from "./connection"

await sql`
    CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
    );
`

async function runMigration(name: string, migrationFn: () => Promise<void>): Promise<void> {
    const [exists] = await sql`SELECT * FROM migrations WHERE name = ${name}`

    if (!exists) {
        console.log(`Running migration ${name}`)
        await migrationFn()
        await sql`INSERT INTO migrations(name) VALUES(${name})`
        console.log(`Ok "${name}"`)
    }

    return
}

await runMigration("create gen_id func", async () => {
    await sql`
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

await runMigration("melinia db init", async () => {
    //colleges
    await sql`
        CREATE TABLE IF NOT EXISTS colleges (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

    //degrees
    await sql`
        CREATE TABLE IF NOT EXISTS degrees (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

    //roles
    await sql`
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `

    //users
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT gen_id('U'),
            email TEXT UNIQUE NOT NULL,
            ph_no VARCHAR(10) UNIQUE,
            passwd_hash TEXT NOT NULL,

            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `

    await sql`
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
        )
    `

    // users_roles(junction table)
    await sql`
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            role_id INT REFERENCES roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(user_id, role_id)
        );
    `

    //events
    await sql`
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

    await sql`
        CREATE TABLE IF NOT EXISTS event_rounds (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            round_no INTEGER NOT NULL CHECK (round_no > 0),
            round_description TEXT NOT NULL,
            UNIQUE(event_id, round_no)
        );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS event_prizes (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            position INTEGER NOT NULL CHECK (position > 0),
            reward_value INTEGER NOT NULL CHECK (reward_value > 0),
            UNIQUE(event_id, position)
        );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS event_organizers (
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(event_id, user_id) 
        );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS event_volunteers (
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(event_id, user_id) 
        );
    `

    // teams
    await sql`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY DEFAULT gen_id('T'),
            name TEXT NOT NULL,
            leader_id TEXT NOT NULL REFERENCES users(id),
            event_id TEXT REFERENCES events(id)
        );
    `

    await sql`
        CREATE TABLE IF NOT EXISTS team_members (
            user_id TEXT NOT NULL REFERENCES users(id),
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, team_id)
        );
    `

    // qr tags
    await sql`
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), -- this will be the qr value as well.
            status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'revoked')),
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
    `

    // check-in
    await sql`apps/api/src/db/migrations.ts
        CREATE TABLE IF NOT EXISTS checkin (
            id SERIAL PRIMARY KEY,
            tag_id TEXT UNIQUE NOT NULL REFERENCES tags(id),
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
            checked_in_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
    `
})

await runMigration("create invitations", async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS invitations (
            id SERIAL PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            inviter_id TEXT NOT NULL REFERENCES users(id),
            invitee_id TEXT REFERENCES users(id)
        );
    `
})

await runMigration("add role column in users table", async () => {
    await sql.begin(async tx => {
        await tx`
            CREATE TYPE user_role as ENUM (
                'PARTICIPANT',
                'VOLUNTEER',
                'ORGANIZER',
                'ADMIN'
            );
        `

        await tx`
            ALTER TABLE users
            ADD COLUMN role user_role NOT NULL DEFAULT 'PARTICIPANT';
        `
    })
})

await runMigration("add profile completion status", async () => {
    await sql`
        ALTER TABLE users
        ADD COLUMN profile_completed BOOLEAN NOT NULL DEFAULT false;
    `
})

await runMigration("cascade invitations when team is deleted", async () => {
    await sql`
        ALTER TABLE invitations
        DROP CONSTRAINT IF EXISTS invitations_team_id_fkey;
    `

    await sql`
        ALTER TABLE invitations
        ADD CONSTRAINT invitations_team_id_fkey 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;
    `
})

await runMigration("remove user_roles and roles table", async () => {
    await sql.begin(async tx => {
        await tx`DROP TABLE user_roles;`
        await tx`DROP TABLE roles; `
    })
})

await runMigration("automatic updates on updated_at column", async () => {
    await sql.begin(async tx => {
        await tx`
            CREATE OR REPLACE FUNCTION update_updated_at()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `

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
})

await runMigration("create event registrations", async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS event_registrations (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id),
            team_id TEXT REFERENCES teams(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            registered_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(event_id, team_id, user_id)
        );
    `;
})

await runMigration("create payments table", async () => {
    await sql`
  CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    order_id TEXT NOT NULL,
    payment_id TEXT,

    email TEXT NOT NULL,
    payment_status TEXT NOT NULL CHECK(payment_status IN ('CREATED', 'PAID', 'FAILED', 'REFUNDED')),
    payment_method VARCHAR(50),

    amount DECIMAL(10, 2) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP,
    gateway_response JSONB
  )

  `
})

await runMigration("add fk in degrees", async () => {
    //TODO: add NOT NULL constraint
    await sql`
        ALTER TABLE degrees
        ADD COLUMN college_id INTEGER REFERENCES colleges(id);
    `;

});


await runMigration("update profile schema for degrees and colleges", async () => {
    await sql.begin(async (tx) => {
        await tx`
            ALTER TABLE profile
            DROP COLUMN other_degree;
        `;

        await tx`
            ALTER TABLE colleges
            ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
        `;

        await tx`
            ALTER TABLE degrees 
            ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
        `;
    });
});


await runMigration("add fk in degrees", async () => {
    //TODO: add NOT NULL constraint
    await sql`
        ALTER TABLE degrees
        ADD COLUMN college_id INTEGER REFERENCES colleges(id);
    `;
});

await runMigration("update profile schema for degrees and colleges", async () => {
    await sql.begin(async (tx) => {
        await tx`
            ALTER TABLE profile
            DROP COLUMN other_degree;
        `;

        await tx`
            ALTER TABLE colleges
            ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
        `;

        await tx`
            ALTER TABLE degrees 
            ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT false;
        `;
    });
});

await runMigration("update degrees unique constraint", async () => {
    await sql.begin(async (tx) => {
        await tx`
            ALTER TABLE degrees
            DROP CONSTRAINT degrees_name_key;
        `;

        await tx`
            ALTER TABLE degrees
            ADD CONSTRAINT degrees_name_college_key UNIQUE(name, college_id);
        `;
    });
})

await runMigration("add unique constraint on the user_id in profile", async () => {
    await sql`
        ALTER TABLE profile
        ADD CONSTRAINT profile_user_id_key UNIQUE(user_id);
    `;
});



await runMigration("add razorpay timestamps to payments table", async () => {
    await sql`
    ALTER TABLE payments
    ADD COLUMN razorpay_order_created_at TIMESTAMP
  `

    await sql`
    ALTER TABLE payments
    ADD COLUMN razorpay_payment_created_at TIMESTAMP
  `
})

await sql.end();
