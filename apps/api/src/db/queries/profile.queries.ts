import sql from "../connection";
import {type Profile, profileSchema} from "@melinia/shared/dist";

export async function getProfile(id:string): Promise<Profile> {
    const user_details = await sql`
        SELECT p.first_name,
               p.last_name,
               c.name as college_name,
               d.name as degree_name,
               p.other_degree,
               p.year
        FROM profile p
        LEFT JOIN colleges c ON p.college_id = c.id
        LEFT JOIN degrees d ON p.degree_id = d.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE u.id = ${id}
`;
    return profileSchema.parse(user_details);
    
}

/*
export async function createProfile(id : string, profile : Profile) {

	const {firstName,lastName, college, degree, year, otherDegree } = profile;



}*/
