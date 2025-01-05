// src/scripts/testProcessor.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TrainingEmail } from '../models/TrainingEmail';
import { trainClassifier, classifyEmail } from '../utils/trainParser';

dotenv.config();

const testProcessor = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Get all training emails
        const trainingEmails = await TrainingEmail.find({}).lean();
        console.log(`Found ${trainingEmails.length} training emails`);

        // Train the classifier
        console.log('Training classifier...');
        await trainClassifier(trainingEmails);

        // Test some emails
        const testEmails = trainingEmails.slice(0, 5);
        console.log('\nTesting classification:');
        
        for (const email of testEmails) {
            console.log('\nTesting email:', email.subject);
            const result = await classifyEmail({
                subject: email.subject,
                content: email.content,
                from: email.from
            });
            
            console.log('Classification result:', {
                expected: email.isApplicationEmail,
                predicted: result.isJobApplication,
                confidence: result.confidence,
                correct: email.isApplicationEmail === result.isJobApplication
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
};

if (require.main === module) {
    testProcessor().catch(console.error);
}