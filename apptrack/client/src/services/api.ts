import { JobApplication } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchApplications = async (): Promise<JobApplication[]> => {
    try{
        const response = await fetch(`${API_URL}/applications`);
        if(!response.ok) {
            throw new Error('Failed to fetch applications');
        }
        return response.json();
    } catch(error){
        console.error('Error fetching applications');
        throw error;
    }
}