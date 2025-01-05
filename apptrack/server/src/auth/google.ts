// server/src/auth/google.ts
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { Token } from '../models/Token';
import path from 'path';
import { error } from 'console';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = process.env.GOOGLE_REDIRECT_URI;

console.log('Environment variables loaded:', {
    clientId: clientId ? 'Set' : 'Not set',
    clientSecret: clientSecret ? 'Set' : 'Not set',
    redirectUri
});

if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing required Google OAuth credentials');
}

const oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri);

export const getGoogleAuthURL = () => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        prompt: 'consent'
    });
};

export const getGoogleTokens = async (code: string) => {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};


export const refreshAccessToken = async (refreshToken: string) => {
    try {
        oauth2Client.setCredentials({
            refresh_token: refreshToken
        });
        const { credentials } = await oauth2Client.refreshAccessToken();
        return credentials;
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
};

export const getGmailClient = async () => {
    const tokenDoc = await Token.findOne();
    if(!tokenDoc) {
        throw Object.assign(new Error('No authentication token found'), {
            code: 'AUTH_REQUIRED'
        });
    }

    try {
        const newTokens = await refreshAccessToken(tokenDoc.refresh_token);

        await Token.findByIdAndUpdate(
            tokenDoc._id,
            {
                access_token: newTokens.access_token,
                expiry_date: newTokens.expiry_date
            },
            { new: true }
        );

        oauth2Client.setCredentials(newTokens);
        return google.gmail({ version: 'v1', auth: oauth2Client });
    }catch (error) {
        console.error('Error getting Gmail client', error);
        await Token.deleteMany({});
        throw Object.assign(new Error('Authentication required'), {
            code: 'AUTH_REQUIRED'
        });
    }
};

