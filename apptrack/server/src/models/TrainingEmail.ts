// apptrack/server/src/models/TrainingEmail.ts

import mongoose from "mongoose";

export interface ITrainingEmail {
    subject: string;
    content: string;
    from: string;
    isApplicationEmail: boolean;
    company?: string;
    position?: string;
    emailId: string;
    receivedDate: Date;
    verified: boolean;
    parsedCompany?: string;
    parsedPosition?: string;
    processingStatus?: 'pending' | 'success' | 'failed';
}

const trainingEmailSchema = new mongoose.Schema<ITrainingEmail>({
    subject: { type: String, required: true },
    content: { type: String, required: true },
    from: { type: String, required: true },
    isApplicationEmail: { type: Boolean, required: true },
    company: { type: String },
    position: { type: String },
    emailId: { type: String, required: true, unique: true },
    receivedDate: { type: Date, required: true },
    verified: { type: Boolean, required: true },
    parsedCompany: { type: String },
    parsedPosition: { type: String },
    processingStatus: { type: String, enum: ['pending', 'success', 'failed'] }
});

export const TrainingEmail = mongoose.model<ITrainingEmail>('TrainingEmail', trainingEmailSchema);