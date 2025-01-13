// client/src/services/api.ts
import { JobApplication, Email } from '../types';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_URL,
    withCredentials: true
});
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
        const response = await api.get('/api/emails/training');
        return response.data;
    } catch (error) {
        console.error('Error fetching training emails:', error);
        throw error;
    }
};

export const testParseEmail = async (emailId: string) => {
    try {
        const response = await api.get(`/api/parse/test/${emailId}`);
        return response.data;
    } catch (error) {
        console.error('Error testing email parse:', error);
        throw error;
    }
};

export const fetchApplications = async (): Promise<JobApplication[]> => {
    try{
        const response = await api.get('/api/applications');
        return response.data;
    } catch(error){
        console.error('Error fetching applications');
        throw error;
    }
};

export const createApplication = async (application: Omit<JobApplication, '_id'>): Promise<JobApplication> => {
    try {
        const response = await api.post('/api/applications', application);
        return response.data;
    } catch (error) {
        console.error('Error creating application:', error);
        throw error;
    }
};

export const deleteApplication = async (id: string): Promise<void> => {
    try {
        await api.delete(`/api/applications/${id}`);
    } catch (error) {
        console.error('Error deleting application:', error);
        throw error;
    }
};

export const updateApplication = async (id: string, application: Omit<JobApplication, '_id'>): Promise<JobApplication> => {
    try {
        const response = await api.put(`/api/applications/${id}`, application);
        return response.data;
    } catch (error) {
        console.error('Error updating application:', error);
        throw error;
    }
};

export const parseEmail = async (emailData: {
    subject: string;
    content: string;
    from_email: string;
}): Promise<JobApplication> => {
    try {
        const response = await axios.post('http://localhost:8000/parse', emailData);
        return response.data;
    } catch (error) {
        console.error('Error parsing email:', error);
        throw error;
    }
};

export const fetchApplicationEmails = async (applicationId: string): Promise<Email[]> => {
    try {
        const response = await api.get(`/api/applications/${applicationId}/emails`);
        return response.data;
    } catch (error) {
        console.error('Error fetching application emails:', error);
        throw error;
    }
};

