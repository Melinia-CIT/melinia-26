import { Hono } from "hono";
import { getColleges } from "../db/queries/colleges.queries";

export const college = new Hono();

college.get("/", async (c) => {
    const data = await getColleges();

    return c.json(data);
});
