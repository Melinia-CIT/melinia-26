import sql from './connection';

await sql`
    CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
    );
`;

async function runMigration(name: string, migrationFn: () => Promise<void>): Promise<void> {
    const [exists] = await sql`SELECT * FROM migrations WHERE name = ${name}`;

    if (!exists) {
        console.log(`Running migration ${name}`);
        await migrationFn();
        await sql`INSERT INTO migrations(name) VALUES(${name})`;
        console.log(`Ok "${name}"`);
    }

    return;
}

await runMigration("create gen_id func", async () => {
    await sql`
        CREATE OR REPLACE FUNCTION gen_id(entity CHAR)
        RETURNS TEXT
        AS $$
            DECLARE
                id TEXT;
            BEGIN
                id := 'MLN' || entity || LPAD(FLOOR(random() * 1000000)::TEXT, 6, '0');
                RETURN id;
            END;
        $$ LANGUAGE plpgsql;
    `;
});

await runMigration("melinia db init", async () => {
    //colleges
    await sql`
        CREATE TABLE IF NOT EXISTS colleges (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `;

    //degrees
    await sql`
        CREATE TABLE IF NOT EXISTS degrees (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `;

    //roles
    await sql`
        CREATE TABLE IF NOT EXISTS roles (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );
    `;

    //users
    await sql`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY DEFAULT gen_id('U'),
            email TEXT UNIQUE NOT NULL,
            ph_no VARCHAR(10) UNIQUE,
            passwd_hash TEXT NOT NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

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

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `

    // users_roles(junction table)
    await sql`
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
            role_id INT REFERENCES roles(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(user_id, role_id)
        );
    `;

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
            status TEXT NOT NULL DEFAULT 'not-started',
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            registration_start TIMESTAMP NOT NULL,
            registration_end TIMESTAMP NOT NULL,
            created_by TEXT REFERENCES users(id) ON DELETE SET NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

            CHECK (end_time > start_time),
            CHECK (registration_end <= start_time),
            CHECK (registration_start < registration_end)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_rounds (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            round_no INTEGER NOT NULL CHECK (round_no > 0),
            round_description TEXT NOT NULL,
            UNIQUE(event_id, round_no)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_prizes (
            id SERIAL PRIMARY KEY,
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            position INTEGER NOT NULL CHECK (position > 0),
            reward_value INTEGER NOT NULL CHECK (reward_value > 0),
            UNIQUE(event_id, position)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_organizers (
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(event_id, user_id) 
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_volunteers (
            event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(event_id, user_id) 
        );
    `;

    // teams
    await sql`
        CREATE TABLE IF NOT EXISTS teams (
            id TEXT PRIMARY KEY DEFAULT gen_id('T'),
            name TEXT NOT NULL,
            leader_id TEXT NOT NULL REFERENCES users(id),
            event_id TEXT REFERENCES events(id)
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS team_members (
            user_id TEXT NOT NULL REFERENCES users(id),
            team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, team_id)
        );
    `;

    // qr tags 
    await sql`
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid(), -- this will be the qr value as well.
            status TEXT NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'revoked')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // check-in
    await sql`
        CREATE TABLE IF NOT EXISTS checkin (
            id SERIAL PRIMARY KEY,
            tag_id TEXT UNIQUE NOT NULL REFERENCES tags(id),
            user_id TEXT UNIQUE NOT NULL REFERENCES users(id),
            checked_in_at TIMESTAMP NOT NULL
        );
    `;
});

await runMigration("create invitations", async () => {
    await sql`
        CREATE TABLE IF NOT EXISTS invitations (
            id SERIAL PRIMARY KEY,
            team_id TEXT NOT NULL REFERENCES teams(id),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
            inviter_id TEXT NOT NULL REFERENCES users(id),
            invitee_id TEXT REFERENCES users(id)
        );
    `;
});

await runMigration("add role column in users table", async () => {
    await sql.begin(async (tx) => {
        await tx`
            CREATE TYPE user_role as ENUM (
                'PARTICIPANT',
                'VOLUNTEER',
                'ORGANIZER',
                'ADMIN'
            );
        `;

        await tx`
            ALTER TABLE users
            ADD COLUMN role user_role NOT NULL DEFAULT 'PARTICIPANT';
        `;
    });
})

await runMigration("add profile completion status", async () => {
    await sql`
        ALTER TABLE users
        ADD COLUMN profileCompleted BOOLEAN NOT NULL DEFAULT false;
    `;
});

await sql.end();