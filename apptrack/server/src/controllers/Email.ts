// server/src/controllers/Email.ts
import { Request, Response } from 'express';
import { TrainingEmail } from '../models/TrainingEmail';
import { JobApplication } from '../models/JobApplication';

function formatDateToEST(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York',
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    
    return new Date(date).toLocaleString('en-US', options);
}

export const getApplicationEmails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        console.log('Looking for application:', id);

        const application = await JobApplication.findById(id);
        console.log('Found application:', application);
        if(!application || !application.emailId) {
            return res.status(404).json({ message: 'Application or email ID not found'});
        }

        const email = await TrainingEmail.findOne({ 
            emailId: application.emailId 
        });
        console.log('Found email:', email);

        if (!email) {
            return res.json([]);
        }

        const formattedEmail = {
            id: email._id.toString(),
            subject: email.subject,
            from: email.from,
            date: formatDateToEST(email.receivedDate),
            content: email.content,
            isFollowUp: false,
            applicationId: application._id.toString()
        };
        console.log('Sending formatted email:', formattedEmail);
        res.json([formattedEmail]);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ message: 'Error fetching emails', error });
    }
};