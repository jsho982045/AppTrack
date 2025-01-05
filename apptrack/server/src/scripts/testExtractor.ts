// src/scripts/testExtractor.ts
import { EmailEntityExtractor } from '../ml/emailEntityExtractor';
import mongoose from 'mongoose';
import { TrainingEmail } from '../models/TrainingEmail';
import dotenv from 'dotenv';

dotenv.config();

async function testExtraction() {
    const extractor = new EmailEntityExtractor();
    
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        // Get 5 different application emails
        const emails = await TrainingEmail.find({ isApplicationEmail: true }).limit(5);
        
        if (emails.length === 0) {
            console.log('No application emails found');
            return;
        }

        for (const email of emails) {
            console.log('\n=== Processing Email ===');
            console.log('Subject:', email.subject);
            console.log('Content:', email.content);
            console.log('From:', email.from);

            const result = await extractor.extractEntities({
                subject: email.subject,
                content: email.content,
                from: email.from
            });
            
            console.log('\nExtracted Entities:');
            console.log(`Company: ${result.company.value} (confidence: ${(result.company.confidence * 100).toFixed(1)}%)`);
            console.log(`Position: ${result.position.value} (confidence: ${(result.position.confidence * 100).toFixed(1)}%)`);
            console.log(`Date Applied: ${result.dateApplied}`);
            console.log('========================\n');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

testExtraction().catch(console.error);