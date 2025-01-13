import cors from 'cors';
import { get } from 'http';
import dotenv from 'dotenv';
import express, { Request, Response, NextFunction, RequestHandler} from 'express';
import mongoose from 'mongoose';
import { MongoClient } from 'mongodb';
import { Token } from './models/Token';
import { getApplicationEmails } from './controllers/Email';
import { checkForNewApplications } from './services/gmail';
import { getGmailClient, getGoogleAuthURL, getGoogleTokens } from './auth/google';
import { getAllApplications, createApplication, deleteApplication, updateApplication, clearAllCollections, reparseApplications } from './controllers/JobApplication';
import { initiateGoogleAuth, handleGoogleCallback, getAuthenticatedUser, logout } from './controllers/Auth';
import session from 'express-session';
import { User } from './models/User';
import MongoStore from 'connect-mongo';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI!
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        secure: process.env.NODE_ENV === 'production'
    }
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
    console.log(`${req.method} request to ${req.url}`);
    next();
});

// Auth middleware
const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.session.userId) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
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

// Auth routes
app.get('/auth/google', initiateGoogleAuth);
app.get('/auth/google/callback', handleGoogleCallback);
app.get('/api/auth/user', getAuthenticatedUser as RequestHandler);
app.post('/api/auth/logout', logout);

// Protected routes
app.get('/api/applications', requireAuth, getAllApplications as RequestHandler);
app.get('/api/applications/:id/emails', requireAuth, getApplicationEmails as RequestHandler);
app.post('/api/applications', requireAuth, createApplication as RequestHandler);
app.post('/api/collections/clear', requireAuth, clearAllCollections as RequestHandler);
app.post('/api/applications/reparse', requireAuth, reparseApplications as RequestHandler);
app.put('/api/applications/:id', requireAuth, updateApplication as RequestHandler);
app.delete('/api/applications/:id', requireAuth, deleteApplication as RequestHandler);

app.post('/api/check-emails', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await checkForNewApplications();
        res.json({ message: 'Email check completed' });
    } catch (error: any) {
        next(error);
    }
});

app.get('/api/emails/training', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!mongoose.connection.db) {
            throw new Error('Database connection not established');
        }
        const collection = mongoose.connection.db.collection('trainingemails');
        const emails = await collection.find({}).toArray();
        res.json(emails);
    } catch (error) {
        next(error);
    }
});

// Error handling middleware
app.use(handleAuthError);

// Automatic email checking
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

setInterval(checkEmails, 30 * 60 * 1000);
checkEmails().catch(console.error);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});