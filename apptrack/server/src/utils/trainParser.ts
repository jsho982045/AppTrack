// apptrack/server/src/utils/trainParser.ts
import { EmailProcessor } from "../ml/emailProcessor";
import { ITrainingEmail } from '../models/TrainingEmail';
import path from 'path';

let processor: EmailProcessor | null = null;
const MODEL_PATH = path.join(__dirname, '../../models/classifiers/email_classifier');

export async function initializeProcessor(): Promise<void> {
    if (!processor) {
        processor = new EmailProcessor();
        try {
            await processor.loadModel(MODEL_PATH);
            console.log('Model loaded successfully');
        } catch (error) {
            console.log('No existing model found, will train new one');
        }
    }
}

export async function trainClassifier(trainingEmails: ITrainingEmail[]): Promise<void> {
    console.log(`Processing ${trainingEmails.length} training emails`);
    
    if (!processor) {
        processor = new EmailProcessor();
    }
    
    try {
        console.log('Building vocabulary...');
        await processor.buildVocabulary(trainingEmails);
        
        console.log('Training model...');
        await processor.trainModel(trainingEmails);
        
        // Save the trained model
        await processor.saveModel(MODEL_PATH);
        console.log('Model saved successfully');
    } catch (error) {
        console.error('Training error:', error);
        throw error;
    }
}

export async function classifyEmail(email: { subject: string, content: string, from: string }) {
    if (!processor) {
        await initializeProcessor();
    }
    
    if (!processor) {
        throw new Error('Failed to initialize processor');
    }

    try {
        const result = await processor.predictEmail({
            subject: email.subject,
            content: email.content
        });

        return {
            ...result,
            company: 'Unknown Company', // We'll enhance this later
            position: 'Software Engineer' // We'll enhance this later
        };
    } catch (error) {
        console.error('Classification error:', error);
        return {
            isJobApplication: false,
            confidence: 0,
            company: 'Unknown Company',
            position: 'Software Engineer'
        };
    }
}

