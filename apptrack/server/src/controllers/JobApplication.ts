import { Request, Response } from 'express';
import { JobApplication } from '../models/JobApplication'; 

export const getAllApplications = async (req: Request, res: Response) => {
    try {
        const applications = await JobApplication.find().sort({ dateApplied: -1 });
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