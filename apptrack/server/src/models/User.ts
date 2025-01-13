import mongoose from 'mongoose';

export interface IUser {
    email: string;
    googleId: string;
    name?: string;
    createdAt: Date;
    lastLogin: Date;
    tokens: {
        refresh_token: string;
        access_token: string;
        expiry_date: number;
    };
}

const userSchema = new mongoose.Schema<IUser>({
    email: { type: String, required: true, unique: true },
    googleId: { type: String, required: true, unique: true },
    name: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    tokens: {
        refresh_token: { type: String, required: true },
        access_token: { type: String, required: true },
        expiry_date: { type: Number, required: true }
    }
});

export const User = mongoose.model<IUser>('User', userSchema);