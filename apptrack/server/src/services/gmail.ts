// src/services/gmail.ts
import { google, gmail_v1 } from 'googleapis';
import { Token } from '../models/Token';
import { JobApplication } from '../models/JobApplication';
import { getGmailClient } from '../auth/google';
import { parseJobEmail, isJobApplication } from '../utils/jobParser';

export const checkForNewApplications = async () => {
    try {
        const tokenDoc = await Token.findOne();
        console.log('Found token document:', tokenDoc ? 'Present' : 'Not found');
        
        if (!tokenDoc) {
            throw Object.assign(new Error('No authentication token found'), {
                code: 'AUTH_REQUIRED'
            });
        }

        const gmail = await getGmailClient();
        console.log('Gmail client initialized');
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:(application OR applied OR confirmation) newer_than:1d'
        });
        console.log('Found emails:', response.data.messages?.length || 0);

        const messages = response.data.messages || [];
        
        for (const message of messages) {
            try {
                console.log('Processing email:', message.id);
                const email = await gmail.users.messages.get({
                    userId: 'me',
                    id: message.id!,
                    format: 'full'
                });
                
                const payload = email.data.payload;
                if(!payload || !payload.headers) {
                    console.log('Skipping email with invalid structure');
                    continue;
                }

                const headers = payload.headers;
                const subject = headers.find((h) => h.name === 'Subject')?.value || '';
                const from = headers.find((h) => h.name === 'From')?.value || '';
                const fullBody = decodeEmailBody(payload);

                if(!isJobApplication(from, subject)) {
                    console.log("Not a job application email, skipping...");
                    continue;
                }

                const jobInfo = parseJobEmail({
                    subject,
                    content: fullBody,
                    from,
                    receivedDate: new Date(),
                    emailId: message.id!
                });
                
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
            } catch (error) {
                console.error(`Error processing email ${message.id}:`, error);
            }
        }
        console.log('Completed checking for new applications');
    } catch (error: any) {
        if (error.code === 'AUTH_REQUIRED') {
            throw error; // Re-throw auth errors
        }
        console.error('Error checking for new applications:', error);
        throw error;
    }
};

function decodeEmailBody(payload: gmail_v1.Schema$MessagePart): string {
    let decoded = '';

    function walkParts(parts?: gmail_v1.Schema$MessagePart[]) {
        if (!parts) return;
        for (const part of parts) {
            if (part.parts && part.parts.length > 0) {
                walkParts(part.parts);
            } else {
                if (part.mimeType === 'text/plain' && part.body?.data) {
                    const buff = Buffer.from(part.body.data, 'base64');
                    decoded += buff.toString('utf-8') + '\n';
                }
            }
        }
    }

    if (payload.parts && payload.parts.length > 0) {
        walkParts(payload.parts);
    } else if (payload.mimeType === 'text/plain' && payload.body?.data) {
        decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return decoded;
}