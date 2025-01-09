// server/src/controllers/JobApplication.ts
import { Request, Response } from 'express';
import { JobApplication } from '../models/JobApplication'; 
import { ParserService } from '../services/parser';
import { checkForNewApplications } from '../services/gmail';
import { reparseAllEmails } from '../services/gmail';
import { join } from 'path';
import { TrainingEmail } from '../models/TrainingEmail';

const parserService = new ParserService();

export const getAllApplications = async (req: Request, res: Response) => {
    try {
        const applications = await JobApplication.find()
            .sort({ dateApplied: -1 });
        res.json(applications);
    }catch(error) {
        res.status(500).json({ message: 'Error fetching applications', error });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    try {
        const newApplication = new JobApplication(req.body);
        const savedApplication = await newApplication.save();
        res.status(201).json(savedApplication);
    }catch(error){
        res.status(400).json({ message: 'Error creating application', error});
    }
};

export const deleteApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedApplication = await JobApplication.findByIdAndDelete(id);
        
        if (!deletedApplication) {
            res.status(404).json({ message: 'Application not found' });
            return;
        }
        
        res.json({ message: 'Application deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting application', error });
    }
};

export const updateApplication = async (req: Request, res: Response): Promise<void> => {
    try{
        const { id } = req.params;
        const updatedApplication = await JobApplication.findByIdAndUpdate(
            id, 
            req.body,
            { new: true }
        );

        if(!updatedApplication) {
            res.status(404).json({ message: 'Application not found '});
            return;
        }

        res.json(updatedApplication);
    } catch (error) {
        res.status(500).json({ message: 'Error updating application', error });
        
    }
};

export const processJobEmail = async (req: Request, res: Response) => {
    try {
        const { subject, content, from } = req.body;

        const parsedJob = await parserService.parseJobEmail({
            subject,
            content,
            from_email: from
        });

        const newApplication = new JobApplication(parsedJob);
        const savedApplication = await newApplication.save();

        res.status(201).json(savedApplication);
    } catch (error) {
        res.status(400).json({ message: 'Error processing job email', error });
    }
};

export const clearApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        await JobApplication.deleteMany({});
        res.json({ message: 'All applications cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing applications', error });
    }
};

export const reparseApplications = async (req: Request, res: Response): Promise<void> => {
    try {
        await reparseAllEmails();
        res.json({ message: 'All emails reparsed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error reparsing applications', error });
    }
};

export const clearAllCollections = async (req: Request, res: Response): Promise<void> => {
    try {
        await JobApplication.deleteMany({});
        await TrainingEmail.deleteMany({});
        res.json({ message: 'All collections cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing collections', error });
    }
};


