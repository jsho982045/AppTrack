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
});

export const TrainingEmail = mongoose.model<ITrainingEmail>('TrainingEmail', trainingEmailSchema);