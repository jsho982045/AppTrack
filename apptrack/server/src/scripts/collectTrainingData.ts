// src/scripts/collectTrainingData.ts
import { getGmailClient } from "../auth/google";
import { TrainingEmail } from "../models/TrainingEmail";
import { gmail_v1 } from "googleapis";

interface GmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
}

const processEmails = async (messages: gmail_v1.Schema$Message[], isApplicationEmail: boolean) => {
    const gmail = await getGmailClient();
    let processedCount = 0;

    for (const message of messages) {
        try {
            if (!message.id) {
                console.log('Skipping message with no ID');
                continue;
            }
            
            // Check if we already have this email
            const existingEmail = await TrainingEmail.findOne({ emailId: message.id });
            if (existingEmail) {
                console.log(`Email ${message.id} already exists in training data`);
                continue;
            }

            const email = await gmail.users.messages.get({
                userId: 'me',
                id: message.id,
                format: 'full'
            });

            const headers = email.data.payload?.headers;
            const subject = headers?.find((h: any) => h.name === 'Subject')?.value || '';
            const from = headers?.find((h: any) => h.name === 'From')?.value || '';
            const date = headers?.find((h: any) => h.name === 'Date')?.value;

            console.log('Saving to database:', {
                collection: TrainingEmail.collection.name,
                emailId: message.id,
                subject: subject
            });

            const savedEmail = await TrainingEmail.create({
                subject,
                content: email.data.snippet || '',
                from,
                isApplicationEmail,
                emailId: message.id,
                receivedDate: new Date(date || Date.now()),
                verified: false
            });

            console.log(`Processed email: ${subject}`);
            processedCount++;

            // Break if we've processed enough new emails
            if (processedCount >= 100) {
                console.log('Reached target number of new emails');
                break;
            }
        } catch (error) {
            console.error(`Error processing email ${message.id}:`, error);
        }
    }
    return processedCount;
};

const collectTrainingEmails = async () => {
    try {
        const gmail = await getGmailClient();
        
        // Count existing emails
        const existingAppCount = await TrainingEmail.countDocuments({ isApplicationEmail: true });
        console.log(`Currently have ${existingAppCount} application emails`);

        // Fetch newer application emails first
        console.log('Fetching application emails...');
        const applicationEmails = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:("application received" OR "thank you for applying" OR "application confirmation") newer_than:30d',
            maxResults: 100
        });

        console.log('Processing application emails...');
        const newAppCount = await processEmails(applicationEmails.data.messages || [], true);

        // If we need more emails, fetch non-application emails
        if (newAppCount < 100) {
            console.log('Fetching regular emails to reach target...');
            const regularEmails = await gmail.users.messages.list({
                userId: 'me',
                q: '-subject:(application OR job OR position) newer_than:7d',
                maxResults: 100 - newAppCount
            });

            await processEmails(regularEmails.data.messages || [], false);
        }

        // Log final counts
        const finalAppCount = await TrainingEmail.countDocuments({ isApplicationEmail: true });
        const finalRegCount = await TrainingEmail.countDocuments({ isApplicationEmail: false });
        console.log(`Final counts: ${finalAppCount} application emails and ${finalRegCount} regular emails`);
        
    } catch (error) {
        console.error('Error collecting training data:', error);
    }
};

export { collectTrainingEmails };