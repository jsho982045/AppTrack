// server/src/models/Token.ts
import mongoose from 'mongoose';

interface IToken {
    refresh_token: string;
    access_token: string;
    expiry_date: number;
    user_email?: string;
}

const tokenSchema = new mongoose.Schema<IToken>({
    refresh_token: { type: String, required: true },
    access_token: { type: String, required: true },
    expiry_date: { type: Number, required: true },
    user_email: { type: String }
});

tokenSchema.statics.getOrCreate = async function() {
    const token = await this.findOne();
    if (token) {
        return token;
    }
    return new this();
};

export const Token = mongoose.model<IToken>('Token', tokenSchema);