// server/src/models/JobApplication.ts
import mongoose from 'mongoose';

export interface JobApplication {
    id?: string;
    company: string;
    position: string;
    dateApplied: Date;
    status: 'applied' | 'interviewing' | 'rejected' | 'accepted'
    emailId?: string;
}

export interface IJobApplicationDocument extends JobApplication {
    userId: mongoose.Types.ObjectId;
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
    },
    emailId:{
        type: String,
        ref: 'Email'
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
});

jobApplicationSchema.pre('find', function() {
    if (!this.getQuery().userId) {
        throw new Error('Must provide userId for queries');
    }
});

export const JobApplication = mongoose.model<IJobApplicationDocument>('JobApplication', jobApplicationSchema);