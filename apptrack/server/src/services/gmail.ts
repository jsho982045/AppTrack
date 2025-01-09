// server/src/services/gmail.ts
import { google, gmail_v1 } from 'googleapis';
import { Token } from '../models/Token';
import { JobApplication } from '../models/JobApplication';
import { getGmailClient } from '../auth/google';
import axios from 'axios';
import { TrainingEmail } from '../models/TrainingEmail';
import { train } from '@tensorflow/tfjs-node';
import { Email } from '../models/Email';

const ML_SERVICE_URL = 'http://127.0.0.1:8000';

export const checkForNewApplications = async () => {
    try {
        const tokenDoc = await Token.findOne();
        
        if (!tokenDoc) {
            throw Object.assign(new Error('No authentication token found'), {
                code: 'AUTH_REQUIRED'
            });
        }

        const gmail = await getGmailClient();
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:("thank you for applying" OR "application received" OR "application confirmed" OR "application status" OR "we received your application") -subject:("job alert" OR "jobs for you" OR "new jobs" OR "opportunities" OR "job recommendations")',
            maxResults: 10
        });

        const messages = response.data.messages || [];
        
        for (const message of messages) {
            try {
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

                const trainingEmail = new TrainingEmail ({
                    subject,
                    content: fullBody,
                    from,
                    emailId: message.id,
                    receivedDate: new Date(),
                    isApplicationEmail: true,
                    verified: false,
                    processingStatus: 'pending'
                });

                await trainingEmail.save();

                const parsedJob = await parseJobEmail({
                    subject,
                    content: fullBody,
                    from_email: from,
                });

                if (parsedJob) {
                    // Update training email with parsed results
                    trainingEmail.parsedCompany = parsedJob.company;
                    trainingEmail.parsedPosition = parsedJob.position;
                    trainingEmail.processingStatus = 'success';
                    await trainingEmail.save();

                    // Check if this application already exists
                    const existingApp = await JobApplication.findOne({
                        company: parsedJob.company,
                        dateApplied: {
                            $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
                        },
                    });

                    if (!existingApp) {
                        const newApp = await JobApplication.create({
                            ...parsedJob,
                            emailId: message.id
                        });
                        await Email.create({
                            subject,
                            from,
                            date: new Date(),
                            content: fullBody,
                            isFollowUp: false,
                            applicationId: newApp._id
                        });

                        console.log('New application added:', {
                            company: newApp.company,
                            position: newApp.position,
                            dateApplied: newApp.dateApplied,
                        });
                    } else {
                        const followUpEmail = await Email.create({
                            subject,
                            from,
                            date: new Date(),
                            content: fullBody,
                            isFollowUp: true,
                            applicationId: existingApp._id
                        });

                        console.log('Added follow-up email for:', parsedJob.company);
                    }
                }
            } catch (error) {
                console.error(`Error processing email ${message.id}:`, error);

                try {
                    await TrainingEmail.findOneAndUpdate(
                        { emailId: message.id },
                        { processingStatus: 'failed' }
                    );
                } catch(e) {
                    console.error('Failed to update training email status:', e);
                }
            }
        }
        console.log('Completed checking for new applications');
    } catch (error: any) {
        if (error.code === 'AUTH_REQUIRED') {
            throw error;
        }
        console.error('Error checking for new applications:', error);
        throw error;
    }
};

export const parseJobEmail = async (emailData: {
    subject: string;
    content: string;
    from_email: string;
}) => {
    try {
        const response = await axios.post(`${ML_SERVICE_URL}/parse`, emailData);
        return response.data;
    } catch (error) {
        console.error('Error parsing job email:', error);
        throw new Error('Failed to parse job email');
    }
};

export const reparseAllEmails = async () => {
    try {
        // Get all training emails
        const trainingEmails = await TrainingEmail.find({ isApplicationEmail: true });
        console.log(`Found ${trainingEmails.length} job application emails to process`);

        // Clear existing job applications
        await JobApplication.deleteMany({});
        console.log('Cleared existing job applications');

        // Process each email
        for (const email of trainingEmails) {
            try {
                const parsedJob = await parseJobEmail({
                    subject: email.subject,
                    content: email.content,
                    from_email: email.from
                });

                if (parsedJob) {
                    // Update training email status
                    email.parsedCompany = parsedJob.company;
                    email.parsedPosition = parsedJob.position;
                    email.processingStatus = 'success';
                    await email.save();

                    // Create new job application
                    const newApp = await JobApplication.create({
                        ...parsedJob,
                        emailId: email.emailId
                    });
                    console.log('Processed application:', {
                        company: newApp.company,
                        position: newApp.position,
                        dateApplied: newApp.dateApplied
                    });
                }
            } catch (error) {
                console.error(`Error processing email ${email.emailId}:`, error);
                email.processingStatus = 'failed';
                await email.save();
            }
        }
        console.log('Completed reparsing all emails');
    } catch (error) {
        console.error('Error reparsing emails:', error);
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