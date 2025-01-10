// server/src/controllers/Email.ts
import { Request, Response } from 'express';
import { TrainingEmail } from '../models/TrainingEmail';
import { JobApplication } from '../models/JobApplication';

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
            date: email.receivedDate.toISOString(),
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