import api from './api';
import {type CreateTeam} from "@melinia/shared";

export class TeamManagementService{
    private static instance: TeamManagementService;

    public static getInstance():TeamManagementService{
        if (!TeamManagementService.instance) {
            TeamManagementService.instance = new TeamManagementService();
        }
        return TeamManagementService.instance;
    }

    public createTeam = async(formData: CreateTeam)=>{
        const response =await api.post("/teams", formData);
        return response;
    };
    
    public getTeamDetails = async (team_id:string)=>{
        const response = await api.get(`/teams/${team_id}`);
        return response;
    };

    public deleteTeam = async (team_id:string)=>{
        const response = await api.delete(`/teams/${team_id}`);
        return response;
    };

};

export const team_management = new TeamManagementService();