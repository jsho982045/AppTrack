// server/src/models/Email.ts
import mongoose, { mongo, trusted } from 'mongoose';

export interface IEmail {
    userId: mongoose.Types.ObjectId;
    id?: string;
    subject: string;
    from: string;
    date: Date;
    content: string;
    isFollowUp: boolean;
    applicationId: mongoose.Types.ObjectId;
}

const emailSchema = new mongoose.Schema<IEmail>({
    subject: {
        type: String,
        required: true
    },
    from: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    isFollowUp: {
        type: Boolean,
        default: false
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobApplication',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
});

export const Email = mongoose.model<IEmail>('Email', emailSchema);