import mongoose, { trusted } from 'mongoose';

export interface IEmail {
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
    }
});

export const Email = mongoose.model<IEmail>('Email', emailSchema);