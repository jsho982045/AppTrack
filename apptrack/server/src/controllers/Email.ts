// server/src/controllers/Email.ts
import { Request, Response } from 'express';
import { TrainingEmail } from '../models/TrainingEmail';
import { JobApplication } from '../models/JobApplication';

export const getApplicationEmails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const application = await JobApplication.findById(id);
        if(!application) {
            return res.status(404).json({ message: 'Application not found'});
        }

        const email = await TrainingEmail.findOne({ emailId: application.emailId });
        if (!email) {
            return res.json([]);
        }

        const formattedEmail = {
            id: email._id,
            subject: email.subject,
            from: email.from,
            date: email.receivedDate,
            content: email.content,
            isFollowUp: false
        };
        res.json([formattedEmail]);
    } catch (error) {
        console.error('Error fetching emails:', error);
        res.status(500).json({ message: 'Error fetching emails', error });
    }
};