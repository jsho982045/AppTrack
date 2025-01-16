import { Email } from '../models/Email';
import { Request, Response } from 'express';
import { reparseAllEmails } from '../services/gmail';
import { TrainingEmail } from '../models/TrainingEmail';
import { JobApplication } from '../models/JobApplication'; 
import { checkForNewApplications } from '../services/gmail';

// Core CRUD operations
export const getAllApplications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const applications = await JobApplication.find({ userId })
            .sort({ dateApplied: -1 });
        const formattedApplications = applications.map(app => ({
            ...app.toObject(),
            dateApplied: new Date(app.dateApplied).toISOString()
        }));
        res.json(formattedApplications);
    } catch(error) {
        res.status(500).json({ message: 'Error fetching applications', error });
    }
};

export const createApplication = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id;
        const savedApplication = await JobApplication.create({
            ...req.body,
            userId
        });
        res.status(201).json(savedApplication);
    } catch(error) {
        res.status(400).json({ message: 'Error creating application', error});
    }
};

export const updateApplication = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedApplication = await JobApplication.findByIdAndUpdate(
            id, 
            req.body,
            { new: true }
        );
        if (!updatedApplication) {
            res.status(404).json({ message: 'Application not found'});
            return;
        }
        res.json(updatedApplication);
    } catch (error) {
        res.status(500).json({ message: 'Error updating application', error });
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

// Email processing operations
export const fetchNewEmails = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        console.log('Fetching new emails for userId:', userId);
        await checkForNewApplications(userId);
        res.json({ message: 'New emails fetched successfully' });
    } catch (error) {
        console.error('Error fetching new emails:', error);
        res.status(500).json({ message: 'Error fetching new emails', error });
    }
};

export const reparseEmails = async (req: Request | string, res?: Response): Promise<void> => {
    try {
        const userId = typeof req === 'string' ? 
            req : 
            (req as Request as any).user._id;
        
        console.log('Reparsing emails for userId:', userId);
        await reparseAllEmails(userId);
        
        if (res) {
            res.json({ message: 'Emails reparsed successfully' });
        }
    } catch (error) {
        if (res) {
            console.error('Error reparsing emails:', error);
            res.status(500).json({ message: 'Error reparsing emails', error });
        } else {
            throw error;
        }
    }
};

// Data management
export const clearAllCollections = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user._id;
        console.log('Clearing collections for userId:', userId);

        // Initial counts
        const initialCounts = {
            jobApps: await JobApplication.countDocuments({}),
            trainingEmails: await TrainingEmail.countDocuments({}),
            emails: await Email.countDocuments({}) 
        };
        console.log('Initial counts:', initialCounts);

        // Fix orphaned documents first
        const fixOrphanedDocs = await TrainingEmail.updateMany(
            { userId: { $exists: false } },
            { $set: { userId } }
        );
        console.log('Fixed orphaned documents:', fixOrphanedDocs.modifiedCount);

        // Delete all documents for this user
        const deleteResults = await Promise.all([
            JobApplication.deleteMany({ userId }),
            TrainingEmail.deleteMany({ userId }), // This will now delete the previously orphaned docs too
            Email.deleteMany({ userId })
        ]);
        
        // Verify no documents remain
        const remainingCounts = {
            jobApps: await JobApplication.countDocuments({}),
            trainingEmails: await TrainingEmail.countDocuments({}),
            emails: await Email.countDocuments({})
        };
        
        console.log('Deletion results:', {
            jobApps: deleteResults[0].deletedCount,
            trainingEmails: deleteResults[1].deletedCount,
            emails: deleteResults[2].deletedCount
        });
        console.log('Remaining documents:', remainingCounts);

        res.json({
            message: 'Collections cleared successfully',
            initialCounts,
            deletedCounts: {
                jobApps: deleteResults[0].deletedCount,
                trainingEmails: deleteResults[1].deletedCount,
                emails: deleteResults[2].deletedCount
            },
            remainingCounts
        });
    } catch (error) {
        console.error('Error clearing collections:', error);
        res.status(500).json({ message: 'Error clearing collections', error });
    }
};