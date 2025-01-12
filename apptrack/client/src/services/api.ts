// client/src/services/api.ts
import { JobApplication, Email } from '../types';

const API_URL = 'http://localhost:3001/api';

interface EmailData {
    _id: string;
    subject: string;
    content: string;
    from: string;
    receivedDate: string;
    isApplicationEmail: boolean;
}

export const fetchEmails = async (): Promise<EmailData[]> => {
    try {
        const response = await fetch(`${API_URL}/emails/training`);
        if (!response.ok) {
            throw new Error('Failed to fetch training emails');
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching training emails:', error);
        throw error;
    }
};

export const testParseEmail = async (emailId: string): Promise<{
    originalEmail: EmailData;
    parsedResult: JobApplication;
}> => {
    try {
        const response = await fetch(`${API_URL}/parse/test/${emailId}`);
        if (!response.ok) {
            throw new Error('Failed to test parse email');
        }
        return response.json();
    } catch (error) {
        console.error('Error testing email parse:', error);
        throw error;
    }
};

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

export const parseEmail = async (emailData: {
    subject: string;
    content: string;
    from_email: string;
}): Promise<JobApplication> => {
    try {
        const response = await fetch('http://localhost:8000/parse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData),
        });

        if (!response.ok) {
            throw new Error('Failed to parse email');
        }

        return response.json();
    } catch (error) {
        console.error('Error parsing email:', error);
        throw error;
    }
};

export const fetchApplicationEmails = async (applicationId: string): Promise<Email[]> => {
    try {
        const response = await fetch(`${API_URL}/applications/${applicationId}/emails`);
        if (!response.ok) {
            throw new Error('Failed to fetch application emails');
        }
        return response.json();
    } catch (error) {
        console.error('Error fetching application emails:', error);
        throw error;
    }
};
