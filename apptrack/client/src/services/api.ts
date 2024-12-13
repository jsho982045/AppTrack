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

export const createApplication = async (application: Omit<JobApplication, '_id'>): Promise<JobApplication> => {
    try{
        const response = await fetch(`${API_URL}/applications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(application)
        });
        if(!response.ok) {
            throw new Error('Failed to create application');
        }
        return response.json();
    } catch(error) {
        console.error('Error creating application:', error);
        throw error;
    }
};

