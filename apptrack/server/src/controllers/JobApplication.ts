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