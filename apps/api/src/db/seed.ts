import { join } from "path"
import sql from "./connection"


export async function seedColleges(tx: typeof sql): Promise<void> {
    const colleges = (await Bun.file(join(import.meta.dir, "data", "colleges")).text())
        .trim()
        .split("\n")
        .map(name => name.trim())
        .filter(name => name.length > 0)

    await tx`
        INSERT INTO colleges (name, is_default)
        SELECT unnest(${colleges}::text[]), TRUE 
        ON CONFLICT (name) DO NOTHING;
    `;
}

export async function seedDegrees(tx: typeof sql): Promise<void> {
    const degrees = (await Bun.file(join(import.meta.dir, "data", "degrees")).text())
        .trim()
        .split("\n")
        .map(name => name.trim())
        .filter(name => name.length > 0)

    await tx`
        INSERT INTO degrees (name, is_default)
        SELECT unnest(${degrees}::text[]), TRUE
        ON CONFLICT (name) DO NOTHING;
    `;
}
