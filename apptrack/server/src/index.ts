import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAllApplications, createApplication, deleteApplication, updateApplication } from './controllers/JobApplication';
import { getGmailClient, getGoogleAuthURL, getGoogleTokens } from './auth/google';
import { checkForNewApplications } from './services/gmail';
import cors from 'cors';
import { Token } from './models/Token';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
});

const handleAuthError = (error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (error.code === 'AUTH_REQUIRED') {
        const authUrl = getGoogleAuthURL();
        return res.redirect(authUrl);
    }
    next(error);
};

mongoose.connect(process.env.MONGODB_URI!)
    .then(() => {
        console.log('Connected to MongoDB Atlas successfully');
        console.log('Current database:', mongoose.connection.db?.databaseName);
        console.log('Available collections:', mongoose.connection.db?.collections());
    })
    .catch((error => {
        console.error('MongoDB connection error: ', error);
    }));

app.get('/api/applications', getAllApplications);
app.post('/api/applications', createApplication);
app.delete('/api/applications/:id', deleteApplication);
app.put('/api/applications/:id', updateApplication)


app.get('/auth/google', (req, res) => {
    const authUrl = getGoogleAuthURL();
    res.redirect(authUrl);
});

app.get('/api/check-emails', async (req, res) => {
    try {
        await checkForNewApplications();
        res.json({ message: 'Email check completed' });
    } catch (error: any) {
        if (error.code === 'AUTH_REQUIRED') {
            const authUrl = getGoogleAuthURL();
            return res.redirect(authUrl);
        }
        res.status(500).json({ error: 'Failed to check emails' });
    }
});

app.get('/auth/google', (req, res) => {
    const authUrl = getGoogleAuthURL();
    res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
    try {
        const code = req.query.code as string;
        console.log('Received auth code:', code);
        const tokens = await getGoogleTokens(code);
        console.log('Received tokens:', tokens);

        if(!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date){
            throw new Error('Missing required token fields');
        }

        // Clear existing tokens and save new ones
        await Token.deleteMany({});
        const tokenDoc = new Token({
            refresh_token: tokens.refresh_token,
            access_token: tokens.access_token,
            expiry_date: tokens.expiry_date
        });
        await tokenDoc.save();
        
        console.log('Saved token document:', {
            refresh_token: 'Present',
            access_token: 'Present',
            expiry_date: tokenDoc.expiry_date
        });

        const gmail = await getGmailClient();
        const testResponse = await gmail.users.getProfile({ userId: 'me' });
        console.log('Gmail connection test:', testResponse.data);

        res.json({ 
            message: 'Setup complete! You can now close this window.',
            status: 'success',
            emailAddress: testResponse.data.emailAddress
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});

// Error handling middleware must be after all routes
app.use(handleAuthError);

// Email check interval
setInterval(async () => {
    console.log('Checking for new job applications...');
    await checkForNewApplications().catch(error => {
        if (error.code === 'AUTH_REQUIRED') {
            console.log('Auth required, waiting for next check...');
        } else {
            console.error('Error checking applications:', error);
        }
    });
}, 30 * 60 * 1000);

// Initial check (with better error handling)
checkForNewApplications().catch(error => {
    if (error.code === 'AUTH_REQUIRED') {
        console.log('Initial check requires authentication...');
    } else {
        console.error('Error in initial check:', error);
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});