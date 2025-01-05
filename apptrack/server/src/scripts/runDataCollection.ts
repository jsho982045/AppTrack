// server/src/scripts/runDataCollection.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { collectTrainingEmails } from '../scripts/collectTrainingData';

dotenv.config();

const runCollection = async () => {
    try {
        console.log('Connecting to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI!);

        const db = mongoose.connection;
        console.log('Connected to database:', db.name);
        console.log('Available collections:', await db.db?.listCollections().toArray());
        console.log('Starting training data collection...');
        await collectTrainingEmails();

        console.log('Final collections:', await db.db?.listCollections().toArray());
        
        console.log('Collection process completed');
    } catch (error) {
        console.error('Error in collection process:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
};

runCollection().catch(console.error);