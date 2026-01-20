import { EventRegistrationInput, UnregisterEventInput } from '@melinia/shared';
import api from './api';

export class EventManagementService{
    private static instance: EventManagementService;

    public static getInstance(): EventManagementService{
        if(!EventManagementService.instance){
            EventManagementService.instance =  new EventManagementService();
        }
        return EventManagementService.instance;
    }
   public getAllEvents = async ()=>{
        const response = api.get(`/events`);
        return response;
    }
    public getEventDetails = async (event_id:string)=>{
        const response = api.get(`/events/:${event_id}`);
        return response;
    }
    public getRegisteredEvents = async ()=>{
        const response = api.get(`/events/registered`);
        return response;
    }
    public registerEvent = async (input: EventRegistrationInput, event_id:string)=>{
        const response = api.post(`/events/:${event_id}/register`, input);
        return response;
    }
    public deregisterEvent = async (input: UnregisterEventInput, event_id:string)=>{
        const response = api.post(`/events/:${event_id}/unregister`, input)
        return response;
    }
     public isRegistered = async(event_id:string, team_id:string)=>{
        const response = api.get(`/events/:${event_id}?team_id=${team_id}`);
        return response;
    } 
}
export const event_mangament = new EventManagementService();