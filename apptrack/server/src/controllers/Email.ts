// server/src/controllers/Email.ts
import { Request, Response } from 'express';
import { Email } from '../models/Email';

export const getApplicationEmails = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const emails = await Email.find({ applicationId: id })
            .sort({ date: -1 });
        
        res.json(emails);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching emails', error });
    }
};