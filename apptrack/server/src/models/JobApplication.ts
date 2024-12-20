import mongoose from 'mongoose';

interface JobApplication {
    id?: string;
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted'
}

interface IJobApplicationDocument extends JobApplication {
    emailConfirmation?: string;
    lastUpdated: Date;
}

const jobApplicationSchema = new mongoose.Schema<IJobApplicationDocument>({
    company: {
        type: String,
        required: true
    },
    position: {
        type: String,
        required: true
    },
    dateApplied: {
        type: Date,
        required: true,
        default: Date.now
    },
    status: {
        type: String,
        required: true,
        enum: ['applied', 'interviewing', 'rejected', 'accepted'],
        default: 'applied'
    },
    emailConfirmation: {
        type: String
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

export const JobApplication = mongoose.model<IJobApplicationDocument>('JobApplication', jobApplicationSchema);