import { Session } from 'express-session';
import { Types } from 'mongoose';

declare module 'express-session' {
    interface Session {
        userId?: string | Types.ObjectId;
    }
}
