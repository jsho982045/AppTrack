import { getGmailClient } from "../auth/google"
import { TrainingEmail } from "../models/TrainingEmail";
import { gmail_v1 } from "googleapis";

interface GmailMessage {
    id: string;
    threadId: string;
    labelIds?: string[];
}

const processEmails = async (messages: gmail_v1.Schema$Message[], isApplicationEmail: boolean) => {
    const gmail = await getGmailClient();

    for (const message of messages) {
        try {

            if (!message.id){
                console.log('Skipping message with no ID');
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

            console.log('Checking database for:', message.id);

            const existingEmail = await TrainingEmail.findOne({ emailId: message.id });
            if(existingEmail) {
                console.log(`Email ${message.id} already exists in training data`);
                continue;
            }

            console.log('Saving to database:', {
                collection: TrainingEmail.collection.name,
                emailId: message.id
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
            console.log('Saved to MongoDB with ID:', savedEmail._id);
            console.log(`Processed email: ${subject}`);
        } catch (error) {
            console.error(`Error processing email ${message.id};`, error);
        }
    }
};

const collectTrainingEmails = async () => {
    try {
        const gmail = await getGmailClient();
        console.log('MongoDB collection name:', TrainingEmail.collection.name);

        console.log('Fetching application emails...');
        const applicationEmails = await gmail.users.messages.list({
            userId: 'me',
            q: 'subject:("application received" OR "thank you for applying" OR "application confirmation") newer_than:180d'
        }); 

        console.log('Fetching regular emails...');
        const regularEmails = await gmail.users.messages.list({
            userId: 'me',
            q: '-subject:(application OR job OR position) newer_than:30d'
        });

        console.log('Processing application emails...');
        await processEmails(applicationEmails.data.messages || [], true);

        console.log('Processing regular emails...');
        await processEmails(regularEmails.data.messages || [], false);

        console.log('Training data collection completed');

        const totalApplications = await TrainingEmail.countDocuments({ isApplicationEmail: true });
        const totalRegular = await TrainingEmail.countDocuments({ isApplicationEmail: false });
        console.log(`Collected ${totalApplications} application emails and ${totalRegular} regular emails`);
    } catch (error) {
        console.error('Error collecting training data:', error)
    }
};

export { collectTrainingEmails }