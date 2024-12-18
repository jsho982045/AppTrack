import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TrainingEmail } from '../models/TrainingEmail';
import { extractFeatures } from '../ml/emailProcessor';

dotenv.config();

const testProcessor = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const applicationEmail = await TrainingEmail.findOne({ isApplicationEmail: true });
        const regularEmail = await TrainingEmail.findOne({ isApplicationEmail: false});

        if(applicationEmail) {
            console.log('\nProcessing Application Email:');
            console.log('Original Subject:', applicationEmail.subject);
            const appFeatures = await extractFeatures(applicationEmail);
            console.log('Processed Features:', appFeatures);
        }

        if(regularEmail) {
            console.log('\nProcessing Regular Email:');
            console.log('Original Subject:', regularEmail.subject);
            const regFeatures = await extractFeatures(regularEmail);
            console.log('Processed Features:', regFeatures);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
};

testProcessor();