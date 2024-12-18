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

app.get('/auth/google/callback', async (req, res) => {
    try {
        const code = req.query.code as string;
        console.log('Received auth code:', code);

        const tokens = await getGoogleTokens(code);
        console.log('Received tokens:', tokens);

        if(!tokens.refresh_token || !tokens.access_token || !tokens.expiry_date){
            throw new Error('Missing required token fields');
        }
        let tokenDoc = await Token.findOne();
        if (!tokenDoc) {
            tokenDoc = new Token({
                refresh_token: tokens.refresh_token,
                access_token: tokens.access_token,
                expiry_date: tokens.expiry_date
            });
        }else {
            tokenDoc.refresh_token = tokens.refresh_token;
            tokenDoc.access_token = tokens.access_token;
            tokenDoc.expiry_date = tokens.expiry_date;
        }

        await tokenDoc.save();

        

        console.log('Saved token document:', {
            refresh_token: 'Present',
            access_token:  'Present',
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

setInterval(async () => {
    console.log('Checking for new job applications...');
    await checkForNewApplications();
}, 30 * 60 * 1000);

checkForNewApplications().catch(console.error);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})