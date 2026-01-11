import api from './api';
import {type CreateTeam, type AddNewMemberRequest} from "@melinia/shared";

export class TeamManagementService{
    private static instance: TeamManagementService;

    public static getInstance():TeamManagementService{
        if (!TeamManagementService.instance) {
            TeamManagementService.instance = new TeamManagementService();
        }
        return TeamManagementService.instance;
    }

    public createTeam = async(formData: CreateTeam)=>{
        console.log("form data:", formData)
        const response =await api.post("/teams", formData);
        return response;
    };
    
    public getTeamDetails = async (team_id:string)=>{
        const response = await api.get(`/teams/${team_id}`);
        return response.data;
    };

    public deleteTeam = async (team_id:string)=>{
        const response = await api.delete(`/teams/${team_id}`);
        return response;
    };

    public teamList = async ()=>{
        const response = await api.get(`/teams?filter=all`);
        return response.data;
    }
  
    public getInvitations = async (invitationID:number)=>{
        const response = await api.get(`/teams/pending_invitations/${invitationID}`);
        return response.data;
    }
    public deleteInvitation = async (teamID:string, invitationID:string)=>{
        const response = await api.delete(`/teams/${teamID}/pending_invitations/${invitationID}`);
        return response;
    }

    public addMember = async (emailID:AddNewMemberRequest, teamID:string)=>{
        const response = await api.post(`/teams/${teamID}/members`, emailID);
        return response;
    }
    public getInvitationsForUser = async ()=>{
        const response = await api.get(`/me/invites`);
        return response;
    }
    public acceptInvitation = async (invitationID:number)=>{
        const response = await api.post(`/pending_invitations/:${invitationID}`);
        return response;
    }

    public declineInviation = async (invitationID:number)=>{
        const response = await api.put(`/pending_invitations/:${invitationID}`);
        return response;
    }

};

export const team_management = new TeamManagementService();