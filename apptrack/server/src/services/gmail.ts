// server/src/services/gmail.ts
import { google } from 'googleapis';
import { Token } from '../models/Token';
import { JobApplication } from '../models/JobApplication';
import { getGmailClient } from '../auth/google';

interface ParsedJobInfo {
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied';
    emailConfirmation: string;
}

const parseJobEmailContent = (email: any): ParsedJobInfo | null => {
    const headers = email.data.payload.headers;
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
    const from = headers.find((h: any) => h.name === 'From')?.value || '';
    const body = email.data.snippet || '';

    // Extract company name (usually in the from field or domain)
    let company = from.match(/([^<@]+)@/) 
        ? from.match(/@([^.]+)/)[1] 
        : from.split('<')[0].trim();
    company = company.charAt(0).toUpperCase() + company.slice(1);

    // Try to extract position from subject
    const position = subject.includes('application') 
        ? subject.split('application')[0].trim()
        : 'Position Not Found';

    return {
        company,
        position,
        dateApplied: new Date(),
        status: 'applied',
        emailConfirmation: body
    };
};

export const checkForNewApplications = async () => {
    try {
        const tokenDoc = await Token.findOne();
        console.log('Foundn token document:', tokenDoc);

        if (!tokenDoc) {
            throw new Error('No authentication token found');
        }

        const gmail = await getGmailClient();
        console.log('Gmail client initialized');
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:(application OR applied OR confirmation) newer_than:1d'
        });
        console.log('Found emails:', response.data.messages?.length || 0)

        const messages = response.data.messages || [];
        
        for (const message of messages) {
            console.log('Processing email:', message.id);
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id!,
                format: 'full'
            });

            const jobInfo = parseJobEmailContent(email);
            console.log('Parsed job info:', jobInfo);
            
            if (jobInfo) {
                // Check if this application already exists
                const existingApp = await JobApplication.findOne({
                    company: jobInfo.company,
                    dateApplied: {
                        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
                    }
                });

                if (!existingApp) {
                    const newApp = await JobApplication.create(jobInfo);
                    console.log('New application added:', {
                        company: newApp.company,
                        position: newApp.position,
                        dateApplied: newApp.dateApplied
                    });
                } else {
                    console.log('Skipping duplicate application for:', jobInfo.company);
                }
            }
        }

            console.log('Completed checking for new applications');
    } catch (error) {
        console.error('Error checking for new applications:', error);
    }
};