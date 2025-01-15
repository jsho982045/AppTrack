// server/src/controllers/Auth.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { getGoogleTokens, getGoogleAuthURL, getUserInfo } from '../auth/google';
import 'express-session';
import { OAuth2Client } from 'google-auth-library';
import { checkForNewApplications } from '../services/gmail';
import { reparseEmails } from './JobApplication';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const initiateGoogleAuth =  (req: Request, res: Response) => {
    const authUrl = getGoogleAuthURL();
    console.log('Initiating Google Auth, redirecting to:', authUrl);
    res.redirect(authUrl);
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
    try {
        console.log('Starting Google callback handling...');
        const code = req.query.code as string;
        
        if (!code) {
            console.error('No authorization code provided');
            throw new Error('No authorization code provided');
        }

        console.log('Getting tokens from Google...');
        const tokens = await getGoogleTokens(code);
        console.log('Tokens received:', {
            access_token: tokens.access_token ? 'present' : 'missing',
            refresh_token: tokens.refresh_token ? 'present' : 'missing',
            expiry_date: tokens.expiry_date ? 'present' : 'missing'
        });

        console.log('Getting user info...');
        const userInfo = await getUserInfo(tokens.access_token!);

        console.log('User info received:', {
            email: userInfo.email ? 'present' : 'missing',
            id: userInfo.id ? 'present' : 'missing'
        });

        let user = await User.findOne({ email: userInfo.email });
        
        if (user) {
            console.log('Existing user found, updating tokens...');
            user.tokens = {
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || user.tokens.refresh_token,
                expiry_date: tokens.expiry_date!
            };
            user.lastLogin = new Date();
            await user.save();
            console.log('User updated successfully');
        } else {
            console.log('Creating new user...');
            user = await User.create({
                email: userInfo.email,
                googleId: userInfo.id,
                name: userInfo.name,
                tokens: {
                    access_token: tokens.access_token!,
                    refresh_token: tokens.refresh_token!,
                    expiry_date: tokens.expiry_date!
                }
            });
            console.log('New user created successfully');
        }

        if (user) {
            try {
                console.log('Starting initial email fetch for user...');
                await checkForNewApplications(user._id.toString());
                console.log('Starting initial email parsing...');
                await reparseEmails(user._id.toString());
            } catch (fetchError) {
                console.error('Error in initial email fetch:', fetchError);
            }
        }

        console.log('Setting session...');
        req.session.userId = user._id.toString();

        const redirectUrl = `${process.env.CLIENT_URL}/dashboard`;
        console.log('Redirecting to:', redirectUrl);
        res.redirect(redirectUrl);
    } catch (error) {
        console.error('Google auth callback error:', error);
        const errorRedirect = `${process.env.CLIENT_URL}/login?error=auth_failed`;
        console.log('Error redirect to:', errorRedirect);
        res.redirect(errorRedirect);
    }
};

export const getAuthenticatedUser = async (req: Request, res: Response) => {
    try {
        console.log('Checking authentication...');
        if (!req.session.userId) {
            console.log('No user ID in session');
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            console.log('User not found in database');
            return res.status(401).json({ error: 'User not found' });
        }
        
        console.log('User authenticated successfully');
        res.json({
            id: user._id,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const logout = (req: Request, res: Response) => {
    console.log('Processing logout request...');
    req.session.destroy((err: Error) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ message: 'Failed to logout' });
        }
        console.log('Logout successful');
        res.json({ message: 'Logged out successfully' });
    });
};