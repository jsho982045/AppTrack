import cors from 'cors';
import { get } from 'http';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, RequestHandler} from 'express';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { getApplicationEmails } from './controllers/Email';
import { checkForNewApplications } from './services/gmail';
import { getGmailClient, getGoogleAuthURL, getGoogleTokens } from './auth/google';
import { getAllApplications, createApplication, deleteApplication, updateApplication, clearAllCollections, reparseEmails, fetchNewEmails } from './controllers/JobApplication';
import { initiateGoogleAuth, handleGoogleCallback, getAuthenticatedUser, logout } from './controllers/Auth';
import session from 'express-session';
import { User } from './models/User';
import MongoStore from 'connect-mongo';
import { Email } from './models/Email';
import { JobApplication } from './models/JobApplication';
import { TrainingEmail } from './models/TrainingEmail';

// Load environment variables
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;


// Database connection
mongoose.connect(process.env.MONGODB_URI!)
    .then(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Connected to MongoDB Atlas successfully');
        if (mongoose.connection.db) {
            const collections = await mongoose.connection.db.collections();
            console.log('Available collections:', collections.map(c => c.collectionName));
        }
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
});

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI!,
        touchAfter: 24 * 3600
    }),
    cookie: {
        maxAge: undefined,
        expires: undefined,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict'
    },
    unset: 'destroy'
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    res.set({
        'X-XSS-Protection': '1; mode=block',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
    });
    next();
});

// Auth middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.session || !req.session.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            req.session.destroy((err) => {
                if (err) console.error('Session destruction error:', err);
            });
            res.status(401).json({ error: 'User not found' });
            return;
        }

        (req as any).user = user;
        next();
    } catch (error) {
        next(error);
    }
};

const handleAuthError = (error: any, req: Request, res: Response, next: NextFunction): void => {
    if (error.code === 'AUTH_REQUIRED') {
        const authUrl = getGoogleAuthURL();
        res.redirect(authUrl);
        return;
    }
    next(error);
};



// Auth routes
app.get('/auth/google', initiateGoogleAuth);
app.get('/auth/google/callback', handleGoogleCallback);
app.get('/api/auth/user', requireAuth, getAuthenticatedUser as RequestHandler);
app.post('/api/auth/logout', logout);

// Protected routes
app.get('/api/applications', requireAuth, getAllApplications as RequestHandler);
app.get('/api/applications/:id/emails', requireAuth, getApplicationEmails as RequestHandler);
app.post('/api/applications', requireAuth, createApplication as RequestHandler);
app.put('/api/applications/:id', requireAuth, updateApplication as RequestHandler);
app.delete('/api/applications/:id', requireAuth, deleteApplication as RequestHandler);

// Email processing routes
app.post('/api/emails/fetch', requireAuth, fetchNewEmails as RequestHandler);
app.post('/api/emails/reparse', requireAuth, reparseEmails as RequestHandler);
app.post('/api/collections/clear', requireAuth, clearAllCollections as RequestHandler);

app.post('/api/check-emails', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user._id;
        await checkForNewApplications(userId);
        res.json({ message: 'Email check completed' });
    } catch (error: any) {
        next(error);
    }
}) as RequestHandler;

app.post('/api/dev/clear-sessions', requireAuth, async (req, res) => {
    try {
        if (!mongoose.connection.db) {
            throw new Error('Database not connected');
        }
        await mongoose.connection.db.collection('sessions').deleteMany({});
        res.json({ message: 'Sessions cleared' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to clear sessions' });
    }
});

app.post('/api/dev/migrate-data', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Use the authenticated user instead of finding any user
        const user = (req as any).user;
        console.log('Migrating data for user:', user.email);

        // Update all collections
        const updates = await Promise.all([
            JobApplication.updateMany(
                { userId: { $exists: false } },  // Find docs without userId
                { $set: { userId: user._id } }   // Set them to current user's ID
            ),
            Email.updateMany(
                { userId: { $exists: false } },
                { $set: { userId: user._id } }
            ),
            TrainingEmail.updateMany(
                { userId: { $exists: false } },
                { $set: { userId: user._id } }
            )
        ]);

        res.json({ 
            message: 'Data migration completed',
            user: user.email,
            results: {
                jobApplications: updates[0].modifiedCount,
                emails: updates[1].modifiedCount,
                trainingEmails: updates[2].modifiedCount
            }
        });
    } catch (error) {
        next(error);
    }
}) as RequestHandler;

app.get('/api/emails/training', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!mongoose.connection.db) {
            throw new Error('Database connection not established');
        }
        const userId = (req as any).user._id;
        const collection = mongoose.connection.db.collection('trainingemails');
        const emails = await collection.find({ userId }).toArray();
        res.json(emails);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use(handleAuthError);

/* Automatic email checking
const checkEmails = async (): Promise<void> => {
    try {
        console.log('Checking for new job applications...');
        await checkForNewApplications();
    } catch (error: any) {
        if (error.code === 'AUTH_REQUIRED') {
            console.log('Auth required, waiting for next check...');
        } else {
            console.error('Error checking applications:', error);
        }
    }
};

*/


// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
});