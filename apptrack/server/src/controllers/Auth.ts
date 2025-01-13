// server/src/controllers/Auth.ts
import { Request, Response } from 'express';
import { User } from '../models/User';
import { getGoogleTokens, getGoogleAuthURL, getUserInfo } from '../auth/google';
import 'express-session';

export const initiateGoogleAuth = (req: Request, res: Response) => {
    const authUrl = getGoogleAuthURL();
    res.redirect(authUrl);
};

export const handleGoogleCallback = async (req: Request, res: Response) => {
    try {
        console.log('Starting Google callback handling...');
        const code = req.query.code as string;
        
        if (!code) {
            throw new Error('No authorization code provided');
        }

        const tokens = await getGoogleTokens(code);
        const userInfo = await getUserInfo(tokens.access_token!);

        let user = await User.findOne({ email: userInfo.email });
        
        if (user) {
            user.tokens = {
                access_token: tokens.access_token!,
                refresh_token: tokens.refresh_token || user.tokens.refresh_token,
                expiry_date: tokens.expiry_date!
            };
            user.lastLogin = new Date();
            await user.save();
        } else {
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
        }

        req.session.userId = user._id.toString();
        res.redirect(`${process.env.CLIENT_URL}/dashboard`);
    } catch (error) {
        console.error('Google auth callback error:', error);
        res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
    }
};

export const getAuthenticatedUser = async (req: Request, res: Response) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await User.findById(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
            id: user._id,
            email: user.email,
            name: user.name
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const logout = (req: Request, res: Response) => {
    req.session.destroy((err: Error) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to logout' });
        }
        res.json({ message: 'Logged out successfully' });
    });
};