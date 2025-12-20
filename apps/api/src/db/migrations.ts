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
}

runMigration("create gen_id func", async () => {
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

runMigration("melinia db init", async () => {
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
            first_name TEXT NOT NULL,
            last_name TEXT,
            email TEXT UNIQUE NOT NULL,
            passwd TEXT NOT NULL,
            ph_no VARCHAR(10) UNIQUE NOT NULL,
            college_id INTEGER REFERENCES colleges(id),
            degree_id INTEGER REFERENCES degrees(id),
            other_degree TEXT, --Populated only when the user chose 'Other' degree. 
            year INTEGER NOT NULL CHECK(year BETWEEN 1 AND 5),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

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
    await sql`DROP TYPE IF EXISTS part_type CASCADE;`;
    await sql`CREATE TYPE part_type AS ENUM('SOLO', 'TEAM');`;
    await sql`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY DEFAULT gen_id('E'),
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            participation_type part_type NOT NULL DEFAULT 'SOLO', -- type 'SOLO' or 'TEAM'
            max_allowed INTEGER NOT NULL CHECK (max_allowed > 0), -- max allowed team or solo
            venue TEXT NOT NULL,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            registration_start TIMESTAMP NOT NULL,
            registration_end TIMESTAMP NOT NULL,
            created_by TEXT REFERENCES users(id) ON DELETE SET NULL,

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_organizers (
            event_id TEXT NOT NULL REFERENCES events(id),
            user_id TEXT NOT NULL REFERENCES users(id),
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_by TEXT REFERENCES users(id) ON DELETE SET NULL,
            PRIMARY KEY(event_id, user_id) 
        );
    `;

    await sql`
        CREATE TABLE IF NOT EXISTS event_volunteers (
            event_id TEXT NOT NULL REFERENCES events(id),
            user_id TEXT NOT NULL REFERENCES users(id),
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
            team_id TEXT NOT NULL REFERENCES teams(id),
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(user_id, team_id)
        );
    `
});