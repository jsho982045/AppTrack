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

export const deleteApplication = async (id: string): Promise<void> => {
    try{
        const response = await fetch(`${API_URL}/applications/${id}`, {
            method: 'DELETE'
        });
        if(!response.ok){
            throw new Error('Failed to delete application');
        }
    } catch(error) {
        console.error('Error deleting application: ', error);
        throw error;
    }
};

export const updateApplication = async (id: string, application: Omit<JobApplication, '_id'>): Promise<JobApplication> => {
    try{
        const response = await fetch(`${API_URL}/applications/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(application)
        });
        if(!response.ok) {
            throw new Error('Failed to update application');
        }
        return response.json();
    } catch (error) {
        console.error('Error updating applications:', error);
        throw error;
    }
};


